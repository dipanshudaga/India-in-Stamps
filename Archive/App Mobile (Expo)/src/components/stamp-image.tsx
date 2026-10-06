import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { StampColor } from '@/constants/theme';
import { stampImageUrl, type ImageVariant, type Stamp } from '@/data/stamp';

type Props = {
  stamp: Stamp;
  variant: ImageVariant;
  style?: StyleProp<ImageStyle>;
  transition?: number;
};

// A stamp image, or the archival "no image" placeholder (30 stamps have no source file - treated as
// a normal state, not an error). The full-size variant shows the thumbnail while it loads, so a
// stamp that's already on screen elsewhere never flashes blank.
export function StampImage({ stamp, variant, style, transition = 0 }: Props) {
  const uri = stampImageUrl(stamp, variant);
  if (!uri) {
    return (
      <View style={[styles.missing, style as StyleProp<ViewStyle>]}>
        <Text style={styles.missingText}>No image</Text>
      </View>
    );
  }
  const thumb = variant === 'full' ? stampImageUrl(stamp, 'thumb') : null;
  return (
    <Image
      source={{ uri }}
      placeholder={thumb ? { uri: thumb } : undefined}
      placeholderContentFit="contain"
      contentFit="contain"
      transition={transition}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: StampColor.accentStructural,
    borderRadius: 6,
  },
  missingText: { fontSize: 11, color: StampColor.inkTertiary },
});
