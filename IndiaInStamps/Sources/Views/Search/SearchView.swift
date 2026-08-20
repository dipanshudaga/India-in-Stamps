import SwiftUI

/// design.md §9.4 — empty state shows recent searches; filled state shows filter chips above a
/// live-updating masonry grid identical to Gallery's.
struct SearchView: View {
    @Binding var searchText: String
    @Environment(StampRepository.self) private var repository
    @AppStorage("recentSearchQueries") private var recentSearchesRaw = ""
    @State private var selectedTag: String?
    @State private var selectedStamp: Stamp?

    private var recentSearches: [String] {
        recentSearchesRaw.split(separator: "|").map(String.init)
    }

    private var results: [Stamp] {
        guard !searchText.isEmpty else { return [] }
        let query = searchText.lowercased()
        return repository.stamps.filter { stamp in
            let matchesQuery = stamp.name.lowercased().contains(query)
                || stamp.description.lowercased().contains(query)
                || stamp.tags.contains { $0.lowercased().contains(query) }
            let matchesTag = selectedTag.map(stamp.tags.contains) ?? true
            return matchesQuery && matchesTag
        }
    }

    private var allTags: [String] {
        Array(Set(repository.stamps.flatMap(\.tags))).sorted()
    }

    var body: some View {
        ScrollView {
            if searchText.isEmpty {
                emptyState
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    filterChips
                    resultsGrid
                }
                .padding(.top, 12)
            }
        }
        .stampPageBackground()
        .onSubmit(of: .search) { recordSearch(searchText) }
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        if recentSearches.isEmpty {
            VStack(spacing: 8) {
                PostmarkIcon(color: StampColor.inkTertiary)
                Text("Search by name, tag, or description")
                    .font(StampFont.subheadline())
                    .foregroundStyle(StampColor.inkSecondary)
            }
            .padding(.top, 80)
            .frame(maxWidth: .infinity)
        } else {
            VStack(alignment: .leading, spacing: 0) {
                Text("Recent")
                    .font(StampFont.footnote())
                    .foregroundStyle(StampColor.inkSecondary)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
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
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
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

    private var resultsGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 12)], spacing: 12) {
            ForEach(results) { stamp in
                Button {
                    selectedStamp = stamp
                } label: {
                    StampCard(stamp: stamp)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20)
    }

    private func recordSearch(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        var updated = recentSearches.filter { $0.caseInsensitiveCompare(trimmed) != .orderedSame }
        updated.insert(trimmed, at: 0)
        recentSearchesRaw = updated.prefix(5).joined(separator: "|")
    }
}
