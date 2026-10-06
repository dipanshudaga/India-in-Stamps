import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { StampColor } from '@/constants/theme';

// An X drawn from two bars - this SDK's template ships no icon font, and a 44pt target is all it needs.
export function CloseButton({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={[styles.button, style]}>
      <View style={[styles.bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.bar, { transform: [{ rotate: '-45deg' }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bar: {
    position: 'absolute',
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: StampColor.inkSecondary,
  },
});
