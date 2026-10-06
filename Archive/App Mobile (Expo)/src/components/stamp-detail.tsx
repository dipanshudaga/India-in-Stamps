import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Fonts, StampColor } from '@/constants/theme';
import { denominationDisplay, type Stamp } from '@/data/stamp';

import { CloseButton } from './close-button';
import { StampImage } from './stamp-image';

// Sheet shown when a stamp is tapped anywhere (Timeline, Calendar, Search): the stamp large, its
// name / denomination / date, tags, and the historical description. Port of `StampDetailView.swift`.
export function StampDetail({ stamp, onClose }: { stamp: Stamp | null; onClose: () => void }) {
  return (
    <Modal visible={stamp !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {stamp && (
        <View style={styles.root}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <StampImage stamp={stamp} variant="full" transition={180} style={styles.heroImage} />
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>{stamp.name}</Text>
              <Text style={styles.meta}>
                {denominationDisplay(stamp)}  ·  {stamp.issueDateDisplay}
              </Text>

              {stamp.tags.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tags}>
                  {stamp.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.heading}>About this stamp</Text>
              <Text style={styles.description}>{stamp.description}</Text>
            </View>
          </ScrollView>

          <CloseButton onPress={onClose} style={styles.close} />
          <Pressable
            onPress={() => Share.share({ message: `${stamp.name} - ${stamp.pageURL ?? 'India in Stamps'}` })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={styles.share}>
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: StampColor.bgPage },
  content: { paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  heroImage: { width: '100%', maxWidth: 320, aspectRatio: 1 },
  body: { padding: 24, gap: 6 },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    color: StampColor.inkPrimary,
  },
  meta: { fontSize: 15, color: StampColor.inkSecondary },
  tags: { marginTop: 14, flexGrow: 0 },
  tag: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: StampColor.accentStructural,
    backgroundColor: 'rgba(184,173,152,0.35)',
  },
  tagText: { fontSize: 13, color: StampColor.inkPrimary },
  heading: { marginTop: 22, fontSize: 17, fontWeight: '600', color: StampColor.inkPrimary },
  description: { marginTop: 4, fontSize: 16, lineHeight: 24, color: StampColor.inkPrimary },
  close: { position: 'absolute', top: 10, left: 10 },
  share: { position: 'absolute', top: 10, right: 16, height: 44, justifyContent: 'center' },
  shareText: { fontSize: 16, fontWeight: '500', color: StampColor.accentPrimary },
});
