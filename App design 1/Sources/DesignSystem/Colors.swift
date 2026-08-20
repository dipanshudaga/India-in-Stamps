import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}

/// Museum sepia palette — design.md §2. Two neutrals, one ink scale, one sparing accent.
/// Stamps supply every other color in the app; nothing else is allowed to compete with them.
enum StampColor {
    static let bgPage = Color(hex: 0xEDE7DA)
    static let bgGlassTint = Color(hex: 0xE3DCCB)
    static let bgCard = Color(hex: 0xF6F2E9)

    static let inkPrimary = Color(hex: 0x26221D)
    static let inkSecondary = Color(hex: 0x6B6455)
    static let inkTertiary = Color(hex: 0xA79E8C)

    static let accentPrimary = Color(hex: 0x6E6350)
    static let accentStructural = Color(hex: 0xB8AD98)

    static let stateSuccess = Color(hex: 0x4C6B4F)
    static let stateDestructive = Color(hex: 0x8A4A3D)
}
