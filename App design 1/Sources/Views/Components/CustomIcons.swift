import SwiftUI

/// design.md §5.2 — the custom icon set, for what SF Symbols can't express. Colored via ink/accent
/// tokens only, never a hardcoded fill.
///
/// NOTE: the Collections *tab bar* icon still uses an SF Symbol — `Tab` only accepts an SF Symbol
/// or an asset-catalog Image for its icon, not an arbitrary SwiftUI view, and these are drawn in
/// code rather than as importable vector assets. The two icons below are used in places that
/// accept any View: empty states and placeholders.

/// "A single unfilled stamp outline with a dashed perforation edge" — used for the empty-collection
/// state and the missing-image placeholder, both a stamp that isn't there yet.
struct PerforatedStampOutline: View {
    var color: Color = StampColor.inkTertiary
    var size: CGSize = CGSize(width: 48, height: 60)

    var body: some View {
        Canvas { context, canvasSize in
            let dotRadius: CGFloat = 1.8
            let rect = CGRect(origin: .zero, size: canvasSize).insetBy(dx: dotRadius * 2, dy: dotRadius * 2)

            context.stroke(Path(rect), with: .color(color), lineWidth: 1.3)

            func dot(_ point: CGPoint) {
                let d = CGRect(x: point.x - dotRadius, y: point.y - dotRadius, width: dotRadius * 2, height: dotRadius * 2)
                context.fill(Path(ellipseIn: d), with: .color(color))
            }

            let spacing: CGFloat = 8
            var x = rect.minX
            while x <= rect.maxX {
                dot(CGPoint(x: x, y: rect.minY))
                dot(CGPoint(x: x, y: rect.maxY))
                x += spacing
            }
            var y = rect.minY
            while y <= rect.maxY {
                dot(CGPoint(x: rect.minX, y: y))
                dot(CGPoint(x: rect.maxX, y: y))
                y += spacing
            }
        }
        .frame(width: size.width, height: size.height)
    }
}

/// "A postmark-style circular stamp cancellation mark" — used in Search's empty state.
struct PostmarkIcon: View {
    var color: Color = StampColor.inkTertiary
    var diameter: CGFloat = 40

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) / 2 - 6

            context.stroke(
                Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)),
                with: .color(color), lineWidth: 1.3
            )
            context.stroke(
                Path(ellipseIn: CGRect(x: center.x - radius * 0.55, y: center.y - radius * 0.55, width: radius * 1.1, height: radius * 1.1)),
                with: .color(color), lineWidth: 1
            )

            for degrees in stride(from: 0.0, to: 360.0, by: 30.0) {
                let radians = degrees * .pi / 180
                let start = CGPoint(x: center.x + cos(radians) * radius * 1.15, y: center.y + sin(radians) * radius * 1.15)
                let end = CGPoint(x: center.x + cos(radians) * radius * 1.45, y: center.y + sin(radians) * radius * 1.45)
                var line = Path()
                line.move(to: start)
                line.addLine(to: end)
                context.stroke(line, with: .color(color), lineWidth: 1)
            }
        }
        .frame(width: diameter, height: diameter)
    }
}
