import Foundation

/// Minimal RFC4180-ish parser: handles quoted fields, embedded commas, escaped `""`, and
/// embedded newlines inside quotes. Foundation has no built-in CSV reader.
enum CSVParser {
    static func parse(_ content: String) -> [[String]] {
        var rows: [[String]] = []
        var field = ""
        var row: [String] = []
        var inQuotes = false

        // Swift's `Character` is an extended grapheme cluster, and Unicode defines CRLF ("\r\n")
        // as a SINGLE grapheme cluster — so a plain `case "\n":` below would never match inside a
        // CRLF-terminated file (every row would silently merge into one). Normalize line endings
        // to bare "\n" first so each row terminator is one matchable Character.
        let normalized = content.replacingOccurrences(of: "\r\n", with: "\n")
        let chars = Array(normalized)
        var i = 0
        while i < chars.count {
            let c = chars[i]
            if inQuotes {
                if c == "\"" {
                    if i + 1 < chars.count, chars[i + 1] == "\"" {
                        field.append("\"")
                        i += 1
                    } else {
                        inQuotes = false
                    }
                } else {
                    field.append(c)
                }
            } else {
                switch c {
                case "\"":
                    inQuotes = true
                case ",":
                    row.append(field)
                    field = ""
                case "\n":
                    row.append(field)
                    field = ""
                    rows.append(row)
                    row = []
                case "\r":
                    break
                default:
                    field.append(c)
                }
            }
            i += 1
        }
        if !field.isEmpty || !row.isEmpty {
            row.append(field)
            rows.append(row)
        }
        return rows
    }
}
