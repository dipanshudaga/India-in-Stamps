import SwiftUI

/// "Modern museum" direction: a soft gallery-lighting gradient plus a faint, evenly-spaced dot
/// grid — the same quiet backdrop convention as a design-tool canvas or a specimen catalog page,
/// kept subtle enough to read as texture rather than a graphic pattern.
struct PaperTextureBackground: View {
    private let gridSpacing: CGFloat = 20
    private let dotDiameter: CGFloat = 2.2
    private let dotOpacity: Double = 0.16

    var body: some View {
        Canvas { context, size in
            var y = gridSpacing / 2
            while y < size.height {
                var x = gridSpacing / 2
                while x < size.width {
                    context.fill(
                        Path(ellipseIn: CGRect(x: x - dotDiameter / 2, y: y - dotDiameter / 2, width: dotDiameter, height: dotDiameter)),
                        with: .color(StampColor.inkTertiary.opacity(dotOpacity))
                    )
                    x += gridSpacing
                }
                y += gridSpacing
            }
        }
        .background(
            LinearGradient(
                colors: [StampColor.bgPage.opacity(0.97), StampColor.bgPage],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .allowsHitTesting(false)
    }
}

extension View {
    /// Standard page background — dot-grid texture over bg.page. Use in place of a flat
    /// `.background(StampColor.bgPage)` everywhere a screen fills its full canvas.
    func stampPageBackground() -> some View {
        background(PaperTextureBackground())
    }
}
