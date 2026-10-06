import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StampDetail } from '@/components/stamp-detail';
import { StampImage } from '@/components/stamp-image';
import { BottomTabInset, Fonts, StampColor } from '@/constants/theme';
import type { Stamp } from '@/data/stamp';
import { useStamps } from '@/data/use-stamps';

const PAD = 20;
const THUMB = 44;
const CELL_H = THUMB + 20;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad2 = (n: number) => String(n).padStart(2, '0');
const dayKey = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

// Port of `CalendarView.swift`: a real month grid. A day that had a stamp issued shows a small
// tilted thumbnail over its date number (like a photo dropped on a calendar page), with a count
// badge when there were several. Tap a day to see what was released.
export function CalendarScreen() {
  const { stamps } = useStamps();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const byDate = useMemo(() => {
    const map = new Map<string, Stamp[]>();
    for (const stamp of stamps) {
      if (!stamp.issueDateIso) continue;
      const list = map.get(stamp.issueDateIso);
      if (list) list.push(stamp);
      else map.set(stamp.issueDateIso, [stamp]);
    }
    return map;
  }, [stamps]);

  const years = useMemo(() => [...new Set(stamps.map((s) => s.year).filter((y) => y > 0))].sort((a, b) => b - a), [stamps]);

  // Open on the most recent month that has stamps - the catalog ends before today, and a calendar
  // that opens on an empty month looks broken.
  const [month, setMonth] = useState(() => {
    let latest = '';
    for (const key of byDate.keys()) if (key > latest) latest = key;
    return latest ? { y: Number(latest.slice(0, 4)), m: Number(latest.slice(5, 7)) - 1 } : { y: 1947, m: 7 };
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<Stamp | null>(null);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const cellW = (width - PAD * 2) / 7;
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const leading = new Date(month.y, month.m, 1).getDay();
  const title = new Date(month.y, month.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [...Array<null>(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dayStamps = selectedKey ? byDate.get(selectedKey) : undefined;

  function shift(delta: number) {
    setMonth(({ y, m }) => {
      const next = new Date(y, m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
    setSelectedKey(null);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + BottomTabInset + 24 }}>
        <Text style={styles.screenTitle}>Calendar</Text>

        <View style={styles.monthRow}>
          <Pressable onPress={() => shift(-1)} hitSlop={8} style={styles.chevron} accessibilityLabel="Previous month">
            <Text style={styles.chevronText}>‹</Text>
          </Pressable>
          <Pressable onPress={() => setYearPickerOpen(true)} accessibilityLabel="Choose year">
            <Text style={styles.monthTitle}>{title}</Text>
          </Pressable>
          <Pressable onPress={() => shift(1)} hitSlop={8} style={styles.chevron} accessibilityLabel="Next month">
            <Text style={styles.chevronText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.weekday, { width: cellW }]}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={{ width: cellW, height: CELL_H }} />;
            const key = dayKey(month.y, month.m, day);
            const list = byDate.get(key);
            const isSelected = selectedKey === key;
            return (
              <Pressable
                key={key}
                disabled={!list}
                onPress={() => setSelectedKey(isSelected ? null : key)}
                style={[styles.day, { width: cellW, opacity: list ? 1 : 0.3 }]}>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{day}</Text>
                {list && (
                  <View style={styles.tilt}>
                    <View style={[styles.thumb, isSelected && styles.thumbSelected]}>
                      <Thumb stamp={list[0]} />
                    </View>
                    {list.length > 1 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{list.length}</Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {dayStamps && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>{dayStamps[0].issueDateDisplay}</Text>
            <View style={styles.resultsGrid}>
              {dayStamps.map((stamp) => (
                <Pressable
                  key={stamp.id}
                  onPress={() => setSelected(stamp)}
                  accessibilityLabel={stamp.name}
                  style={styles.resultCell}>
                  <StampImage stamp={stamp} variant="thumb" style={styles.resultImage} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={yearPickerOpen} transparent animationType="fade" onRequestClose={() => setYearPickerOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setYearPickerOpen(false)}>
          <View style={styles.picker}>
            <FlatList
              data={years}
              keyExtractor={(y) => String(y)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setMonth((prev) => ({ ...prev, y: item }));
                    setSelectedKey(null);
                    setYearPickerOpen(false);
                  }}
                  style={styles.pickerRow}>
                  <Text style={[styles.pickerText, item === month.y && styles.pickerTextActive]}>{item}</Text>
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

// Fit (not cropped) so the whole stamp shows in the 44pt tile.
function Thumb({ stamp }: { stamp: Stamp }) {
  return <StampImage stamp={stamp} variant="thumb" style={styles.thumbImage} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: StampColor.bgPage },
  screenTitle: {
    paddingHorizontal: PAD,
    fontFamily: Fonts.serif,
    fontSize: 34,
    fontWeight: '700',
    color: StampColor.inkPrimary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD - 8,
    marginTop: 12,
  },
  monthTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '600', color: StampColor.inkPrimary },
  chevron: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chevronText: { fontSize: 32, lineHeight: 36, color: StampColor.inkPrimary },
  weekRow: { flexDirection: 'row', paddingHorizontal: PAD, marginTop: 8 },
  weekday: { textAlign: 'center', fontSize: 12, color: StampColor.inkTertiary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PAD, marginTop: 8, rowGap: 8 },
  day: { height: CELL_H, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 15, color: StampColor.inkSecondary },
  dayNumberSelected: { color: StampColor.accentPrimary, fontWeight: '700' },
  tilt: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    transform: [{ translateX: 5 }, { translateY: 3 }, { rotate: '-9deg' }],
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: StampColor.bgCard,
    borderWidth: 2,
    borderColor: 'transparent',
    boxShadow: '0 2px 3px rgba(0,0,0,0.25)',
  },
  thumbSelected: { borderColor: StampColor.accentPrimary },
  thumbImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: StampColor.accentPrimary,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  results: { marginTop: 24, paddingHorizontal: PAD, gap: 12 },
  resultsTitle: { fontSize: 17, fontWeight: '600', color: StampColor.inkPrimary },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultCell: {
    width: 100,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    boxShadow: '0 1px 2px rgba(60,40,10,0.07)',
  },
  resultImage: { width: '84%', height: '84%' },
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  picker: { width: 200, maxHeight: 420, borderRadius: 16, backgroundColor: StampColor.bgPage, overflow: 'hidden' },
  pickerRow: { height: 46, justifyContent: 'center', alignItems: 'center' },
  pickerText: { fontSize: 18, color: StampColor.inkPrimary },
  pickerTextActive: { fontWeight: '700', color: StampColor.accentPrimary },
});
