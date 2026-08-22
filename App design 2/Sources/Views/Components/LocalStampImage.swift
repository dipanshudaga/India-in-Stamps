import SwiftUI

/// Shared decoded-image cache so revisiting a stamp (scrolling back, swiping back and forth) shows
/// it instantly instead of re-reading and re-decoding from disk every time. Also the target for
/// prefetching neighbors ahead of a swipe (see `TimelineView`), which is what actually eliminates
/// the blank-placeholder flash — the cache alone only helps on *revisit*, prefetch is what makes a
/// *forward* swipe smooth the first time through.
/// `NSCache` is documented as thread-safe for concurrent access from multiple threads, so this
/// type genuinely has no unsynchronized mutable state for Swift 6 strict concurrency to worry
/// about — `@unchecked Sendable` states that guarantee explicitly rather than fighting the checker.
final class ImageCache: @unchecked Sendable {
    static let shared = ImageCache()
    private let cache = NSCache<NSURL, UIImage>()

    func image(for url: URL) -> UIImage? {
        cache.object(forKey: url as NSURL)
    }

    @discardableResult
    func load(_ url: URL) async -> UIImage? {
        if let cached = image(for: url) { return cached }
        let loaded = await Task.detached(priority: .userInitiated) {
            UIImage(contentsOfFile: url.path)
        }.value
        if let loaded {
            cache.setObject(loaded, forKey: url as NSURL)
        }
        return loaded
    }
}

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
            guard let url else {
                image = nil
                return
            }
            // Already-cached (e.g. prefetched ahead of a swipe) shows synchronously - no flash.
            if let cached = ImageCache.shared.image(for: url) {
                image = cached
                return
            }
            image = nil
            image = await ImageCache.shared.load(url)
        }
    }
}
