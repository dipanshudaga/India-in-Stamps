import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { StampColor } from '@/constants/theme';
import { stampImageUrl, type Stamp } from '@/data/stamp';
import { useStamps } from '@/data/use-stamps';

import { COLS, HALF, makeLayout, ROW_SHIFT, type ExploreLayout } from './layout';
import { StampPager } from './stamp-pager';

const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

// Cells rendered beyond the viewport on every side. The window is re-centred from JS each time the
// pan crosses a cell boundary, so this has to cover however far a flick travels before that
// re-render lands.
const BUFFER = 2;

const mod = (n: number, m: number) => ((n % m) + m) % m;

function shuffle<T>(input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// An endless grid of stamps on shelf rows. Drag in any direction (it keeps going, wrapping over the
// catalog); tap a stamp and the whole grid zooms toward it while it becomes a hero you can swipe
// sideways through - the pager follows that row, so its neighbours are the cells beside it. Close
// zooms back out to wherever that stamp sits.
export function ExploreScreen() {
  const { stamps } = useStamps();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [openCell, setOpenCell] = useState<{ c: number; r: number } | null>(null);
  const [baseCol, setBaseCol] = useState(0);
  const [baseRow, setBaseRow] = useState(-1);

  // Only stamps that have an image, shuffled once per session like the native Gallery.
  const items = useMemo(() => shuffle(stamps.filter((s) => s.localImageRelativePath)), [stamps]);
  const stampAt = useCallback(
    (c: number, r: number) => items[mod(c + r * ROW_SHIFT, items.length)],
    [items],
  );

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const progress = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const scrollX = useSharedValue(0);

  const L = useMemo(() => (size ? makeLayout(size.w, insets.top) : null), [size, insets.top]);

  // Primitives for the worklets below; they can't close over a possibly-null layout object.
  const cellW = L?.cellW ?? 1;
  const rowH = L?.rowH ?? 1;
  const rowStride = L?.rowStride ?? 1;
  const padTop = L?.padTop ?? 0;
  const zoom = L ? Math.log(L.heroBox / L.imgBox) : 0;
  const gx = (size?.w ?? 0) / 2;
  const gy = (size?.h ?? 0) / 2;
  const hx = L?.heroCx ?? 0;
  const hy = L?.heroCy ?? 0;

  // Re-window the rendered tiles only when the pan crosses a whole-cell boundary - never per frame.
  useAnimatedReaction(
    () => Math.floor(-offsetX.get() / cellW),
    (current, previous) => {
      if (current !== previous) scheduleOnRN(setBaseCol, current);
    },
  );
  useAnimatedReaction(
    () => Math.floor((-offsetY.get() - padTop) / rowStride),
    (current, previous) => {
      if (current !== previous) scheduleOnRN(setBaseRow, current);
    },
  );

  const openAt = useCallback(
    (c: number, r: number, cx: number, cy: number) => {
      if (!L) return;
      originX.set(cx);
      originY.set(cy);
      scrollX.set(HALF * L.pageW);
      setOpenCell({ c, r });
      progress.set(withTiming(1, { duration: 500, easing: EASE_SHEET }));
    },
    [L, originX, originY, scrollX, progress],
  );

  const pan = Gesture.Pan()
    .enabled(openCell === null)
    .minDistance(6)
    // Touching the grid stops a flick in flight, like any scroll view.
    .onBegin(() => {
      offsetX.set(offsetX.get());
      offsetY.set(offsetY.get());
    })
    .onStart(() => {
      startX.set(offsetX.get());
      startY.set(offsetY.get());
    })
    .onUpdate((e) => {
      offsetX.set(startX.get() + e.translationX);
      offsetY.set(startY.get() + e.translationY);
    })
    .onEnd((e) => {
      offsetX.set(withDecay({ velocity: e.velocityX }));
      offsetY.set(withDecay({ velocity: e.velocityY }));
    });

  // Hit-test the tap against the plane instead of putting a Pressable on every tile: tiles stay
  // plain Images, and there's no touch-responder fight with the pan.
  const tap = Gesture.Tap()
    .enabled(openCell === null)
    .maxDuration(350)
    .onEnd((e, success) => {
      if (!success) return;
      const ox = offsetX.get();
      const oy = offsetY.get();
      const c = Math.floor((e.x - ox) / cellW);
      const py = e.y - oy - padTop;
      const r = Math.floor(py / rowStride);
      if (py - r * rowStride > rowH) return;
      const cx = c * cellW + cellW / 2 + ox;
      const cy = padTop + r * rowStride + rowH / 2 + oy;
      scheduleOnRN(openAt, c, r, cx, cy);
    });

  const gesture = Gesture.Race(pan, tap);

  const planeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }],
  }));
  const bandsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.get() }],
  }));

  // The grid is scaled about its own centre, so to make the tapped cell land on the hero we solve
  // for the translation that keeps that cell on a straight line from where it was to the hero.
  // Scale is interpolated in log space so the zoom reads as a constant-rate camera push.
  const zoomStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const opacity = interpolate(p, [0, 0.6, 0.95], [1, 0.5, 0], Extrapolation.CLAMP);
    if (reduced) return { opacity };

    const ox = originX.get();
    const oy = originY.get();
    const scale = Math.exp(zoom * p);
    const targetX = ox + (hx - ox) * p;
    const targetY = oy + (hy - oy) * p;
    return {
      opacity,
      transform: [
        { translateX: targetX - gx - scale * (ox - gx) },
        { translateY: targetY - gy - scale * (oy - gy) },
        { scale },
      ],
    };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.45, 0.9], [0, 1], Extrapolation.CLAMP),
  }));

  const close = useCallback(() => {
    if (!L || !size || !openCell) return;

    // Zoom back out onto the stamp the user ended on, which may be several columns from the one
    // they tapped. If it's off-screen, slide the plane so it's centred first (invisible: the grid
    // is fully faded at this point).
    const page = Math.round(scrollX.get() / L.pageW);
    const col = openCell.c + (page - HALF);
    const centreX = col * L.cellW + L.cellW / 2;
    let ox = offsetX.get();
    if (centreX + ox < L.cellW / 2 || centreX + ox > size.w - L.cellW / 2) {
      ox = size.w / 2 - centreX;
      offsetX.set(ox);
    }
    originX.set(centreX + ox);
    originY.set(L.padTop + openCell.r * L.rowStride + L.rowH / 2 + offsetY.get());

    progress.set(
      withTiming(0, { duration: 400, easing: EASE_SHEET }, (finished) => {
        if (finished) scheduleOnRN(setOpenCell, null);
      }),
    );
  }, [L, size, openCell, scrollX, offsetX, offsetY, originX, originY, progress]);

  useEffect(() => {
    if (!openCell) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [openCell, close]);

  // The pager runs along the tapped row: page k is the stamp k cells to the right of the tapped one.
  const pagerStamps = useMemo(
    () =>
      openCell
        ? Array.from({ length: HALF * 2 + 1 }, (_, k) => stampAt(openCell.c + k - HALF, openCell.r))
        : [],
    [openCell, stampAt],
  );

  const tiles = [];
  const bands = [];
  if (L && size) {
    const visibleRows = Math.ceil(size.h / L.rowStride) + 1;
    for (let r = baseRow - BUFFER; r <= baseRow + visibleRows + BUFFER; r++) {
      const top = L.padTop + r * L.rowStride;
      bands.push(<View key={r} style={[styles.band, { top, height: L.rowH }]} />);
      for (let c = baseCol - BUFFER; c <= baseCol + COLS + BUFFER; c++) {
        tiles.push(<Tile key={`${c},${r}`} stamp={stampAt(c, r)} left={c * L.cellW} top={top} L={L} />);
      }
    }
  }

  return (
    <View
      style={styles.root}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {L && size && (
        <>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
              <Animated.View style={[StyleSheet.absoluteFill, bandsStyle]}>{bands}</Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, planeStyle]}>{tiles}</Animated.View>
            </Animated.View>
          </GestureDetector>

          {openCell && (
            <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
              <StampPager
                stamps={pagerStamps}
                initialIndex={HALF}
                L={L}
                scrollX={scrollX}
                topInset={insets.top}
                onClose={close}
              />
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

type TileProps = { stamp: Stamp; left: number; top: number; L: ExploreLayout };

const Tile = memo(function Tile({ stamp, left, top, L }: TileProps) {
  const uri = stampImageUrl(stamp, 'thumb');
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: L.cellW,
        height: L.rowH,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Image
        source={uri ? { uri } : undefined}
        contentFit="contain"
        style={{ width: L.imgBox, height: L.imgBox }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: StampColor.bgPage },
  overlay: { backgroundColor: StampColor.bgPage },
  // Shelves run edge to edge: the grid is endless sideways too, so a band has no ends to round.
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    boxShadow: '0 1px 2px rgba(60,40,10,0.07)',
  },
});
