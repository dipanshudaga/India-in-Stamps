import SwiftUI

@main
struct IndiaInStampsApp: App {
    @State private var repository = StampRepository()
    @State private var collectionsStore = CollectionsStore()
    @State private var tiltMotionManager = TiltMotionManager()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(repository)
                .environment(collectionsStore)
                .environment(tiltMotionManager)
                // design.md §2.2 — forces a single light appearance, permanently, by design.
                .preferredColorScheme(.light)
                .task {
                    repository.loadIfNeeded()
                }
        }
    }
}
