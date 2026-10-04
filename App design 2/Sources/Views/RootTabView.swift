import SwiftUI

/// design.md §8 — 4 tabs: Timeline, Gallery, Calendar, Search (role: .search — its own floating
/// affordance rather than a fourth inline icon). No Collections/save-to-favorites — removed per
/// your direction.
///
/// Deliberately no `.searchable(...)` here. It used to sit on this `TabView`, above every tab's own
/// `NavigationStack` — that made a system search field leak onto every tab (not just the Search
/// tab), and typed queries didn't reliably reach `SearchView.results` since the binding lived a
/// level above where the results were computed. `Tab(role: .search)` alone still gives Search its
/// distinct tab-bar treatment; `SearchView` now owns and renders its own search field instead.
struct RootTabView: View {
    var body: some View {
        TabView {
            Tab("Timeline", systemImage: "clock") {
                NavigationStack { TimelineView() }
            }
            Tab("Gallery", systemImage: "square.grid.2x2") {
                NavigationStack { GalleryView() }
            }
            Tab("Calendar", systemImage: "calendar") {
                NavigationStack { CalendarView() }
            }
            Tab(role: .search) {
                NavigationStack { SearchView() }
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .tint(StampColor.accentPrimary)
    }
}
