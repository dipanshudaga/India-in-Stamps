import Foundation

struct Stamp: Identifiable, Hashable {
    let id: Int
    let name: String
    let issueDateDisplay: String
    let issueDate: Date?
    let year: Int
    let denominationINR: Double
    let type: String
    let imageURL: URL?
    let localImageRelativePath: String?
    let brochureURL: URL?
    let pageURL: URL?
    let tags: [String]
    let description: String

    /// design.md §9.3 — 21 known stamps have no source image; treated archivally, not as a 404.
    var hasLocalImage: Bool { localImageRelativePath != nil }

    var denominationDisplay: String {
        denominationINR.formatted(.currency(code: "INR").precision(.fractionLength(0...2)))
    }

    /// Resolves against the bundled `StampImages` folder reference. Returns nil (not a crash)
    /// when the file genuinely isn't there — the caller falls back to the missing-image placeholder.
    var localImageURL: URL? {
        guard let relativePath = localImageRelativePath,
              let root = Bundle.main.url(forResource: "StampImages", withExtension: nil) else { return nil }
        let candidate = root.appendingPathComponent(relativePath)
        return FileManager.default.fileExists(atPath: candidate.path) ? candidate : nil
    }
}
