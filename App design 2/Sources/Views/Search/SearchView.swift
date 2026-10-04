import SwiftUI

/// design.md §9.4. Owns its own search field rather than relying on `.searchable` - that used to
/// live on the root `TabView` above every tab, which leaked a search bar onto Timeline/Gallery/
/// Collections and left typed queries disconnected from `results` here. The Search tab
/// (`Tab(role: .search)` in `RootTabView`) is the one dedicated entry point for search now.
///
/// Filter chips (tags + year) are always visible, not just after typing - so this tab is a
/// browse-by-filter surface the moment it opens, not a dead end that only responds to typing.
struct SearchView: View {
    @Environment(StampRepository.self) private var repository
    @AppStorage("recentSearchQueries") private var recentSearchesRaw = ""
    @State private var searchText = ""
    @State private var selectedTag: String?
    @State private var selectedYear: Int?
    @State private var selectedStamp: Stamp?

    private var recentSearches: [String] {
        recentSearchesRaw.split(separator: "|").map(String.init)
    }

    private var isBrowsing: Bool {
        !searchText.isEmpty || selectedTag != nil || selectedYear != nil
    }

    private var results: [Stamp] {
        let query = searchText.lowercased()
        return repository.stamps.filter { stamp in
            let matchesQuery = query.isEmpty
                || stamp.name.lowercased().contains(query)
                || stamp.description.lowercased().contains(query)
                || stamp.tags.contains { $0.lowercased().contains(query) }
            let matchesTag = selectedTag.map(stamp.tags.contains) ?? true
            let matchesYear = selectedYear.map { $0 == stamp.year } ?? true
            return matchesQuery && matchesTag && matchesYear
        }
    }

    private var allTags: [String] {
        Array(Set(repository.stamps.flatMap(\.tags))).sorted()
    }

    private var allYears: [Int] {
        Array(Set(repository.stamps.map(\.year))).sorted(by: >)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                searchField
                filterBar

                if isBrowsing {
                    resultsGrid
                } else if !recentSearches.isEmpty {
                    recentSearchesList
                } else {
                    emptyPrompt
                }
            }
            .padding(.top, 12)
        }
        .stampPageBackground()
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(StampColor.inkTertiary)
            TextField("Search by name, tag, or description", text: $searchText)
                .font(StampFont.body())
                .foregroundStyle(StampColor.inkPrimary)
                .submitLabel(.search)
                .onSubmit { recordSearch(searchText) }
            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(StampColor.inkTertiary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(StampColor.bgCard, in: Capsule())
        .overlay(Capsule().strokeBorder(StampColor.accentStructural, lineWidth: 1))
        .padding(.horizontal, 20)
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                yearMenu
                ForEach(allTags.prefix(20), id: \.self) { tag in
                    let isActive = selectedTag == tag
                    Text(tag)
                        .font(StampFont.footnote())
                        .foregroundStyle(isActive ? StampColor.bgPage : StampColor.inkSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(isActive ? StampColor.accentPrimary : Color.clear, in: Capsule())
                        .overlay(Capsule().strokeBorder(isActive ? .clear : StampColor.accentStructural, lineWidth: 1))
                        .contentShape(Capsule())
                        .onTapGesture {
                            withAnimation(StampMotion.fast) {
                                selectedTag = isActive ? nil : tag
                            }
                        }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private var yearMenu: some View {
        Menu {
            Button("All years") { selectedYear = nil }
            ForEach(allYears, id: \.self) { year in
                Button(String(year)) { selectedYear = year }
            }
        } label: {
            HStack(spacing: 4) {
                Text(selectedYear.map(String.init) ?? "Year")
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .semibold))
            }
            .font(StampFont.footnote())
            .foregroundStyle(selectedYear != nil ? StampColor.bgPage : StampColor.inkSecondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(selectedYear != nil ? StampColor.accentPrimary : Color.clear, in: Capsule())
            .overlay(Capsule().strokeBorder(selectedYear != nil ? .clear : StampColor.accentStructural, lineWidth: 1))
        }
    }

    private var resultsGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 12)], spacing: 12) {
            ForEach(results) { stamp in
                Button {
                    selectedStamp = stamp
                } label: {
                    StampCard(stamp: stamp, parallaxEnabled: false)
                        .frame(height: 130)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20)
    }

    private var recentSearchesList: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Recent")
                .font(StampFont.footnote())
                .foregroundStyle(StampColor.inkSecondary)
                .padding(.horizontal, 20)
                .padding(.top, 4)
            ForEach(recentSearches, id: \.self) { query in
                Button { searchText = query } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "clock")
                            .foregroundStyle(StampColor.inkTertiary)
                        Text(query)
                            .font(StampFont.body())
                            .foregroundStyle(StampColor.inkPrimary)
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .frame(minHeight: 44)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var emptyPrompt: some View {
        VStack(spacing: 8) {
            PostmarkIcon(color: StampColor.inkTertiary)
            Text("Search by name, tag, or description")
                .font(StampFont.subheadline())
                .foregroundStyle(StampColor.inkSecondary)
            Text("Or tap a tag or year above to browse")
                .font(StampFont.footnote())
                .foregroundStyle(StampColor.inkTertiary)
        }
        .padding(.top, 48)
        .frame(maxWidth: .infinity)
    }

    private func recordSearch(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        var updated = recentSearches.filter { $0.caseInsensitiveCompare(trimmed) != .orderedSame }
        updated.insert(trimmed, at: 0)
        recentSearchesRaw = updated.prefix(5).joined(separator: "|")
    }
}
