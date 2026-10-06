"use client";

/* eslint-disable react-hooks/immutability --
   Imperative GL scene: three.js meshes, attributes and uniforms are mutated every frame, which this
   rule (written for render-pure code) rejects. */

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import {
  ATLAS_URLS,
  CELL_UV,
  COUNT,
  HEIGHT,
  LAYOUTS,
  PER_ROW,
  PER_SHEET,
  PITCH,
  SIZE,
  WIDTH,
  yearAt,
  type Lens,
} from "./wall-data";

// Camera state, written by pointer/wheel handlers and read by the render loop. A plain mutable object
// in a ref: nothing here should trigger a React render per frame.
export type Controls = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  dragging: boolean;
  viewW: number;
  viewH: number;
};

export type Stats = { fps: number; calls: number; tris: number; gx: number };

export const FOV = 50;
export const Z_MIN = 6;
export const Z_MAX = 520;

const MORPH_SECONDS = 1.1;
const DECAY = 3.2; // inertia decay rate, 1/s

// The lens morph runs entirely on the GPU: every stamp carries its `from` and `to` position as
// instance attributes, and one `uProgress` uniform drives all ~3,000 of them. A per-stamp stagger
// (by target x) turns it into a left-to-right wave, and the sin() lift arcs each stamp toward the
// viewer while it travels, like cards dealt across a table.
const VERTEX = /* glsl */ `
attribute vec2 aFrom;
attribute vec2 aTo;
attribute vec2 aCell;
attribute float aStagger;
uniform float uProgress;
uniform float uSize;
uniform float uLift;
uniform float uCellUv;
varying vec2 vUv;

void main() {
  float t = clamp((uProgress - aStagger * 0.45) / 0.55, 0.0, 1.0);
  float e = t * t * (3.0 - 2.0 * t);
  vec2 p = mix(aFrom, aTo, e);
  float lift = sin(e * 3.14159265) * uLift;
  vec3 world = vec3(p + position.xy * uSize, lift);

  // Atlas lookup. Cell row 0 is the TOP of the sheet image; three flips uploaded images vertically.
  float vy = 1.0 - (aCell.y + 1.0) * uCellUv + uv.y * uCellUv;
  vUv = vec2((aCell.x + uv.x) * uCellUv, vy);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;

void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.04) discard;
  gl_FragColor = vec4(c.rgb, c.a);
}
`;

type SceneProps = {
  lens: Lens;
  controls: RefObject<Controls>;
  onReady: () => void;
  onBusy: (busy: boolean) => void;
  onYear: (year: number) => void;
  onStats?: (stats: Stats) => void;
};

export function WallScene(props: SceneProps) {
  return (
    <Suspense fallback={null}>
      <Sheets {...props} />
    </Suspense>
  );
}

// One mesh per atlas sheet (5 draw calls for the whole wall). Each is an instanced quad; a stamp's
// sheet / cell are fixed by its wall index, only its position changes between lenses.
function buildMeshes(textures: THREE.Texture[], maxAnisotropy: number) {
  const base = new THREE.PlaneGeometry(1, 1);
  return textures.map((texture, sheet) => {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, maxAnisotropy);
    texture.colorSpace = THREE.NoColorSpace;
    texture.needsUpdate = true;

    const offset = sheet * PER_SHEET;
    const count = Math.min(PER_SHEET, COUNT - offset);
    const from = new Float32Array(count * 2);
    const to = new Float32Array(count * 2);
    const cell = new Float32Array(count * 2);
    const stagger = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      from[i * 2] = to[i * 2] = LAYOUTS.time[(offset + i) * 2];
      from[i * 2 + 1] = to[i * 2 + 1] = LAYOUTS.time[(offset + i) * 2 + 1];
      cell[i * 2] = i % PER_ROW;
      cell[i * 2 + 1] = Math.floor(i / PER_ROW);
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.setAttribute("position", base.getAttribute("position"));
    geometry.setAttribute("uv", base.getAttribute("uv"));
    geometry.instanceCount = count;
    geometry.setAttribute("aFrom", new THREE.InstancedBufferAttribute(from, 2));
    geometry.setAttribute("aTo", new THREE.InstancedBufferAttribute(to, 2));
    geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(cell, 2));
    geometry.setAttribute("aStagger", new THREE.InstancedBufferAttribute(stagger, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: texture },
        uProgress: { value: 1 },
        uSize: { value: SIZE },
        uLift: { value: 4 },
        uCellUv: { value: CELL_UV },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.userData.offset = offset;
    return mesh;
  });
}

function Sheets({ lens, controls, onReady, onBusy, onYear, onStats }: SceneProps) {
  const textures = useLoader(THREE.TextureLoader, ATLAS_URLS) as THREE.Texture[];
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const meshes = useMemo(
    () => buildMeshes(textures, gl.capabilities.getMaxAnisotropy()),
    [textures, gl],
  );
  const run = useRef({ progress: 1, busy: false, applied: "time" as Lens, frames: 0, acc: 0, year: 0 });

  useEffect(() => {
    onReady();
  }, [onReady]);

  useEffect(() => {
    return () => {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    };
  }, [meshes]);

  // Lens change: current targets become the new origins, the new layout becomes the target, and the
  // morph timeline restarts.
  useEffect(() => {
    const state = run.current;
    if (lens === state.applied) return;
    const target = LAYOUTS[lens];
    for (const mesh of meshes) {
      const offset = mesh.userData.offset as number;
      const from = mesh.geometry.getAttribute("aFrom") as THREE.InstancedBufferAttribute;
      const to = mesh.geometry.getAttribute("aTo") as THREE.InstancedBufferAttribute;
      const stagger = mesh.geometry.getAttribute("aStagger") as THREE.InstancedBufferAttribute;
      (from.array as Float32Array).set(to.array as Float32Array);
      for (let i = 0; i < to.count; i++) {
        const x = target[(offset + i) * 2];
        (to.array as Float32Array)[i * 2] = x;
        (to.array as Float32Array)[i * 2 + 1] = target[(offset + i) * 2 + 1];
        (stagger.array as Float32Array)[i] = Math.min(1, x / WIDTH[lens]);
      }
      from.needsUpdate = true;
      to.needsUpdate = true;
      stagger.needsUpdate = true;
      (mesh.material as THREE.ShaderMaterial).uniforms.uProgress.value = 0;
    }
    state.applied = lens;
    state.progress = 0;
    state.busy = true;
    onBusy(true);
  }, [lens, meshes, onBusy]);

  useFrame((rs, delta) => {
    const c = controls.current;
    const state = run.current;

    // Pan inertia: velocity decays exponentially (rate DECAY), and the distance covered this frame is
    // the exact integral of that decay - not velocity x delta, which overshoots badly on a long frame
    // (a throttled background tab, a hiccup) and made the glide depend on frame rate.
    if (!c.dragging) {
      const k = Math.exp(-delta * DECAY);
      const travel = (1 - k) / DECAY;
      c.x += c.vx * travel;
      c.y += c.vy * travel;
      c.vx *= k;
      c.vy *= k;
    }
    c.x = Math.min(Math.max(c.x, -2), WIDTH[state.applied] + 2);
    c.y = Math.min(Math.max(c.y, -2), HEIGHT + 2);
    camera.position.set(c.x, c.y, c.z);

    // Report the year under the camera only when it changes (a label, not a per-frame React render).
    const year = yearAt(c.x / PITCH);
    if (year !== state.year) {
      state.year = year;
      onYear(year);
    }

    if (state.busy) {
      state.progress = Math.min(1, state.progress + delta / MORPH_SECONDS);
      for (const mesh of meshes) (mesh.material as THREE.ShaderMaterial).uniforms.uProgress.value = state.progress;
      if (state.progress >= 1) {
        state.busy = false;
        onBusy(false);
      }
    }

    state.frames++;
    state.acc += delta;
    if (state.acc >= 0.5) {
      onStats?.({
        fps: Math.round(state.frames / state.acc),
        calls: rs.gl.info.render.calls,
        tris: rs.gl.info.render.triangles,
        gx: c.x / PITCH,
      });
      state.frames = 0;
      state.acc = 0;
    }
  });

  return (
    <>
      {meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </>
  );
}
