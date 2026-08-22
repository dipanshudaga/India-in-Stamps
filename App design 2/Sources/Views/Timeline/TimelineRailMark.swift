import SwiftUI

/// The vertical timeline rail — a dot per year connected by a continuous line, echoing the
/// reference's exhibition-catalogue chapter markers. Stretches to match its row's natural height.
struct TimelineRailMark: View {
    var body: some View {
        VStack(spacing: 6) {
            Circle()
                .fill(StampColor.accentPrimary)
                .frame(width: 8, height: 8)
            Rectangle()
                .fill(StampColor.accentStructural.opacity(0.5))
                .frame(width: 1.5)
                .frame(maxHeight: .infinity)
        }
        .frame(width: 8)
    }
}
