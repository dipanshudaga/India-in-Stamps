import SwiftUI

@main
struct IndiaInStampsApp: App {
    @State private var repository = StampRepository()
    @State private var tiltMotionManager = TiltMotionManager()
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootTabView()
                    .environment(repository)
                    .environment(tiltMotionManager)

                if !hasCompletedOnboarding {
                    OnboardingView {
                        withAnimation(StampMotion.base) { hasCompletedOnboarding = true }
                    }
                    .environment(repository)
                    .transition(.opacity)
                }
            }
            // design.md §2.2 — forces a single light appearance, permanently, by design.
            .preferredColorScheme(.light)
            .task {
                repository.loadIfNeeded()
            }
        }
    }
}
