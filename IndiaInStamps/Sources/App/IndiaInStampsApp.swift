import SwiftUI

@main
struct IndiaInStampsApp: App {
    @State private var repository = StampRepository()
    @State private var collectionsStore = CollectionsStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(repository)
                .environment(collectionsStore)
                // design.md §2.2 — forces a single light appearance, permanently, by design.
                .preferredColorScheme(.light)
                .task {
                    repository.loadIfNeeded()
                }
        }
    }
}
