import SwiftUI

/// design.md §9.2, §7 — masonry, not a rigid grid: stamps come in genuinely different shapes.
/// 3 columns at standard iPhone widths, 12pt gutter.
///
/// V1 SIMPLIFICATION: true height-balanced masonry needs each image's aspect ratio known before
/// layout, and that data isn't in the CSV. Items are round-robin distributed across 3 independent
/// columns instead — each card still sizes to its own image, so columns end up organically
/// different heights, just not perfectly balanced. Worth revisiting with real aspect-ratio data.
struct GalleryView: View {
    @Environment(StampRepository.self) private var repository
    @State private var selectedStamp: Stamp?

    private let columnCount = 3

    var body: some View {
        ScrollView {
            HStack(alignment: .top, spacing: 12) {
                ForEach(0..<columnCount, id: \.self) { column in
                    LazyVStack(spacing: 12) {
                        ForEach(stamps(inColumn: column)) { stamp in
                            Button {
                                selectedStamp = stamp
                            } label: {
                                StampCard(stamp: stamp)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(20)
        }
        .stampPageBackground()
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
        .navigationTitle("Gallery")
    }

    private func stamps(inColumn column: Int) -> [Stamp] {
        repository.stamps.enumerated()
            .filter { $0.offset % columnCount == column }
            .map(\.element)
    }
}
