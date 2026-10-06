import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { StampDetail } from '@/components/stamp-detail';
import { StampImage } from '@/components/stamp-image';
import { BottomTabInset, Fonts, StampColor } from '@/constants/theme';
import { stampImageUrl, type Stamp } from '@/data/stamp';
import { useStamps } from '@/data/use-stamps';

import { TimelineRuler } from './timeline-ruler';

const PAGE_HEIGHT = 320;

// Port of `TimelineView.swift`: one stamp shown large, with a horizontal scrubber beneath. The
// stamp pager is a native paged scroll (the same mechanism Photos uses) rather than hand-rolled
// offset/transition code - two custom approaches were tried natively and both broke direction or
// smoothness. Its float scroll offset (`position`) is the single source of truth: the ruler's ticks,
// the year reel and the haptics are all derived from it, so swiping and scrubbing can't disagree.
export function TimelineScreen() {
  const { chronological } = useStamps();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Stamp | null>(null);

  const position = useSharedValue(0);
  const listRef = useAnimatedRef<FlatList<Stamp>>();

  const onScroll = useAnimatedScrollHandler((event) => {
    position.set(event.contentOffset.x / width);
  });

  // React state and the haptic only change when the centred stamp changes - never per frame.
  useAnimatedReaction(
    () => Math.min(Math.max(Math.round(position.get()), 0), chronological.length - 1),
    (current, previous) => {
      if (previous === null || current === previous) return;
      scheduleOnRN(setIndex, current);
      scheduleOnRN(Haptics.selectionAsync);
    },
  );

  // Warm the cache for the stamps a swipe would land on next, so a page never lands blank.
  useEffect(() => {
    const urls: string[] = [];
    for (const offset of [-2, -1, 1, 2]) {
      const stamp = chronological[index + offset];
      const url = stamp && stampImageUrl(stamp, 'full');
      if (url) urls.push(url);
    }
    if (urls.length) Image.prefetch(urls, 'disk').catch(() => {});
  }, [index, chronological]);

  return (
    <View style={styles.root}>
      <Text style={[styles.title, { marginTop: insets.top + 12 }]}>Timeline</Text>

      <View style={styles.stage}>
        <Animated.FlatList
          ref={listRef}
          data={chronological}
          horizontal
          pagingEnabled
          keyExtractor={(stamp) => String(stamp.id)}
          renderItem={({ item, index: i }) => (
            <Page stamp={item} index={i} width={width} position={position} onOpen={setSelected} />
          )}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialNumToRender={3}
          windowSize={5}
          maxToRenderPerBatch={3}
          style={styles.pager}
        />
      </View>

      <View style={{ paddingBottom: insets.bottom + BottomTabInset + 8 }}>
        <TimelineRuler
          stamps={chronological}
          index={index}
          position={position}
          listRef={listRef}
          pageWidth={width}
        />
      </View>

      <StampDetail stamp={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

type PageProps = {
  stamp: Stamp;
  index: number;
  width: number;
  position: SharedValue<number>;
  onOpen: (stamp: Stamp) => void;
};

const Page = memo(function Page({ stamp, index, width, position, onOpen }: PageProps) {
  const hero = Math.min(width * 0.78, 300);

  // Neighbours recede slightly as they slide through - depth without a second layer.
  const style = useAnimatedStyle(() => {
    const away = Math.min(Math.abs(index - position.get()), 1);
    return { opacity: 1 - away * 0.4, transform: [{ scale: 1 - away * 0.1 }] };
  });

  return (
    <View style={{ width, height: PAGE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={style}>
        <Pressable
          onPress={() => onOpen(stamp)}
          accessibilityRole="button"
          accessibilityLabel={stamp.name}
          accessibilityHint="Swipe left or right to browse, tap to view details">
          <StampImage stamp={stamp} variant="full" transition={150} style={{ width: hero, height: hero }} />
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: StampColor.bgPage },
  title: {
    paddingHorizontal: 20,
    fontFamily: Fonts.serif,
    fontSize: 34,
    fontWeight: '700',
    color: StampColor.inkPrimary,
  },
  stage: { flex: 1, justifyContent: 'center' },
  pager: { flexGrow: 0, height: PAGE_HEIGHT },
});
