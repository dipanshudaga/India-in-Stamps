import SwiftUI

/// design.md §9.3 — hero image on a bg.glassTint mat (echoing a museum specimen mount), then
/// denomination/date, tag chips, and the historical description. Floating Clear-glass toolbar:
/// back / save / share, over the hero image — the one place in the app Clear glass is justified
/// (§4.1: media-rich content underneath, bold and bright).
struct StampDetailView: View {
    let stamp: Stamp
    @Environment(CollectionsStore.self) private var collectionsStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true
    @State private var contentVisible = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                heroImage
                detailContent
                    .padding(.horizontal, 20)
                    .padding(.bottom, 32)
                    .opacity(contentVisible ? 1 : 0)
                    .offset(y: contentVisible ? 0 : 8)
            }
        }
        .stampPageBackground()
        .ignoresSafeArea(edges: .top)
        // Hides the system back button/title, not the edge-swipe gesture itself — swipe-to-go-back
        // stays live per design.md §6.2.
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .top) { floatingToolbar }
        .task {
            guard !reduceMotion else { contentVisible = true; return }
            try? await Task.sleep(for: .milliseconds(80))
            withAnimation(StampMotion.fast) { contentVisible = true }
        }
    }

    private var heroImage: some View {
        LocalStampImage(url: stamp.localImageURL, contentMode: .fit)
            .padding(40)
            .frame(maxWidth: .infinity, minHeight: 320)
            .background(StampColor.bgGlassTint)
    }

    private var detailContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(stamp.name)
                    .font(StampFont.title2())
                    .foregroundStyle(StampColor.inkPrimary)
                Text(stamp.denominationDisplay)
                    .font(StampFont.headline())
                    .foregroundStyle(StampColor.inkPrimary)
                Text(stamp.issueDateDisplay)
                    .font(StampFont.subheadline())
                    .foregroundStyle(StampColor.inkSecondary)
            }

            if !stamp.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(stamp.tags, id: \.self) { tag in
                            Text(tag)
                                .font(StampFont.footnote())
                                .foregroundStyle(StampColor.inkPrimary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(StampColor.accentStructural.opacity(0.35), in: Capsule())
                                .overlay(Capsule().strokeBorder(StampColor.accentStructural, lineWidth: 1))
                        }
                    }
                }
            }

            Text(stamp.description)
                .font(StampFont.body())
                .foregroundStyle(StampColor.inkPrimary)
                .stampBodyLeading()
        }
    }

    private var floatingToolbar: some View {
        GlassEffectContainer {
            HStack {
                toolbarButton(systemImage: "chevron.backward", label: "Back") {
                    dismiss()
                }

                Spacer()

                toolbarButton(
                    systemImage: collectionsStore.isSaved(stamp) ? "bookmark.fill" : "bookmark",
                    label: collectionsStore.isSaved(stamp) ? "Saved to collection" : "Save to collection",
                    tint: collectionsStore.isSaved(stamp) ? StampColor.accentPrimary : nil
                ) {
                    if hapticsEnabled {
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                    }
                    collectionsStore.save(stamp)
                }
                .disabled(collectionsStore.isSaved(stamp))

                ShareLink(item: stamp.pageURL ?? URL(string: "https://postagestamps.gov.in")!) {
                    Image(systemName: "square.and.arrow.up")
                        .frame(width: 44, height: 44)
                }
                .glassEffect(.clear.interactive(), in: .circle)
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)
        }
    }

    private func toolbarButton(systemImage: String, label: String, tint: Color? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .foregroundStyle(tint ?? StampColor.inkPrimary)
                .frame(width: 44, height: 44)
        }
        .glassEffect(.clear.interactive(), in: .circle)
        .accessibilityLabel(label)
    }
}
