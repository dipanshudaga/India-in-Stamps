/* eslint-disable react-hooks/refs --
   Camera state lives in a ref that gesture callbacks mutate and the render loop reads; the rule
   (written for render-pure code) can't tell those callbacks never run during render. */
import { Canvas } from '@react-three/fiber/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StampDetail } from '@/components/stamp-detail';
import { BottomTabInset, Fonts, StampColor } from '@/constants/theme';
import { IMAGE_BASE_URL, type Stamp } from '@/data/stamp';
import { useStamps } from '@/data/use-stamps';

import {
  IDS,
  LENSES,
  PITCH,
  SHEETS,
  SIZE,
  stampAtCell,
  yearAt,
  type Lens,
} from './wall-data';
import { FOV, WallScene, Z_MAX, Z_MIN, type Controls, type Stats } from './wall-scene';

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// "The Wall of India": every stamp as one instance in a single 3D scene. A lens switch morphs all
// ~3,000 of them to a new arrangement on the GPU. This is the P0 feasibility spike - Time and Colour
// lenses only - with a live performance readout so the 60fps gate can be judged from real numbers.
export function WallScreen() {
  // Imperative by nature (camera state in a ref, mutated from gesture callbacks): opt out of the React
  // Compiler, whose ref/immutability lint rules assume render-pure code.
  'use no memo';
  const insets = useSafeAreaInsets();
  const { stamps } = useStamps();

  const [lens, setLens] = useState<Lens>('time');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flipY, setFlipY] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Stamp | null>(null);

  const controls = useRef<Controls>({ x: 8, y: 8, z: 20, vx: 0, vy: 0, dragging: false, viewW: 390, viewH: 800 });
  const startZ = useRef(20);

  const sheetUrls = useMemo(
    () => (IMAGE_BASE_URL ? Array.from({ length: SHEETS }, (_, i) => `${IMAGE_BASE_URL}/atlas/${i}.png`) : []),
    [],
  );
  const stampsById = useMemo(() => new Map(stamps.map((s) => [s.id, s])), [stamps]);

  // World units per screen pixel at the z=0 plane the stamps sit on.
  const unitsPerPx = (c: Controls) => (2 * c.z * Math.tan((FOV * Math.PI) / 360)) / c.viewH;

  const pick = (x: number, y: number) => {
    if (busy) return;
    const c = controls.current;
    const u = unitsPerPx(c);
    const wx = c.x + (x - c.viewW / 2) * u;
    const wy = c.y - (y - c.viewH / 2) * u;
    const gx = Math.round(wx / PITCH);
    const gy = Math.round(wy / PITCH);
    // Only a hit if the tap landed on the stamp, not in the gap between cells.
    if (Math.abs(wx - gx * PITCH) > SIZE / 2 || Math.abs(wy - gy * PITCH) > SIZE / 2) return;
    const index = stampAtCell(lens, gx, gy);
    const stamp = index === undefined ? undefined : stampsById.get(IDS[index]);
    if (stamp) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelected(stamp);
    }
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(4)
    .onBegin(() => {
      const c = controls.current;
      c.dragging = true;
      c.vx = 0;
      c.vy = 0;
    })
    .onChange((e) => {
      const c = controls.current;
      const u = unitsPerPx(c);
      c.x -= e.changeX * u;
      c.y += e.changeY * u;
    })
    .onEnd((e) => {
      const c = controls.current;
      const u = unitsPerPx(c);
      c.vx = -e.velocityX * u;
      c.vy = e.velocityY * u;
    })
    .onFinalize(() => {
      controls.current.dragging = false;
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      startZ.current = controls.current.z;
    })
    .onUpdate((e) => {
      controls.current.z = clamp(startZ.current / e.scale, Z_MIN, Z_MAX);
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(300)
    .onEnd((e, success) => {
      if (success) pick(e.x, e.y);
    });

  const gesture = Gesture.Race(tap, Gesture.Simultaneous(pan, pinch));

  const onReady = useCallback(() => setReady(true), []);
  const onBusy = useCallback((b: boolean) => setBusy(b), []);

  const switchLens = (next: Lens) => {
    if (busy || next === lens) return;
    Haptics.selectionAsync();
    setLens(next);
  };

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        controls.current.viewW = e.nativeEvent.layout.width;
        controls.current.viewH = e.nativeEvent.layout.height;
      }}>
      {sheetUrls.length > 0 && (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill}>
            <Canvas
              camera={{ position: [0, 0, 20], fov: FOV, near: 0.1, far: 2000 }}
              onCreated={({ gl }) => gl.setClearColor(StampColor.bgPage)}>
              <WallScene
                lens={lens}
                controls={controls}
                flipY={flipY}
                sheetUrls={sheetUrls}
                onReady={onReady}
                onBusy={onBusy}
                onStats={setStats}
              />
            </Canvas>
          </View>
        </GestureDetector>
      )}

      {sheetUrls.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.message}>No image server found.{'\n'}Run `npm run images` and reload.</Text>
        </View>
      )}

      {sheetUrls.length > 0 && !ready && (
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.message}>Loading the wall...</Text>
          <Text style={styles.hint}>First run downloads {SHEETS} atlas sheets (about 30MB), then it is cached.</Text>
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => setFlipY((f) => !f)} style={styles.hud} accessibilityLabel="Toggle texture flip">
          <Text style={styles.hudText}>
            {stats ? `${stats.fps} fps  ·  ${stats.calls} calls  ·  ${(stats.tris / 1000).toFixed(1)}k tris` : 'starting'}
            {'  ·  flip '}
            {flipY ? 'on' : 'off'}
          </Text>
        </Pressable>
        {lens === 'time' && stats && <Text style={styles.year}>{yearAt(stats.gx)}</Text>}
      </View>

      <View style={[styles.lenses, { bottom: insets.bottom + BottomTabInset + 12 }]} pointerEvents="box-none">
        <View style={styles.segment}>
          {LENSES.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => switchLens(key)}
              style={[styles.segmentItem, key === lens && styles.segmentActive, busy && key !== lens && styles.segmentBusy]}
              accessibilityRole="button"
              accessibilityLabel={`${label} lens`}>
              <Text style={[styles.segmentText, key === lens && styles.segmentTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <StampDetail stamp={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: StampColor.bgPage },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  message: { fontSize: 17, textAlign: 'center', color: StampColor.inkSecondary },
  hint: { fontSize: 13, textAlign: 'center', color: StampColor.inkTertiary },
  top: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', gap: 6 },
  hud: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(38,34,29,0.72)' },
  hudText: { fontSize: 11, color: '#fff', fontVariant: ['tabular-nums'] },
  year: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    fontWeight: '700',
    color: StampColor.inkPrimary,
    textShadowColor: 'rgba(250,248,244,0.9)',
    textShadowRadius: 8,
  },
  lenses: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    boxShadow: '0 2px 10px rgba(60,40,10,0.18)',
  },
  segmentItem: { paddingHorizontal: 22, paddingVertical: 9, borderRadius: 999 },
  segmentActive: { backgroundColor: StampColor.inkPrimary },
  segmentBusy: { opacity: 0.4 },
  segmentText: { fontSize: 15, fontWeight: '600', color: StampColor.inkSecondary },
  segmentTextActive: { color: StampColor.bgPage },
});
