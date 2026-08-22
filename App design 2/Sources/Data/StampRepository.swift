import Foundation
import Observation

/// Offline-first catalog load: parses the bundled `StampsEnriched.csv` once, in-memory, no network.
@Observable
final class StampRepository {
    private(set) var stamps: [Stamp] = []
    /// Sorted ascending by issue date (falling back to year, then id, when the date didn't parse) —
    /// the order the Timeline scrubber steps through.
    private(set) var chronological: [Stamp] = []
    private(set) var isLoaded = false

    func loadIfNeeded() {
        guard !isLoaded else { return }
        load()
    }

    private func load() {
        defer { isLoaded = true }

        guard let url = Bundle.main.url(forResource: "StampsEnriched", withExtension: "csv"),
              let content = try? String(contentsOf: url, encoding: .utf8) else {
            assertionFailure("StampsEnriched.csv missing from bundle")
            return
        }

        let rows = CSVParser.parse(content)
        guard let header = rows.first else { return }
        let columnIndex = Dictionary(uniqueKeysWithValues: header.enumerated().map { ($1, $0) })

        func value(_ row: [String], _ column: String) -> String {
            guard let idx = columnIndex[column], idx < row.count else { return "" }
            return row[idx]
        }

        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withFullDate]

        var parsed: [Stamp] = []
        parsed.reserveCapacity(rows.count)

        for (index, row) in rows.dropFirst().enumerated() {
            guard row.contains(where: { !$0.isEmpty }) else { continue }

            let tags = value(row, "tags")
                .split(separator: ",")
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }

            let stamp = Stamp(
                id: index,
                name: value(row, "name"),
                issueDateDisplay: value(row, "issue_date"),
                issueDate: isoFormatter.date(from: value(row, "iso_date")),
                year: Int(value(row, "year")) ?? 0,
                denominationINR: Double(value(row, "denomination_inr")) ?? 0,
                type: value(row, "type"),
                imageURL: URL(string: value(row, "image_url")),
                localImageRelativePath: Self.relativePath(from: value(row, "image_local")),
                brochureURL: URL(string: value(row, "brochure_url")),
                pageURL: URL(string: value(row, "page_url")),
                tags: tags,
                description: value(row, "description")
            )
            parsed.append(stamp)
        }

        stamps = parsed
        chronological = parsed.sorted { lhs, rhs in
            switch (lhs.issueDate, rhs.issueDate) {
            case let (l?, r?) where l != r:
                return l < r
            default:
                return lhs.year != rhs.year ? lhs.year < rhs.year : lhs.id < rhs.id
            }
        }
    }

    /// The clean-cutout set is always `.png`, regardless of the original scan's format (the
    /// source dataset mixes .jpg/.jpeg/.png/.gif) — swap whatever extension the CSV recorded.
    private static func relativePath(from absoluteLocalPath: String) -> String? {
        guard !absoluteLocalPath.isEmpty,
              let range = absoluteLocalPath.range(of: "Stamps Images/") else { return nil }
        let original = String(absoluteLocalPath[range.upperBound...])
        let withoutExtension = (original as NSString).deletingPathExtension
        return withoutExtension + ".png"
    }
}
