import SwiftUI

/// A Gallery-style grid scoped to one collection (design.md §9.5).
struct CollectionDetailView: View {
    let collection: StampCollection
    @Environment(StampRepository.self) private var repository
    @State private var selectedStamp: Stamp?

    private var stamps: [Stamp] {
        collection.stampIDs.compactMap { id in repository.stamps.first { $0.id == id } }
    }

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 12)], spacing: 12) {
                ForEach(stamps) { stamp in
                    Button {
                        selectedStamp = stamp
                    } label: {
                        StampCard(stamp: stamp)
                            .frame(height: 130)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .stampPageBackground()
        .navigationTitle(collection.name)
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
    }
}
