import SwiftUI

/// First-launch welcome screen: a scatter of real stamps behind a frosted bottom card, the same
/// "album art collage + glass welcome sheet" convention reference apps use for a first impression
/// that shows the content instead of describing it.
struct OnboardingView: View {
    @Environment(StampRepository.self) private var repository
    let onGetStarted: () -> Void

    @State private var scatterStamps: [Stamp] = []

    private struct Spot {
        let x: CGFloat
        let y: CGFloat
        let size: CGFloat
        let rotation: Double
    }

    private let spots: [Spot] = [
        Spot(x: 0.16, y: 0.11, size: 100, rotation: -9),
        Spot(x: 0.80, y: 0.08, size: 128, rotation: 7),
        Spot(x: 0.08, y: 0.36, size: 110, rotation: 11),
        Spot(x: 0.86, y: 0.33, size: 92, rotation: -13),
        Spot(x: 0.30, y: 0.52, size: 122, rotation: -6),
        Spot(x: 0.70, y: 0.55, size: 96, rotation: 10),
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            StampColor.bgPage.ignoresSafeArea()

            GeometryReader { geometry in
                ForEach(Array(zip(spots.indices, spots)), id: \.0) { index, spot in
                    if scatterStamps.indices.contains(index) {
                        LocalStampImage(url: scatterStamps[index].localImageURL, contentMode: .fill)
                            .frame(width: spot.size, height: spot.size)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .shadow(color: .black.opacity(0.18), radius: 10, x: 0, y: 6)
                            .rotationEffect(.degrees(spot.rotation))
                            .position(x: spot.x * geometry.size.width, y: spot.y * geometry.size.height)
                    }
                }
            }
            .ignoresSafeArea()

            welcomeCard
        }
        .task(id: repository.stamps.count) {
            guard scatterStamps.isEmpty, !repository.stamps.isEmpty else { return }
            scatterStamps = Array(repository.stamps.shuffled().prefix(spots.count))
        }
    }

    private var welcomeCard: some View {
        VStack(spacing: 18) {
            if let icon = scatterStamps.first {
                LocalStampImage(url: icon.localImageURL, contentMode: .fill)
                    .frame(width: 64, height: 64)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(StampColor.inkPrimary.opacity(0.08)))
                    .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
            }

            VStack(spacing: 8) {
                Text("Welcome to India in Stamps")
                    .font(StampFont.title1())
                    .foregroundStyle(StampColor.inkPrimary)
                    .multilineTextAlignment(.center)

                Text("For the history behind every *stamp*.")
                    .font(StampFont.body())
                    .foregroundStyle(StampColor.inkSecondary)
                    .multilineTextAlignment(.center)
            }

            Button(action: onGetStarted) {
                Text("Get Started")
                    .font(StampFont.headline())
                    .foregroundStyle(StampColor.bgPage)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(StampColor.inkPrimary, in: Capsule())
            }
            .buttonStyle(.plain)

            Text("3,045 stamps, cataloged and fully offline.")
                .font(StampFont.caption1())
                .foregroundStyle(StampColor.inkTertiary)
        }
        .padding(.horizontal, 28)
        .padding(.top, 32)
        .padding(.bottom, 24)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial, in: UnevenRoundedRectangle(topLeadingRadius: 32, topTrailingRadius: 32))
        .ignoresSafeArea(edges: .bottom)
    }
}
