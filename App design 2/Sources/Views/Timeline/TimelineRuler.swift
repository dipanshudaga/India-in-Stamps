import SwiftUI

/// Horizontal scrubber beneath the featured stamp. Renders only a local window of ticks around
/// the current stamp — one tick per stamp, not all 3000+ at once. Ticks taper by distance from the
/// current stamp, and the current tick grows further while actively dragging — a lens/magnification
/// feel, not uniform marks. Each step across a tick springs into place and fires a selection haptic
/// — magnetic, not a smooth float.
///
/// The year is read from a single fixed "reel" readout above the ticks, not from labels baked into
/// individual ticks — a per-tick label's x-position depends on how many stamps share that year, so
/// it lands at a different offset every time and visibly jumps as you scroll. A single centered
/// readout with `.contentTransition(.numericText())` rolls smoothly in place instead, with the
/// neighboring years faded to the sides as a reel/picker would show them.
struct TimelineRuler: View {
    let stamps: [Stamp]
    @Binding var currentIndex: Int

    private let tickSpacing: CGFloat = 26
    private let windowRadius = 16
    private let tickAreaHeight: CGFloat = 66

    @State private var dragStartIndex: Int?
    @State private var isDragging = false

    var body: some View {
        VStack(spacing: 6) {
            yearReel

            GeometryReader { geometry in
                let center = geometry.size.width / 2
                ZStack {
                    ForEach(windowIndices, id: \.self) { index in
                        tick(for: index, center: center)
                    }
                }
                .animation(StampMotion.instant, value: currentIndex)
                .animation(StampMotion.instant, value: isDragging)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            if dragStartIndex == nil {
                                dragStartIndex = currentIndex
                                isDragging = true
                            }
                            let steps = Int((-value.translation.width / tickSpacing).rounded())
                            currentIndex = clampedIndex((dragStartIndex ?? currentIndex) + steps)
                        }
                        .onEnded { _ in
                            dragStartIndex = nil
                            isDragging = false
                        }
                )
            }
            .frame(height: tickAreaHeight)
        }
        .frame(height: 110)
        .sensoryFeedback(.impact(weight: .light, intensity: 0.75), trigger: currentIndex)
        .accessibilityElement()
        .accessibilityLabel("Timeline scrubber")
        .accessibilityValue(stamps.indices.contains(currentIndex) ? String(currentYear) : "")
        .accessibilityHint("Drag to move through stamps chronologically")
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: currentIndex = clampedIndex(currentIndex + 1)
            case .decrement: currentIndex = clampedIndex(currentIndex - 1)
            @unknown default: break
            }
        }
    }

    private var currentYear: Int {
        stamps.indices.contains(currentIndex) ? stamps[currentIndex].year : 0
    }

    /// Scans outward from the current index rather than building a de-duped year list over all
    /// 3,000+ stamps - `stamps` is already chronological, so the nearest differing year in either
    /// direction is at most a year's worth of stamps away.
    private var previousYear: Int? {
        var i = currentIndex - 1
        while stamps.indices.contains(i) {
            if stamps[i].year != currentYear { return stamps[i].year }
            i -= 1
        }
        return nil
    }

    private var nextYear: Int? {
        var i = currentIndex + 1
        while stamps.indices.contains(i) {
            if stamps[i].year != currentYear { return stamps[i].year }
            i += 1
        }
        return nil
    }

    private var yearReel: some View {
        ZStack {
            if let previousYear {
                Text(String(previousYear))
                    .font(.system(size: 19, weight: .medium, design: .rounded))
                    .foregroundStyle(StampColor.inkTertiary)
                    .opacity(0.35)
                    .offset(x: -92)
            }
            if let nextYear {
                Text(String(nextYear))
                    .font(.system(size: 19, weight: .medium, design: .rounded))
                    .foregroundStyle(StampColor.inkTertiary)
                    .opacity(0.35)
                    .offset(x: 92)
            }
            Text(String(currentYear))
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundStyle(StampColor.inkPrimary)
                .contentTransition(.numericText())
        }
        .animation(.snappy, value: currentYear)
        .frame(height: 34)
    }

    private func clampedIndex(_ index: Int) -> Int {
        min(max(index, 0), max(stamps.count - 1, 0))
    }

    private func falloff(for offset: Int) -> CGFloat {
        let distance = CGFloat(abs(offset))
        let normalized = min(distance / 7, 1)
        return 1 - normalized * normalized * 0.72
    }

    /// Absolute stamp indices in view, centered on `currentIndex` - identifying ticks by their
    /// *absolute* index (not their on-screen offset slot) is what makes them actually slide: a
    /// given tick keeps its identity as `currentIndex` moves, so its `.position(x:)` below is a
    /// genuinely changing value SwiftUI animates, rather than a fixed slot that just swaps which
    /// stamp's data it happens to be showing this frame.
    private var windowIndices: [Int] {
        let lower = max(0, currentIndex - windowRadius)
        let upper = min(stamps.count - 1, currentIndex + windowRadius)
        guard lower <= upper else { return [] }
        return Array(lower...upper)
    }

    @ViewBuilder
    private func tick(for index: Int, center: CGFloat) -> some View {
        let offset = index - currentIndex
        let isCurrent = offset == 0
        let taper = falloff(for: offset)
        let interactiveBoost: CGFloat = (isCurrent && isDragging) ? 1.3 : 1.0
        // The current tick reads as the "selected" landmark, not just another mark in the
        // row — a visibly longer capsule (not just a color change) is what makes the magnetic
        // snap feel physical: the ruler is telling you where it locked, not just tinting it.
        let currentBoost: CGFloat = isCurrent ? 1.4 : 1.0
        let baseHeight: CGFloat = 34
        let baseWidth: CGFloat = 4

        Capsule()
            .fill(isCurrent ? StampColor.accentPrimary : StampColor.inkTertiary)
            .frame(width: baseWidth * taper, height: baseHeight * taper * interactiveBoost * currentBoost)
            .position(x: center + CGFloat(offset) * tickSpacing, y: tickAreaHeight / 2)
    }
}
