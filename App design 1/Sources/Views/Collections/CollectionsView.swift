import SwiftUI

/// design.md §9.5 — grid of collection cards (stacked-photo cover of up to 3 stamps, name, count).
/// A default "Favorites" collection always exists (§13 item 1, confirmed).
///
/// NOTE: the "+ New collection" control here is a plain toolbar button, not the glass control
/// §9.5 describes — it sits in the standard `.toolbar`, which already floats on system glass
/// automatically (§4.6), so no extra `.glassEffect()` is needed on top of it.
struct CollectionsView: View {
    @Environment(CollectionsStore.self) private var collectionsStore
    @Environment(StampRepository.self) private var repository
    @State private var isPresentingNewCollection = false
    @State private var newCollectionName = ""
    @State private var isPresentingAbout = false

    private let columns = [GridItem(.adaptive(minimum: 160), spacing: 16)]

    var body: some View {
        Group {
            if collectionsStore.collections.allSatisfy({ $0.stampIDs.isEmpty }) {
                emptyState
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 16) {
                        ForEach(collectionsStore.collections) { collection in
                            NavigationLink(value: collection) {
                                CollectionCard(collection: collection, repository: repository)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(20)
                }
            }
        }
        .stampPageBackground()
        .navigationTitle("Collections")
        .navigationDestination(for: StampCollection.self) { collection in
            CollectionDetailView(collection: collection)
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    isPresentingAbout = true
                } label: {
                    Image(systemName: "person.crop.circle")
                }
                .accessibilityLabel("Settings and about")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isPresentingNewCollection = true
                } label: {
                    Label("New collection", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $isPresentingAbout) {
            AboutView()
        }
        .alert("New collection", isPresented: $isPresentingNewCollection) {
            TextField("Collection name", text: $newCollectionName)
            Button("Cancel", role: .cancel) { newCollectionName = "" }
            Button("Create") {
                guard !newCollectionName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                collectionsStore.createCollection(named: newCollectionName)
                newCollectionName = ""
            }
        }
    }

    /// §9.5 empty state: an invitation, never an apology (§12).
    private var emptyState: some View {
        VStack(spacing: 12) {
            PerforatedStampOutline(color: StampColor.inkTertiary, size: CGSize(width: 56, height: 70))
            Text("Start a collection")
                .font(StampFont.title3())
                .foregroundStyle(StampColor.inkPrimary)
            Text("Save stamps as you browse and they'll show up here.")
                .font(StampFont.subheadline())
                .foregroundStyle(StampColor.inkSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct CollectionCard: View {
    let collection: StampCollection
    let repository: StampRepository

    private var coverStamps: [Stamp] {
        collection.stampIDs.prefix(3).compactMap { id in
            repository.stamps.first { $0.id == id }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                if coverStamps.isEmpty {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(StampColor.bgCard)
                        .frame(width: 100, height: 100)
                } else {
                    ForEach(Array(coverStamps.enumerated()), id: \.offset) { index, stamp in
                        LocalStampImage(url: stamp.localImageURL)
                            .frame(width: 100, height: 100)
                            .shadow(color: .black.opacity(0.16), radius: 8, y: 4)
                            .rotationEffect(.degrees(Double(index) * 6 - 6))
                            .offset(x: CGFloat(index) * 6)
                    }
                }
            }
            .frame(height: 110, alignment: .leading)

            Text(collection.name)
                .font(StampFont.title3())
                .foregroundStyle(StampColor.inkPrimary)
            Text("\(collection.stampIDs.count) stamp\(collection.stampIDs.count == 1 ? "" : "s")")
                .font(StampFont.footnote())
                .foregroundStyle(StampColor.inkSecondary)
        }
    }
}
