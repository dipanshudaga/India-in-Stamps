import SwiftUI

/// How a stamp image displays as a tappable unit across Timeline, Gallery, Search, and Collections
/// — mounted inside a display case (§5 of the modern-museum brief). No corner rounding on the
/// stamp image itself — real stamps have straight-edge corners; the case frame is what's rounded.
struct StampCard: View {
    let stamp: Stamp
    var parallaxEnabled: Bool = true

    var body: some View {
        DisplayCase(parallaxEnabled: parallaxEnabled) {
            LocalStampImage(url: stamp.localImageURL)
        }
        .accessibilityLabel(stamp.name)
    }
}
