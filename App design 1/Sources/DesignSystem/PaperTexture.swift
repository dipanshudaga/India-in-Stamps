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

/// A very subtle paper-grain texture over `bg.page`, replacing a flat fill so large expanses of
/// cream read as an archive material rather than a flat vector fill. No new colors — just faint
/// specks in `ink.tertiary` at low opacity.
struct PaperTextureBackground: View {
    var body: some View {
        Canvas { context, size in
            var rng = SeededGenerator(seed: 42)
            let dotCount = Int(size.width * size.height / 1100)
            for _ in 0..<dotCount {
                let x = CGFloat.random(in: 0...size.width, using: &rng)
                let y = CGFloat.random(in: 0...size.height, using: &rng)
                let dotSize = CGFloat.random(in: 0.5...1.3, using: &rng)
                let opacity = Double.random(in: 0.03...0.07, using: &rng)
                context.fill(
                    Path(ellipseIn: CGRect(x: x, y: y, width: dotSize, height: dotSize)),
                    with: .color(StampColor.inkTertiary.opacity(opacity))
                )
            }
        }
        .background(StampColor.bgPage)
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
