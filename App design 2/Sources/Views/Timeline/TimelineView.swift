import SwiftUI

/// Back to Design 1's structure per your direction — a single stamp shown large in its display
/// case, with a horizontal scrubber beneath it — restyled with this direction's aesthetic
/// (museum case, near-white ground, bold serif). The year-list read the stamps too small; one
/// large specimen at a time lets the display case (and the stamp itself) actually be seen.
///
/// Paging is built on SwiftUI's native paged-scroll mechanism (`.scrollTargetBehavior(.paging)` +
/// `.scrollPosition(id:)`, iOS 17+) rather than a hand-rolled offset/transition system. Two
/// different custom approaches were tried and both broke in ways that kept surfacing as "wrong
/// direction" or "not smooth": manually animating an offset through phases with `Task.sleep`
/// (two mutations with no render boundary between them got coalesced into one animation), and then
/// `.id(stamp.id)` + `.transition(.asymmetric(...))` (removal animated correctly but insertion
/// settled instantly, confirmed by slowing the animation to 10 seconds and watching it happen).
/// Native paged scrolling sidesteps the whole class of bug: UIScrollView's own paging physics — the
/// same mechanism Photos itself uses — owns the slide, direction, and momentum; there's no custom
/// animation code left to get out of sync.
struct TimelineView: View {
    @Environment(StampRepository.self) private var repository
    @State private var currentIndex = 0
    @State private var scrollPosition: Int?
    @State private var selectedStamp: Stamp?
    @State private var zoomScale: CGFloat = 1
    @State private var zoomBaseline: CGFloat = 1
    @State private var zoomPanOffset: CGSize = .zero
    @State private var zoomPanBaseline: CGSize = .zero

    private let cardWidth: CGFloat = 280

    private var stamps: [Stamp] { repository.chronological }

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 12)

            ScrollView(.horizontal) {
                LazyHStack(spacing: 0) {
                    ForEach(stamps) { stamp in
                        featuredStamp(stamp)
                            .containerRelativeFrame(.horizontal)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollClipDisabled()
            .scrollPosition(id: $scrollPosition)
            .scrollIndicators(.hidden)
            .scrollDisabled(zoomScale > 1.01)
            .frame(height: 300)

            Spacer(minLength: 12)

            if !stamps.isEmpty {
                TimelineRuler(stamps: stamps, currentIndex: $currentIndex)
                    .padding(.bottom, 56)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .stampPageBackground()
        .navigationTitle("Timeline")
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
        .task(id: currentIndex) {
            await prefetchNeighbors()
        }
        .onChange(of: currentIndex) {
            resetZoom()
            // The ruler (or an initial load) changed the index directly - bring the scroll view
            // to match if it isn't already there.
            let targetID = stamps.indices.contains(currentIndex) ? stamps[currentIndex].id : nil
            if scrollPosition != targetID {
                withAnimation(StampMotion.fast) { scrollPosition = targetID }
            }
        }
        .onChange(of: scrollPosition) {
            // The scroll view settled on a new page from a swipe - that's the source of truth for
            // the ruler now.
            guard let scrollPosition, let index = stamps.firstIndex(where: { $0.id == scrollPosition }) else { return }
            if currentIndex != index {
                currentIndex = index
            }
        }
        .task {
            if scrollPosition == nil, stamps.indices.contains(currentIndex) {
                scrollPosition = stamps[currentIndex].id
            }
        }
    }

    private func resetZoom() {
        zoomScale = 1
        zoomBaseline = 1
        zoomPanOffset = .zero
        zoomPanBaseline = .zero
    }

    /// Warms the image cache for the stamps a swipe would land on next, so scrolling to a fresh
    /// page never has to wait on a disk read + decode mid-swipe.
    private func prefetchNeighbors() async {
        for offset in [-2, -1, 1, 2] {
            let index = currentIndex + offset
            guard stamps.indices.contains(index), let url = stamps[index].localImageURL else { continue }
            await ImageCache.shared.load(url)
        }
    }

    private func featuredStamp(_ stamp: Stamp) -> some View {
        DisplayCase {
            LocalStampImage(url: stamp.localImageURL)
        }
        .frame(width: cardWidth, height: cardWidth)
        .scaleEffect(zoomScale)
        .offset(zoomPanOffset)
        // Panning while zoomed. `minimumDistance` jumps to an effectively-unreachable value while
        // not zoomed, rather than just no-op'ing in the handlers - the ScrollView's own paging
        // gesture is `.scrollDisabled` above 1x already, but leaving this recognizer live (even as
        // a no-op) while at 1x risked it competing with the ScrollView's pan recognizer for touch
        // priority; a minimum distance it can never reach means it never activates at all.
        .gesture(
            DragGesture(minimumDistance: zoomScale > 1.01 ? 4 : 10_000)
                .onChanged { value in
                    zoomPanOffset = CGSize(
                        width: zoomPanBaseline.width + value.translation.width,
                        height: zoomPanBaseline.height + value.translation.height
                    )
                }
                .onEnded { _ in
                    zoomPanBaseline = zoomPanOffset
                }
        )
        .simultaneousGesture(
            MagnificationGesture()
                .onChanged { value in
                    zoomScale = min(max(zoomBaseline * value, 1), 4)
                }
                .onEnded { _ in
                    zoomBaseline = zoomScale
                    if zoomScale <= 1.05 {
                        withAnimation(StampMotion.fast) { resetZoom() }
                    }
                }
        )
        .onTapGesture(count: 2) {
            withAnimation(StampMotion.fast) {
                if zoomScale > 1.01 {
                    resetZoom()
                } else {
                    zoomScale = 2.2
                    zoomBaseline = 2.2
                }
            }
        }
        .onTapGesture {
            selectedStamp = stamp
        }
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("Swipe left or right to browse, double-tap or pinch to zoom, or tap to view details")
    }
}
