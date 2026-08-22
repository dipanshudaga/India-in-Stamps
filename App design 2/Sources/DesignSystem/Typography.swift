import SwiftUI

/// design.md §3, revised: New York (serif) now carries every identifying name/title in the app —
/// Large Title, Title 1, and Title 2/3 (stamp names, collection titles) — for a classier, more
/// editorial register. Body copy, metadata, tags, and anything tapped or scanned quickly stays SF Pro.
enum StampFont {
    static func largeTitle() -> Font { .system(.largeTitle, design: .serif, weight: .bold) }
    static func title1() -> Font { .system(.title, design: .serif, weight: .bold) }
    static func title2() -> Font { .system(.title2, design: .serif, weight: .semibold) }
    static func title3() -> Font { .system(.title3, design: .serif, weight: .semibold) }
    static func headline() -> Font { .system(.headline, design: .default, weight: .semibold) }
    static func body() -> Font { .system(.body) }
    static func callout() -> Font { .system(.callout) }
    static func subheadline() -> Font { .system(.subheadline) }
    static func footnote() -> Font { .system(.footnote) }
    static func caption1() -> Font { .system(.caption) }
    static func caption2() -> Font { .system(.caption2) }
}

extension View {
    /// The one deliberate leading override in §3 — Body copy set looser (~1.4x) than the system
    /// default for long-form historical descriptions. Approximate; tune once visible in Simulator.
    func stampBodyLeading() -> some View {
        lineSpacing(5)
    }
}
