import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Fonts, StampColor } from '@/constants/theme';
import { denominationDisplay, stampImageUrl, type Stamp } from '@/data/stamp';

import type { ExploreLayout } from './layout';

type Props = {
  stamps: Stamp[];
  initialIndex: number;
  L: ExploreLayout;
  scrollX: SharedValue<number>;
  topInset: number;
  onClose: () => void;
};

// Horizontal pager whose pages are narrower than the screen, so the neighbouring stamps peek in at
// the edges. Everything that reacts to the swipe (neighbour fade/shrink, text crossfade) is derived
// from `scrollX` on the UI thread - no React state changes while a finger is down.
export function StampPager({ stamps, initialIndex, L, scrollX, topInset, onClose }: Props) {
  const { pageW } = L;
  const heroTop = L.heroCy - L.heroBox / 2;
  const heroBottom = heroTop + L.heroBox;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.set(event.contentOffset.x);
  });

  // A tick each time the centred page changes, fired when the drag crosses the midpoint - the same
  // frame the title swaps - rather than when the scroll settles.
  useAnimatedReaction(
    () => Math.round(scrollX.get() / pageW),
    (current, previous) => {
      if (previous !== null && current !== previous) scheduleOnRN(Haptics.selectionAsync);
    },
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.panel, { top: heroBottom + 16 }]} />
      <View style={[styles.shelf, { top: heroBottom + 6 }]} />

      <Animated.FlatList
        data={stamps}
        horizontal
        keyExtractor={(stamp) => String(stamp.id)}
        renderItem={({ item, index }) => <Page stamp={item} index={index} L={L} scrollX={scrollX} />}
        getItemLayout={(_, index) => ({ length: pageW, offset: pageW * index, index })}
        initialScrollIndex={initialIndex}
        snapToInterval={pageW}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: (L.width - pageW) / 2 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={3}
        style={[styles.list, { top: heroTop }]}
      />

      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={[styles.close, { top: topInset + 8 }]}>
        <View style={[styles.closeBar, { transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.closeBar, styles.closeBarCross]} />
      </Pressable>
    </View>
  );
}

type PageProps = { stamp: Stamp; index: number; L: ExploreLayout; scrollX: SharedValue<number> };

const Page = memo(function Page({ stamp, index, L, scrollX }: PageProps) {
  const heroStyle = useAnimatedStyle(() => {
    const away = Math.abs(index - scrollX.get() / L.pageW);
    return {
      opacity: interpolate(away, [0, 1], [1, 0.4], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(away, [0, 1], [1, 0.8], Extrapolation.CLAMP) }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const away = Math.abs(index - scrollX.get() / L.pageW);
    return { opacity: interpolate(away, [0, 0.45], [1, 0], Extrapolation.CLAMP) };
  });

  const full = stampImageUrl(stamp, 'full');
  const thumb = stampImageUrl(stamp, 'thumb');
  const textWidth = L.width - 48;

  return (
    <View style={{ width: L.pageW }}>
      <Animated.View
        style={[{ width: L.heroBox, height: L.heroBox, marginLeft: (L.pageW - L.heroBox) / 2 }, heroStyle]}>
        <Image
          source={full ? { uri: full } : undefined}
          placeholder={thumb ? { uri: thumb } : undefined}
          placeholderContentFit="contain"
          contentFit="contain"
          transition={180}
          style={styles.fill}
        />
      </Animated.View>

      <Animated.View
        style={[{ width: textWidth, marginLeft: (L.pageW - textWidth) / 2, marginTop: 48 }, textStyle]}>
        <Text style={styles.label}>{stamp.type}</Text>
        <Text style={styles.title}>{stamp.name}</Text>
        <Text style={styles.meta}>
          {denominationDisplay(stamp)}  ·  {stamp.issueDateDisplay}
        </Text>
        <Text style={styles.description}>{stamp.description}</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  shelf: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    boxShadow: '0 1px 2px rgba(60,40,10,0.08)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243,240,233,0.75)',
  },
  close: {
    position: 'absolute',
    right: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBar: { position: 'absolute', width: 20, height: 2, borderRadius: 1, backgroundColor: StampColor.inkSecondary },
  closeBarCross: { transform: [{ rotate: '-45deg' }] },
  label: { fontSize: 13, letterSpacing: 0.3, color: StampColor.inkTertiary },
  title: {
    marginTop: 4,
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '500',
    color: StampColor.inkPrimary,
  },
  meta: { marginTop: 6, fontSize: 15, color: StampColor.inkSecondary },
  description: { marginTop: 16, fontSize: 16, lineHeight: 24, color: StampColor.inkPrimary },
});
