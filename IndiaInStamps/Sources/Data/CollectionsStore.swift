import Foundation
import Observation

struct StampCollection: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var stampIDs: [Int]

    init(id: UUID = UUID(), name: String, stampIDs: [Int] = []) {
        self.id = id
        self.name = name
        self.stampIDs = stampIDs
    }
}

/// design.md §9.5 — user-curated saved sets, with a default "Favorites" collection created up front.
/// Persisted to UserDefaults; this is a personal catalog app, not a synced multi-device one.
@Observable
@MainActor
final class CollectionsStore {
    private(set) var collections: [StampCollection]
    private let favoritesID: UUID
    private let defaultsKey = "com.dipanshudaga.IndiaInStamps.collections"

    /// Flips true briefly right after a save completes, so the Collections tab icon can do its
    /// arrival scale-bump (§6.4 step 4) without needing direct knowledge of what triggered it.
    var justSaved = false

    init() {
        if let data = UserDefaults.standard.data(forKey: "com.dipanshudaga.IndiaInStamps.collections"),
           let decoded = try? JSONDecoder().decode([StampCollection].self, from: data),
           let favorites = decoded.first {
            collections = decoded
            favoritesID = favorites.id
        } else {
            let favorites = StampCollection(name: "Favorites")
            favoritesID = favorites.id
            collections = [favorites]
        }
    }

    func isSaved(_ stamp: Stamp, in collectionID: UUID? = nil) -> Bool {
        let target = collectionID ?? favoritesID
        return collections.first(where: { $0.id == target })?.stampIDs.contains(stamp.id) ?? false
    }

    func save(_ stamp: Stamp, to collectionID: UUID? = nil) {
        let target = collectionID ?? favoritesID
        guard let idx = collections.firstIndex(where: { $0.id == target }),
              !collections[idx].stampIDs.contains(stamp.id) else { return }
        collections[idx].stampIDs.append(stamp.id)
        persist()
        justSaved = true
        Task {
            try? await Task.sleep(for: .milliseconds(400))
            justSaved = false
        }
    }

    func remove(_ stamp: Stamp, from collectionID: UUID) {
        guard let idx = collections.firstIndex(where: { $0.id == collectionID }) else { return }
        collections[idx].stampIDs.removeAll { $0 == stamp.id }
        persist()
    }

    func createCollection(named name: String) {
        collections.append(StampCollection(name: name))
        persist()
    }

    func deleteCollection(_ collectionID: UUID) {
        guard collectionID != favoritesID else { return }
        collections.removeAll { $0.id == collectionID }
        persist()
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(collections) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }
}
