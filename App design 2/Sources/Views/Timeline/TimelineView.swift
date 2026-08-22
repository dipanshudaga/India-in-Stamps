import SwiftUI

/// Back to Design 1's structure per your direction — a single stamp shown large in its display
/// case, with a horizontal scrubber beneath it — restyled with this direction's aesthetic
/// (museum case, near-white ground, bold serif). The year-list read the stamps too small; one
/// large specimen at a time lets the display case (and the stamp itself) actually be seen.
struct TimelineView: View {
    @Environment(StampRepository.self) private var repository
    @State private var currentIndex = 0
    @State private var selectedStamp: Stamp?
    @State private var isPresentingCalendar = false
    @State private var swipeOffset: CGFloat = 0
    @State private var isSwipeAnimating = false

    private let cardWidth: CGFloat = 280

    private var stamps: [Stamp] { repository.chronological }

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 12)

            Group {
                if let stamp = currentStamp {
                    featuredStamp(stamp)
                } else {
                    ProgressView()
                }
            }
            .frame(height: 300)
            .padding(.horizontal, 40)

            Spacer(minLength: 12)

            if !stamps.isEmpty {
                TimelineRuler(stamps: stamps, currentIndex: $currentIndex)
                    .padding(.bottom, 56)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .stampPageBackground()
        .toolbar(removing: .search)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isPresentingCalendar = true
                } label: {
                    Image(systemName: "calendar")
                }
                .accessibilityLabel("Browse by release date")
            }
        }
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
        .sheet(isPresented: $isPresentingCalendar) {
            CalendarView()
        }
        .task(id: currentIndex) {
            await prefetchNeighbors()
        }
    }

    private var currentStamp: Stamp? {
        stamps.indices.contains(currentIndex) ? stamps[currentIndex] : nil
    }

    /// Warms the image cache for the stamps a swipe would land on next, so the transition in
    /// `advance(forward:)` never has to wait on a fresh disk read + decode mid-animation - that
    /// wait was the actual cause of the swipe "flash," more than the animation curve itself.
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
        .offset(x: swipeOffset)
        .animation(StampMotion.fast, value: stamp.id)
        .gesture(
            DragGesture(minimumDistance: 12)
                .onChanged { value in
                    guard !isSwipeAnimating else { return }
                    swipeOffset = value.translation.width
                }
                .onEnded { value in
                    guard !isSwipeAnimating else { return }
                    handleSwipeEnd(translation: value.translation.width)
                }
        )
        .onTapGesture {
            selectedStamp = stamp
        }
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("Swipe left or right to browse, or tap to view details")
    }

    private func handleSwipeEnd(translation: CGFloat) {
        let threshold: CGFloat = 60
        if translation < -threshold, currentIndex < stamps.count - 1 {
            advance(forward: true)
        } else if translation > threshold, currentIndex > 0 {
            advance(forward: false)
        } else {
            withAnimation(StampMotion.fast) {
                swipeOffset = 0
            }
        }
    }

    /// A committed swipe completes the gesture's own motion instead of truncating it: the current
    /// card finishes sliding fully off-screen in the direction it was already moving, *then* the
    /// index changes and the new card enters from the **opposite** side and settles to center —
    /// swipe left, current card exits left, next stamp enters from the right (standard paging
    /// convention, e.g. Photos app) — rather than an instant content swap under one animation.
    ///
    /// Sequenced with `Task` + explicit sleeps rather than nested `withAnimation(completion:)`
    /// calls — a bare (non-animated) state assignment sandwiched between two nested completion
    /// handlers doesn't reliably get its own render pass before the next animation starts, which
    /// made the two phases blur together unpredictably. Waiting past the spring's own settle time
    /// guarantees phase 1 has actually finished on screen before phase 2 begins.
    private func advance(forward: Bool) {
        isSwipeAnimating = true
        let exitOffset: CGFloat = forward ? -(cardWidth + 40) : (cardWidth + 40)
        withAnimation(StampMotion.fast) {
            swipeOffset = exitOffset
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(0.42))
            swipeOffset = -exitOffset
            currentIndex += forward ? 1 : -1
            withAnimation(StampMotion.fast) {
                swipeOffset = 0
            }
            try? await Task.sleep(for: .seconds(0.42))
            isSwipeAnimating = false
        }
    }
}
