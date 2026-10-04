import SwiftUI

/// design.md §9.2, back to masonry per your direction: a fixed-height grid read varying stamp
/// aspect ratios as inconsistent box sizes, but true masonry (each column packed by real image
/// aspect ratio) is what "intentional variety" actually looks like. Built as one `LazyVStack` per
/// column rather than SwiftUI's `Layout` protocol - a custom `Layout` always instantiates every
/// subview upfront (not lazy), which is exactly the class of bug that already crashed this app on
/// -device once over the full dataset (see HANDOFF.md). Per-column `LazyVStack`s each virtualize
/// independently, so only on-screen cells across all 3,045 stamps are ever built. No parallax on
/// individual cells here (`StampCard(parallaxEnabled: false)`) - many cells tilting independently
/// on device motion reads as chaotic rather than physical.
struct GalleryView: View {
    @Environment(StampRepository.self) private var repository
    @State private var selectedStamp: Stamp?
    @State private var shuffledStamps: [Stamp] = []
    private let aspectRatioStore = ImageAspectRatioStore.shared

    private let columnCount = 2

    /// Greedy shortest-column distribution (same idea a masonry `Layout` would use for placement,
    /// just precomputed into column arrays instead of positioned per-frame) - each stamp goes into
    /// whichever column currently has the least estimated height. Recomputing this over up to 3,045
    /// stamps is cheap (single pass, no image decoding); what has to stay lazy is *rendering*, which
    /// the per-column `LazyVStack`s below handle.
    private var columnedStamps: [[Stamp]] {
        var columns = [[Stamp]](repeating: [], count: columnCount)
        var heights = [CGFloat](repeating: 0, count: columnCount)
        for stamp in shuffledStamps {
            let ratio = stamp.localImageURL.flatMap { aspectRatioStore.ratio(for: $0) } ?? 1
            let shortest = heights.indices.min(by: { heights[$0] < heights[$1] }) ?? 0
            columns[shortest].append(stamp)
            heights[shortest] += 1 / max(ratio, 0.2)
        }
        return columns
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HStack(alignment: .top, spacing: 12) {
                    ForEach(0..<columnCount, id: \.self) { column in
                        LazyVStack(spacing: 12) {
                            ForEach(columnedStamps[column]) { stamp in
                                Button {
                                    selectedStamp = stamp
                                } label: {
                                    StampCard(stamp: stamp, parallaxEnabled: false)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .padding(.horizontal, 20)

                Text("\(shuffledStamps.count) stamps")
                    .font(StampFont.footnote())
                    .foregroundStyle(StampColor.inkTertiary)
                    .padding(.bottom, 12)
            }
            .padding(.top, 12)
        }
        .stampPageBackground()
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
        .navigationTitle("Gallery")
        // Shuffled once (not recomputed every body evaluation, which scrolling/tapping would
        // trigger constantly) and re-shuffled only if the underlying catalog actually changes size
        // - covers both the empty-at-launch state (repository still loading) and later reloads.
        .task(id: repository.stamps.count) {
            guard shuffledStamps.count != repository.stamps.count else { return }
            shuffledStamps = repository.stamps.shuffled()
        }
    }
}
