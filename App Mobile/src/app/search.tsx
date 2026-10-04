import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Placeholder — ports `SearchView.swift`'s own search field + tag/year filter chips later.
export default function SearchScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="title">Search</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
