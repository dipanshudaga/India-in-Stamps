import { NativeTabs } from 'expo-router/unstable-native-tabs';

// 4 tabs mirroring the native app's `RootTabView.swift`: Timeline, Gallery, Calendar, and a
// search-role tab. `sf`/`md` give each platform its own native icon set (SF Symbols on iOS,
// Material glyphs on Android) instead of shipping icon image assets.
export default function AppTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Timeline</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock" md="schedule" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="gallery">
        <NativeTabs.Trigger.Label>Gallery</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wall">
        <NativeTabs.Trigger.Label>Wall</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.stack.3d.up" md="view_in_ar" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
