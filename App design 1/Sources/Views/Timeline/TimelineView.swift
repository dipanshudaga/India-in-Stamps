import SwiftUI

/// design.md §9.1, redesigned per your direction: one stamp shown at a time, floating with a
/// shadow, and a horizontal scrubber (§TimelineRuler) below it for moving through the catalog
/// chronologically. Replaces the year-grouped grid — Gallery already covers dense multi-stamp
/// browsing (§9.2), so Timeline can be this focused instead.
struct TimelineView: View {
    @Environment(StampRepository.self) private var repository
    @State private var currentIndex = 0
    @State private var selectedStamp: Stamp?

    private var stamps: [Stamp] { repository.chronological }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Fixed-size slot regardless of which stamp is showing, so nothing shifts position
            // when the index changes.
            Group {
                if let stamp = currentStamp {
                    featuredStamp(stamp)
                } else {
                    ProgressView()
                }
            }
            .frame(height: 260)
            .padding(.horizontal, 40)

            Spacer()

            if !stamps.isEmpty {
                TimelineRuler(stamps: stamps, currentIndex: $currentIndex)
                    .padding(.bottom, 28)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .stampPageBackground()
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
    }

    private var currentStamp: Stamp? {
        stamps.indices.contains(currentIndex) ? stamps[currentIndex] : nil
    }

    private func featuredStamp(_ stamp: Stamp) -> some View {
        Button {
            selectedStamp = stamp
        } label: {
            StampCard(stamp: stamp)
                .frame(width: 260, height: 260)
        }
        .buttonStyle(.plain)
        .animation(StampMotion.fast, value: stamp.id)
    }
}
