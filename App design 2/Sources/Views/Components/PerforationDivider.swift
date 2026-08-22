import SwiftUI

/// design.md §5.1 — a repeating small-circle cutout pattern used as a structural divider, never
/// purely decorative. Used beneath Timeline year sections, atop the Detail sheet, and (animated,
/// brightened) as the tear line in §6.4.
struct PerforationDivider: View {
    var color: Color = StampColor.inkTertiary
    var dotDiameter: CGFloat = 4
    var spacing: CGFloat = 8

    var body: some View {
        GeometryReader { geometry in
            let step = dotDiameter + spacing
            let count = max(1, Int(geometry.size.width / step))
            HStack(spacing: spacing) {
                ForEach(0..<count, id: \.self) { _ in
                    Circle()
                        .fill(color)
                        .frame(width: dotDiameter, height: dotDiameter)
                }
            }
        }
        .frame(height: dotDiameter)
        .accessibilityHidden(true)
    }
}
