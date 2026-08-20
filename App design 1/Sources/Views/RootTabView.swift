import SwiftUI

/// design.md §8 — 4 tabs: Timeline, Gallery, Search (role: .search, rendered as its own floating
/// affordance rather than a fourth inline icon), Collections.
///
/// NOTE: Collections' custom "stamp album/binder" tab icon (§5.2) is bespoke artwork this pass
/// can't produce — "book.closed" stands in until that asset exists.
struct RootTabView: View {
    @State private var searchText = ""

    var body: some View {
        TabView {
            Tab("Timeline", systemImage: "clock") {
                NavigationStack { TimelineView() }
            }
            Tab("Gallery", systemImage: "square.grid.2x2") {
                NavigationStack { GalleryView() }
            }
            Tab(role: .search) {
                NavigationStack { SearchView(searchText: $searchText) }
            }
            Tab("Collections", systemImage: "book.closed") {
                NavigationStack { CollectionsView() }
            }
        }
        .searchable(text: $searchText, placement: .automatic)
        .tabBarMinimizeBehavior(.onScrollDown)
        .tint(StampColor.accentPrimary)
    }
}
