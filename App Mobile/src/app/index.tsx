import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Placeholder — the real featured-stamp paging carousel + ruler scrubber lands in a later phase
// (ports `TimelineView.swift` + `TimelineRuler.swift`). This just proves the tab route works.
export default function TimelineScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="title">Timeline</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
