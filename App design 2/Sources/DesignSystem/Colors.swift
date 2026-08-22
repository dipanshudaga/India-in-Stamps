import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}

/// "Modern museum" variant of the museum-sepia palette (india_in_stamps_modern_museum_ui_direction.md).
/// Same neutral/ink/accent family as App design 1, pushed lighter — near-white gallery walls
/// instead of warm tan — per direction: "move as close to the reference as possible." Ink and
/// accent tones are unchanged; only background lightness shifts.
enum StampColor {
    /// Gallery wall — the outermost background.
    static let bgPage = Color(hex: 0xFAF8F4)
    /// The display case's interior backing plane — genuinely darker than bgPage, not a near-match.
    /// A case only reads as a recessed box if the box is visibly a different volume than the wall
    /// it's set into; a near-white-on-near-white difference reads as nothing at all.
    static let caseBacking = Color(hex: 0xC7BCA3)
    static let caseBackingDeep = Color(hex: 0xB3A78C)
    /// The archival mount surface the stamp itself sits on, inside the case.
    static let bgCard = Color(hex: 0xFFFFFF)
    static let bgGlassTint = Color(hex: 0xF3F0E9)

    static let inkPrimary = Color(hex: 0x26221D)
    static let inkSecondary = Color(hex: 0x6B6455)
    static let inkTertiary = Color(hex: 0xA79E8C)

    static let accentPrimary = Color(hex: 0x6E6350)
    static let accentStructural = Color(hex: 0xB8AD98)
    /// The case frame edge — needs to read as a physical edge, not a soft divider.
    static let caseFrame = Color(hex: 0x8F836A)

    static let stateSuccess = Color(hex: 0x4C6B4F)
    static let stateDestructive = Color(hex: 0x8A4A3D)
}
