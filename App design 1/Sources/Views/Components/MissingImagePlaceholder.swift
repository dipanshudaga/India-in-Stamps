import SwiftUI

/// design.md §9.3 — for the ~21 stamps the audit flagged as missing their source image.
/// Phrased archivally ("Image not yet digitized"), the way a museum treats an item on loan,
/// not the way an app treats a 404.
struct MissingImagePlaceholder: View {
    var body: some View {
        VStack(spacing: 10) {
            PerforatedStampOutline(color: StampColor.inkTertiary)
            Text("Image not yet digitized")
                .font(StampFont.caption1())
                .foregroundStyle(StampColor.inkSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(StampColor.bgCard)
    }
}
