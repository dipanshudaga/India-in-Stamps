import SwiftUI

/// Browse the catalog by release date — a real month grid, days with a stamp issued are marked,
/// tapping one shows what was released. Its own bottom tab; `RootTabView` supplies the enclosing
/// `NavigationStack`, same as every other tab.
struct CalendarView: View {
    @Environment(StampRepository.self) private var repository
    @State private var displayedMonth = Date()
    @State private var selectedDayKey: String?
    @State private var selectedStamp: Stamp?
    /// Computed once (not on every cell render) — see TimelineView's header comment for why this
    /// class of bug matters: recomputing a full-dataset grouping per grid cell is what caused the
    /// app to hang and get killed on-device.
    @State private var stampsByDate: [String: [Stamp]] = [:]

    private var calendar: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.firstWeekday = 1
        return cal
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                monthHeader
                weekdayHeader
                monthGrid
                if let key = selectedDayKey, let stamps = stampsByDate[key], !stamps.isEmpty {
                    selectedDayResults(stamps)
                }
            }
            .padding(20)
        }
        .stampPageBackground()
        .navigationTitle("Calendar")
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
        .task(id: repository.stamps.count) {
            guard !repository.stamps.isEmpty, stampsByDate.isEmpty else { return }
            stampsByDate = Dictionary(grouping: repository.stamps.filter { $0.issueDate != nil }) {
                dayKey(for: $0.issueDate!)
            }
        }
    }

    // MARK: - Data

    private func dayKey(for date: Date) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
    }

    private var yearRange: [Int] {
        let years = Set(repository.stamps.map(\.year).filter { $0 > 0 })
        return years.sorted(by: >)
    }

    // MARK: - Header

    private var monthHeader: some View {
        HStack {
            Button {
                changeMonth(by: -1)
            } label: {
                Image(systemName: "chevron.left").frame(width: 44, height: 44)
            }

            Spacer()

            Menu {
                ForEach(yearRange, id: \.self) { year in
                    Button(String(year)) { jump(toYear: year) }
                }
            } label: {
                Text(monthYearTitle)
                    .font(StampFont.title2())
                    .foregroundStyle(StampColor.inkPrimary)
            }

            Spacer()

            Button {
                changeMonth(by: 1)
            } label: {
                Image(systemName: "chevron.right").frame(width: 44, height: 44)
            }
        }
    }

    private var monthYearTitle: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: displayedMonth)
    }

    private func changeMonth(by delta: Int) {
        guard let newDate = calendar.date(byAdding: .month, value: delta, to: displayedMonth) else { return }
        withAnimation(StampMotion.fast) {
            displayedMonth = newDate
            selectedDayKey = nil
        }
    }

    private func jump(toYear year: Int) {
        var components = calendar.dateComponents([.year, .month, .day], from: displayedMonth)
        components.year = year
        if let newDate = calendar.date(from: components) {
            withAnimation(StampMotion.fast) {
                displayedMonth = newDate
                selectedDayKey = nil
            }
        }
    }

    // MARK: - Grid

    private var weekdayHeader: some View {
        HStack {
            ForEach(calendar.veryShortWeekdaySymbols, id: \.self) { symbol in
                Text(symbol)
                    .font(StampFont.caption1())
                    .foregroundStyle(StampColor.inkTertiary)
                    .frame(maxWidth: .infinity)
            }
        }
    }

    private var monthDays: [Date?] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: displayedMonth),
              let firstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start) else {
            return []
        }
        let leadingEmptyDays = calendar.dateComponents([.day], from: firstWeek.start, to: monthInterval.start).day ?? 0
        var days: [Date?] = Array(repeating: nil, count: max(leadingEmptyDays, 0))

        var current = monthInterval.start
        while current < monthInterval.end {
            days.append(current)
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
        }
        return days
    }

    private var monthGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
            ForEach(Array(monthDays.enumerated()), id: \.offset) { _, date in
                if let date {
                    dayCell(date)
                } else {
                    Color.clear.frame(height: dayCellHeight)
                }
            }
        }
    }

    private let thumbnailSize: CGFloat = 44
    private var dayCellHeight: CGFloat { thumbnailSize + 20 }

    /// A day with stamps shows an actual thumbnail of one of them (not just a dot) - the same
    /// "photo calendar" convention Photos/Google Photos use, so scanning the month for what was
    /// issued reads at a glance instead of needing to tap every marked day. The thumbnail sits
    /// tilted over the date number rather than stacked below it - like a photo casually dropped on
    /// a calendar page, with the number still peeking out from behind - matching the tilted-photo
    /// treatment this app already uses elsewhere. Multiple stamps on one date get a small count
    /// badge on the thumbnail's corner rather than the thumbnail itself trying to represent more
    /// than one stamp.
    private func dayCell(_ date: Date) -> some View {
        let key = dayKey(for: date)
        let dayStamps = stampsByDate[key] ?? []
        let hasStamps = !dayStamps.isEmpty
        let isSelected = selectedDayKey == key
        let dayNumber = calendar.component(.day, from: date)

        return Button {
            withAnimation(StampMotion.instant) {
                selectedDayKey = isSelected ? nil : key
            }
        } label: {
            ZStack {
                Text("\(dayNumber)")
                    .font(StampFont.subheadline())
                    .foregroundStyle(isSelected ? StampColor.accentPrimary : StampColor.inkSecondary)

                if let cover = dayStamps.first {
                    ZStack(alignment: .topTrailing) {
                        LocalStampImage(url: cover.localImageURL, contentMode: .fill)
                            .frame(width: thumbnailSize, height: thumbnailSize)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .strokeBorder(isSelected ? StampColor.accentPrimary : .clear, lineWidth: 2)
                            )
                            .shadow(color: .black.opacity(0.25), radius: 3, x: 0, y: 2)

                        if dayStamps.count > 1 {
                            Text("\(dayStamps.count)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(minWidth: 15, minHeight: 15)
                                .background(StampColor.accentPrimary, in: Circle())
                                .offset(x: 6, y: -6)
                        }
                    }
                    .rotationEffect(.degrees(-9))
                    .offset(x: 5, y: 3)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: dayCellHeight)
        }
        .buttonStyle(.plain)
        .opacity(hasStamps ? 1 : 0.3)
        .disabled(!hasStamps)
    }

    // MARK: - Selected day results

    private func selectedDayResults(_ stamps: [Stamp]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(stamps.first?.issueDateDisplay ?? "")
                .font(StampFont.headline())
                .foregroundStyle(StampColor.inkPrimary)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 12)], spacing: 12) {
                ForEach(stamps) { stamp in
                    Button {
                        selectedStamp = stamp
                    } label: {
                        StampCard(stamp: stamp)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.top, 8)
    }
}
