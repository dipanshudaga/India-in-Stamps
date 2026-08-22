import SwiftUI

/// design.md §9.2 restyled: uniform display-case size across every stamp (per your direction —
/// the source images' native aspect ratios varied enough that masonry read as inconsistent box
/// sizes, not intentional variety). A fixed grid instead of masonry; each stamp's image still
/// aspect-fits within its case rather than being cropped, just centered/letterboxed if needed.
struct GalleryView: View {
    @Environment(StampRepository.self) private var repository
    @State private var selectedStamp: Stamp?
    @State private var selectedType: String?

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    private var types: [String] {
        Array(Set(repository.stamps.map(\.type).filter { !$0.isEmpty })).sorted()
    }

    private var filteredStamps: [Stamp] {
        guard let selectedType else { return repository.stamps }
        return repository.stamps.filter { $0.type == selectedType }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                typeFilterChips

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(filteredStamps) { stamp in
                        Button {
                            selectedStamp = stamp
                        } label: {
                            StampCard(stamp: stamp)
                                .frame(height: 130)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)

                Text("\(filteredStamps.count) stamps")
                    .font(StampFont.footnote())
                    .foregroundStyle(StampColor.inkTertiary)
                    .padding(.bottom, 12)
            }
            .padding(.top, 12)
        }
        .stampPageBackground()
        .sheet(item: $selectedStamp) { stamp in
            StampDetailView(stamp: stamp)
        }
        .navigationTitle("Gallery")
    }

    private var typeFilterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(label: "All", isActive: selectedType == nil) {
                    withAnimation(StampMotion.fast) { selectedType = nil }
                }
                ForEach(types, id: \.self) { type in
                    chip(label: type, isActive: selectedType == type) {
                        withAnimation(StampMotion.fast) {
                            selectedType = selectedType == type ? nil : type
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private func chip(label: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Text(label)
            .font(StampFont.footnote())
            .foregroundStyle(isActive ? .white : StampColor.inkSecondary)
            .padding(.horizontal, 14)
            .padding(.vertical, 7)
            .background(isActive ? StampColor.accentPrimary : StampColor.bgCard, in: Capsule())
            .overlay(Capsule().strokeBorder(isActive ? .clear : StampColor.accentStructural, lineWidth: 1))
            .contentShape(Capsule())
            .onTapGesture(perform: action)
    }
}
