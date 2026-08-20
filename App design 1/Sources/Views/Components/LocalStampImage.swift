import SwiftUI

/// Loads a bundled local stamp image off the main thread. These are local files, not network
/// resources, but full-res JPEGs are still too slow to decode synchronously in a scrolling grid.
struct LocalStampImage: View {
    let url: URL?
    var contentMode: ContentMode = .fit

    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else if url != nil {
                Rectangle().fill(StampColor.bgCard)
            } else {
                MissingImagePlaceholder()
            }
        }
        .task(id: url) {
            image = nil
            guard let url else { return }
            image = await Task.detached(priority: .userInitiated) {
                UIImage(contentsOfFile: url.path)
            }.value
        }
    }
}
