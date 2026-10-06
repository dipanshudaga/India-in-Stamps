import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StampDetail } from '@/components/stamp-detail';
import { StampImage } from '@/components/stamp-image';
import { BottomTabInset, Fonts, StampColor } from '@/constants/theme';
import type { Stamp } from '@/data/stamp';
import { useStamps } from '@/data/use-stamps';

const RECENTS_KEY = 'recentSearchQueries';
const COLS = 3;
const PAD = 20;
const GAP = 12;

// Port of `SearchView.swift`. The tag and year filters are always visible, so the tab is a
// browse-by-filter surface the moment it opens, not a dead end that only reacts to typing.
export function SearchScreen() {
  const { stamps } = useStamps();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Stamp | null>(null);
  const [recents, setRecents] = useState<string[]>([]);

  const deferredQuery = useDeferredValue(query);
  const cell = (width - PAD * 2 - GAP * (COLS - 1)) / COLS;

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY)
      .then((raw) => raw && setRecents(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  // Lower-cased once up front, so a keystroke is one `includes` per stamp, not three lower-casings.
  const haystack = useMemo(
    () => stamps.map((stamp) => ({ stamp, text: `${stamp.name} ${stamp.description} ${stamp.tags.join(' ')}`.toLowerCase() })),
    [stamps],
  );

  const allYears = useMemo(() => [...new Set(stamps.map((s) => s.year).filter((y) => y > 0))].sort((a, b) => b - a), [stamps]);

  // The 20 most-used tags - the list is long-tailed, and alphabetical-first-20 would surface obscure ones.
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stamp of stamps) for (const t of stamp.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);
  }, [stamps]);

  const isBrowsing = deferredQuery.trim() !== '' || tag !== null || year !== null;

  const results = useMemo(() => {
    if (!isBrowsing) return [];
    const q = deferredQuery.trim().toLowerCase();
    return haystack
      .filter(
        ({ stamp, text }) =>
          (q === '' || text.includes(q)) && (tag === null || stamp.tags.includes(tag)) && (year === null || stamp.year === year),
      )
      .map(({ stamp }) => stamp);
  }, [haystack, deferredQuery, tag, year, isBrowsing]);

  function recordSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recents.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecents(next);
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
  }

  const header = (
    <View style={{ paddingTop: insets.top + 12 }}>
      <Text style={styles.title}>Search</Text>

      <View style={styles.field}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => recordSearch(query)}
          placeholder="Search by name, tag, or description"
          placeholderTextColor={StampColor.inkTertiary}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {query !== '' && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <Text style={styles.clear}>×</Text>
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
        <Chip label={year !== null ? String(year) : 'Year  ▾'} active={year !== null} onPress={() => setYearPickerOpen(true)} />
        {topTags.map((t) => (
          <Chip key={t} label={t} active={tag === t} onPress={() => setTag(tag === t ? null : t)} />
        ))}
      </ScrollView>
    </View>
  );

  const empty =
    recents.length > 0 ? (
      <View style={styles.recents}>
        <Text style={styles.recentsLabel}>Recent</Text>
        {recents.map((r) => (
          <Pressable key={r} onPress={() => setQuery(r)} style={styles.recentRow}>
            <Text style={styles.recentText}>{r}</Text>
          </Pressable>
        ))}
      </View>
    ) : (
      <View style={styles.prompt}>
        <View style={styles.postmark} />
        <Text style={styles.promptTitle}>Search by name, tag, or description</Text>
        <Text style={styles.promptHint}>Or tap a tag or year above to browse</Text>
      </View>
    );

  return (
    <View style={styles.root}>
      <FlatList
        data={results}
        keyExtractor={(stamp) => String(stamp.id)}
        numColumns={COLS}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={header}
        ListEmptyComponent={isBrowsing ? <Text style={styles.noResults}>No stamps found</Text> : empty}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 24, gap: GAP }}
        initialNumToRender={18}
        windowSize={7}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            style={[styles.cell, { width: cell, height: cell * 1.1 }]}>
            <StampImage stamp={item} variant="thumb" style={styles.cellImage} />
          </Pressable>
        )}
      />

      <Modal visible={yearPickerOpen} transparent animationType="fade" onRequestClose={() => setYearPickerOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setYearPickerOpen(false)}>
          <View style={styles.picker}>
            <FlatList
              data={[null, ...allYears]}
              keyExtractor={(y) => String(y)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setYear(item);
                    setYearPickerOpen(false);
                  }}
                  style={styles.pickerRow}>
                  <Text style={[styles.pickerText, item === year && styles.pickerTextActive]}>
                    {item === null ? 'All years' : item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <StampDetail stamp={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: StampColor.bgPage },
  title: {
    paddingHorizontal: PAD,
    fontFamily: Fonts.serif,
    fontSize: 34,
    fontWeight: '700',
    color: StampColor.inkPrimary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginHorizontal: PAD,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: StampColor.accentStructural,
    backgroundColor: StampColor.bgCard,
  },
  input: { flex: 1, fontSize: 16, color: StampColor.inkPrimary },
  clear: { fontSize: 24, lineHeight: 26, color: StampColor.inkTertiary },
  chips: { paddingHorizontal: PAD, paddingVertical: 14, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: StampColor.accentStructural,
  },
  chipActive: { backgroundColor: StampColor.accentPrimary, borderColor: StampColor.accentPrimary },
  chipText: { fontSize: 13, color: StampColor.inkSecondary },
  chipTextActive: { color: StampColor.bgPage },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    boxShadow: '0 1px 2px rgba(60,40,10,0.07)',
  },
  cellImage: { width: '84%', height: '84%' },
  noResults: { marginTop: 48, textAlign: 'center', fontSize: 15, color: StampColor.inkSecondary },
  recents: { paddingTop: 4 },
  recentsLabel: { paddingHorizontal: PAD, fontSize: 13, color: StampColor.inkSecondary },
  recentRow: { minHeight: 44, paddingHorizontal: PAD, justifyContent: 'center' },
  recentText: { fontSize: 16, color: StampColor.inkPrimary },
  prompt: { marginTop: 48, alignItems: 'center', gap: 8 },
  postmark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: StampColor.inkTertiary,
    marginBottom: 6,
  },
  promptTitle: { fontSize: 15, color: StampColor.inkSecondary },
  promptHint: { fontSize: 13, color: StampColor.inkTertiary },
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  picker: {
    width: 220,
    maxHeight: 420,
    borderRadius: 16,
    backgroundColor: StampColor.bgPage,
    overflow: 'hidden',
  },
  pickerRow: { height: 46, justifyContent: 'center', paddingHorizontal: 20 },
  pickerText: { fontSize: 17, color: StampColor.inkPrimary },
  pickerTextActive: { fontWeight: '700', color: StampColor.accentPrimary },
});
