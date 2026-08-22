import SwiftUI

/// A seeded, deterministic RNG so the grain pattern doesn't jitter/regenerate on every redraw.
private struct SeededGenerator: RandomNumberGenerator {
    private var state: UInt64
    init(seed: UInt64) { state = seed &+ 0x9E3779B97F4A7C15 }
    mutating func next() -> UInt64 {
        state ^= state << 13
        state ^= state >> 7
        state ^= state << 17
        return state
    }
}

/// "Modern museum" direction: texture must be barely perceptible — a soft gallery-lighting
/// gradient, not paper grain. If it's noticeable at a glance it's too strong (per the brief).
/// A faint top-lit falloff plus a handful of near-invisible specks, nothing more.
struct PaperTextureBackground: View {
    var body: some View {
        Canvas { context, size in
            var rng = SeededGenerator(seed: 42)
            let dotCount = Int(size.width * size.height / 4200)
            for _ in 0..<dotCount {
                let x = CGFloat.random(in: 0...size.width, using: &rng)
                let y = CGFloat.random(in: 0...size.height, using: &rng)
                let dotSize = CGFloat.random(in: 0.4...1.0, using: &rng)
                let opacity = Double.random(in: 0.015...0.03, using: &rng)
                context.fill(
                    Path(ellipseIn: CGRect(x: x, y: y, width: dotSize, height: dotSize)),
                    with: .color(StampColor.inkTertiary.opacity(opacity))
                )
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
    /// Standard page background — paper texture over bg.page. Use in place of a flat
    /// `.background(StampColor.bgPage)` everywhere a screen fills its full canvas.
    func stampPageBackground() -> some View {
        background(PaperTextureBackground())
    }
}
