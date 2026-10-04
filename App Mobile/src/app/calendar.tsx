import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Placeholder — ports `CalendarView.swift`'s month grid + tilted thumbnail day cells later.
export default function CalendarScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="title">Calendar</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
