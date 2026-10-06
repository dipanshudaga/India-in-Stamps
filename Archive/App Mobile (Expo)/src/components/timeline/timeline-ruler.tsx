import { memo } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  scrollTo,
  useAnimatedStyle,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';

import { StampColor } from '@/constants/theme';
import type { Stamp } from '@/data/stamp';

const TICK_SPACING = 26;
const WINDOW = 16;
const TICK_AREA = 66;
const TICK_W = 4;
const TICK_H = 34;

type Props = {
  stamps: Stamp[];
  index: number;
  position: SharedValue<number>;
  listRef: AnimatedRef<FlatList<Stamp>>;
  pageWidth: number;
};

// Port of `TimelineRuler.swift`: one tick per stamp around the current one, tapering with distance,
// with a year "reel" above (previous - current - next). The pager's float scroll position drives
// every tick on the UI thread, so the ticks slide continuously with a swipe; dragging the ruler
// steps the pager one stamp per tick-width.
export function TimelineRuler({ stamps, index, position, listRef, pageWidth }: Props) {
  const { width } = useWindowDimensions();
  const startIndex = useSharedValue(0);
  const total = stamps.length;

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      startIndex.set(Math.round(position.get()));
    })
    .onUpdate((e) => {
      const steps = Math.round(-e.translationX / TICK_SPACING);
      const target = Math.min(Math.max(startIndex.get() + steps, 0), total - 1);
      scrollTo(listRef, target * pageWidth, 0, false);
    });

  const year = stamps[index]?.year ?? 0;
  // Scan outward from the current stamp (the list is chronological) rather than de-duping all 3,000.
  let previousYear: number | null = null;
  for (let i = index - 1; i >= 0; i--) {
    if (stamps[i].year !== year) {
      previousYear = stamps[i].year;
      break;
    }
  }
  let nextYear: number | null = null;
  for (let i = index + 1; i < total; i++) {
    if (stamps[i].year !== year) {
      nextYear = stamps[i].year;
      break;
    }
  }

  const lower = Math.max(0, index - WINDOW);
  const upper = Math.min(total - 1, index + WINDOW);
  const ticks = [];
  for (let i = lower; i <= upper; i++) ticks.push(<Tick key={i} i={i} position={position} center={width / 2} />);

  return (
    <View style={styles.root}>
      <View style={styles.reel}>
        {previousYear !== null && <Text style={[styles.sideYear, { left: width / 2 - 92 - 28 }]}>{previousYear}</Text>}
        {nextYear !== null && <Text style={[styles.sideYear, { left: width / 2 + 92 - 28 }]}>{nextYear}</Text>}
        <Text style={styles.year}>{year}</Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={styles.ticks} accessibilityLabel="Timeline scrubber" accessibilityHint="Drag to move through stamps chronologically">
          {ticks}
        </View>
      </GestureDetector>
    </View>
  );
}

type TickProps = { i: number; position: SharedValue<number>; center: number };

const Tick = memo(function Tick({ i, position, center }: TickProps) {
  const style = useAnimatedStyle(() => {
    const d = i - position.get();
    const away = Math.abs(d);
    const normalized = Math.min(away / 7, 1);
    const taper = 1 - normalized * normalized * 0.72;
    // The tick nearest the centre reads as the "selected" landmark - longer, not just tinted.
    const boost = 1 + 0.4 * Math.max(0, 1 - away * 2);
    return {
      backgroundColor: interpolateColor(Math.min(away, 1), [0, 1], [StampColor.accentPrimary, StampColor.inkTertiary]),
      transform: [
        { translateX: center + d * TICK_SPACING - TICK_W / 2 },
        { scaleX: taper },
        { scaleY: taper * boost },
      ],
    };
  });
  return <Animated.View style={[styles.tick, style]} />;
});

const styles = StyleSheet.create({
  root: { height: 110 },
  reel: { height: 34, justifyContent: 'center' },
  year: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: StampColor.inkPrimary,
    fontVariant: ['tabular-nums'],
  },
  sideYear: {
    position: 'absolute',
    width: 56,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '500',
    color: StampColor.inkTertiary,
    opacity: 0.45,
  },
  ticks: { height: TICK_AREA, marginTop: 6 },
  tick: {
    position: 'absolute',
    left: 0,
    top: (TICK_AREA - TICK_H) / 2,
    width: TICK_W,
    height: TICK_H,
    borderRadius: TICK_W / 2,
  },
});
