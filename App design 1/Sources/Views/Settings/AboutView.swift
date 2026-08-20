import SwiftUI

/// design.md §9.6 — reached via the profile icon in Collections' toolbar, not its own tab.
/// Credits the audit work rather than hiding it (§12): dataset scope, the Wikipedia
/// cross-reference process, and an honest note on known gaps.
///
/// NOTE: §9.6 originally listed an "appearance override" control alongside haptics. That's
/// dropped here — §13 item 5 confirmed this app stays light-only, permanently, so there is
/// nothing left to override. design.md should be updated to match.
struct AboutView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(StampRepository.self) private var repository
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Toggle("Haptics", isOn: $hapticsEnabled)
                }

                Section("About this catalog") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(repository.stamps.count) stamps, 1947–present")
                            .font(StampFont.subheadline())
                            .foregroundStyle(StampColor.inkPrimary)
                        Text("Each record was hand-audited against the Wikipedia cross-reference of Indian postage stamps to fill in issue dates, denominations, and historical context.")
                            .font(StampFont.footnote())
                            .foregroundStyle(StampColor.inkSecondary)
                        Text("A small number of stamps are missing their source image and are marked \"Image not yet digitized\" rather than shown as an error — a known, documented gap in the source material, not a bug.")
                            .font(StampFont.footnote())
                            .foregroundStyle(StampColor.inkSecondary)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("About")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
