"use client";

/* eslint-disable react-hooks/immutability --
   The camera `Controls` object exists to be mutated from pointer/wheel handlers and read by the render
   loop; routing every pointer event through React state would re-render per event. */

import { useEffect, useRef, type RefObject } from "react";

import { FOV, Z_MAX, Z_MIN, type Controls } from "./wall-scene";

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Fastest release velocity that still carries, in screen pixels per second.
const MAX_FLICK_PX_PER_S = 2200;

// World units per screen pixel on the z=0 plane the stamps sit on.
export const unitsPerPx = (c: Controls) => (2 * c.z * Math.tan((FOV * Math.PI) / 360)) / c.viewH;

// Mouse / touch / trackpad / keyboard control of the wall camera, all writing into one mutable
// `Controls` object that the render loop reads (so no React render per pointer event):
//   drag = pan with inertia, wheel or trackpad pinch = zoom toward the cursor, two fingers = pinch,
//   a short click without movement = pick, arrow keys / + / - = keyboard pan and zoom.
export function useWallControls(
  target: RefObject<HTMLElement | null>,
  controls: RefObject<Controls>,
  onPick: (x: number, y: number) => void,
) {
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  });

  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const c = controls.current;

    const pointers = new Map<number, { x: number; y: number }>();
    let down = { x: 0, y: 0, t: 0, moved: false };
    let lastMove = 0;
    let pinchDist = 0;
    let pinchZ = 0;

    const measure = () => {
      const r = node.getBoundingClientRect();
      c.viewW = r.width;
      c.viewH = r.height;
    };
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    measure();

    const onDown = (e: PointerEvent) => {
      node.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        c.dragging = true;
        c.vx = 0;
        c.vy = 0;
        down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
        lastMove = performance.now();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchZ = c.z;
        down.moved = true;
        c.dragging = false;
      }
    };

    const onMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0 && dist > 0) c.z = clamp((pinchZ * pinchDist) / dist, Z_MIN, Z_MAX);
        return;
      }
      if (!c.dragging) return;
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;

      const u = unitsPerPx(c);
      c.x -= dx * u;
      c.y += dy * u;
      const now = performance.now();
      const dt = Math.max(1, now - lastMove) / 1000;
      lastMove = now;
      // Smoothed release velocity, so a flick carries and a slow drag doesn't - capped, because a
      // single huge pointer jump (a fast swipe, a synthetic drag) divides by a tiny dt and would
      // otherwise fling the camera across the whole wall.
      const maxV = MAX_FLICK_PX_PER_S * u;
      c.vx = clamp(0.6 * c.vx + 0.4 * ((-dx * u) / dt), -maxV, maxV);
      c.vy = clamp(0.6 * c.vy + 0.4 * ((dy * u) / dt), -maxV, maxV);
    };

    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size === 0) {
        c.dragging = false;
        if (performance.now() - lastMove > 80) {
          c.vx = 0;
          c.vy = 0;
        }
        if (!down.moved && performance.now() - down.t < 400) {
          const r = node.getBoundingClientRect();
          pick.current(e.clientX - r.left, e.clientY - r.top);
        }
      } else if (pointers.size === 1) {
        c.dragging = true;
        c.vx = 0;
        c.vy = 0;
        lastMove = performance.now();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = node.getBoundingClientRect();
      const cx = e.clientX - r.left - c.viewW / 2;
      const cy = e.clientY - r.top - c.viewH / 2;
      const before = unitsPerPx(c);
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      c.z = clamp(c.z * Math.exp(delta * (e.ctrlKey ? 0.01 : 0.0015)), Z_MIN, Z_MAX);
      const after = unitsPerPx(c);
      // Zoom toward the cursor: keep the world point under it fixed.
      c.x += cx * (before - after);
      c.y -= cy * (before - after);
    };

    const onKey = (e: KeyboardEvent) => {
      const step = 14 * unitsPerPx(c);
      if (e.key === "ArrowLeft") c.vx = -step * 4;
      else if (e.key === "ArrowRight") c.vx = step * 4;
      else if (e.key === "ArrowUp") c.vy = step * 4;
      else if (e.key === "ArrowDown") c.vy = -step * 4;
      else if (e.key === "+" || e.key === "=") c.z = clamp(c.z * 0.8, Z_MIN, Z_MAX);
      else if (e.key === "-" || e.key === "_") c.z = clamp(c.z * 1.25, Z_MIN, Z_MAX);
      else return;
      e.preventDefault();
    };

    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onUp);
    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("keydown", onKey);
    return () => {
      resize.disconnect();
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onUp);
      node.removeEventListener("pointercancel", onUp);
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("keydown", onKey);
    };
  }, [target, controls]);
}
