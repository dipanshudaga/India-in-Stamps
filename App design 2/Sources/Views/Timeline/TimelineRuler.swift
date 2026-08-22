import SwiftUI

/// Horizontal scrubber beneath the featured stamp. Renders only a local window of ticks around
/// the current stamp — one tick per stamp, not all 3000+ at once — with year labels as landmarks
/// where the year changes. Ticks taper by distance from the current stamp, and the current tick
/// grows further while actively dragging — a lens/magnification feel, not uniform marks. Each
/// step across a tick springs into place and fires a selection haptic — magnetic, not a smooth float.
struct TimelineRuler: View {
    let stamps: [Stamp]
    @Binding var currentIndex: Int

    private let tickSpacing: CGFloat = 26
    private let windowRadius = 16

    @State private var dragStartIndex: Int?
    @State private var isDragging = false

    var body: some View {
        GeometryReader { geometry in
            let center = geometry.size.width / 2
            ZStack {
                ForEach(-windowRadius...windowRadius, id: \.self) { offset in
                    tick(at: offset, center: center)
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
        .frame(height: 104)
        .sensoryFeedback(.impact(weight: .light, intensity: 0.75), trigger: currentIndex)
        .accessibilityElement()
        .accessibilityLabel("Timeline scrubber")
        .accessibilityValue(stamps.indices.contains(currentIndex) ? String(stamps[currentIndex].year) : "")
        .accessibilityHint("Drag to move through stamps chronologically")
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: currentIndex = clampedIndex(currentIndex + 1)
            case .decrement: currentIndex = clampedIndex(currentIndex - 1)
            @unknown default: break
            }
        }
    }

    private func clampedIndex(_ index: Int) -> Int {
        min(max(index, 0), max(stamps.count - 1, 0))
    }

    private func falloff(for offset: Int) -> CGFloat {
        let distance = CGFloat(abs(offset))
        let normalized = min(distance / 7, 1)
        return 1 - normalized * normalized * 0.72
    }

    @ViewBuilder
    private func tick(at offset: Int, center: CGFloat) -> some View {
        let index = currentIndex + offset
        if stamps.indices.contains(index) {
            let isCurrent = offset == 0
            let showsYearLabel = stamps.indices.contains(index - 1) && stamps[index].year != stamps[index - 1].year
            let taper = falloff(for: offset)
            let interactiveBoost: CGFloat = (isCurrent && isDragging) ? 1.3 : 1.0
            // The current tick reads as the "selected" landmark, not just another mark in the
            // row — a visibly longer capsule (not just a color change) is what makes the magnetic
            // snap feel physical: the ruler is telling you where it locked, not just tinting it.
            let currentBoost: CGFloat = isCurrent ? 1.4 : 1.0
            let baseHeight: CGFloat = 34
            let baseWidth: CGFloat = 4

            VStack(spacing: 14) {
                if showsYearLabel {
                    Text(String(stamps[index].year))
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundStyle(StampColor.inkSecondary)
                        .lineLimit(1)
                        .frame(height: 20)
                } else {
                    Color.clear.frame(height: 20)
                }
                Capsule()
                    .fill(isCurrent ? StampColor.accentPrimary : StampColor.inkTertiary)
                    .frame(width: baseWidth * taper, height: baseHeight * taper * interactiveBoost * currentBoost)
            }
            .position(x: center + CGFloat(offset) * tickSpacing, y: 52)
        }
    }
}
