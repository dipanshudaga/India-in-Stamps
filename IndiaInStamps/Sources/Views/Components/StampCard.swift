import SwiftUI

/// How a stamp image displays as a tappable unit across Timeline, Gallery, Search, and Collections.
/// No corner rounding — real stamps have straight-edge corners. Save-to-collection lives only in
/// Detail's floating toolbar now.
struct StampCard: View {
    let stamp: Stamp

    var body: some View {
        LocalStampImage(url: stamp.localImageURL)
            .shadow(color: .black.opacity(0.16), radius: 10, y: 5)
            .accessibilityLabel(stamp.name)
    }
}
