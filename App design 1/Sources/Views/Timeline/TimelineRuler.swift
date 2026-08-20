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
        .frame(height: 90)
        .sensoryFeedback(.selection, trigger: currentIndex)
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

    /// Tapered scale: 1.0 at the current tick, falling off smoothly with distance, floored so
    /// distant ticks stay visible rather than vanishing.
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
            let baseHeight: CGFloat = 34
            let baseWidth: CGFloat = 4

            VStack(spacing: 6) {
                if showsYearLabel {
                    Text(String(stamps[index].year))
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(StampColor.inkSecondary)
                        .fixedSize()
                } else {
                    Color.clear.frame(height: 15)
                }
                Capsule()
                    .fill(isCurrent ? StampColor.accentPrimary : StampColor.inkTertiary)
                    .frame(width: baseWidth * taper, height: baseHeight * taper * interactiveBoost)
            }
            .position(x: center + CGFloat(offset) * tickSpacing, y: 45)
        }
    }
}
