import CoreMotion
import Observation

/// Drives the subtle device-tilt parallax on `DisplayCase`. One shared instance for the whole app
/// (injected via `.environment` at the root) rather than one `CMMotionManager` per card — a Gallery
/// grid can have dozens of `DisplayCase`s on screen at once, and they all read the same tilt.
///
/// `@MainActor` because the motion handler must publish onto the main thread for SwiftUI observation
/// to pick it up safely — same pattern this app already uses for `CollectionsStore` after a prior
/// Swift 6 strict-concurrency crash from an unisolated closure capturing `self`.
@MainActor
@Observable
final class TiltMotionManager {
    private let motionManager = CMMotionManager()
    private var baselineRoll: Double?
    private var baselinePitch: Double?

    /// Relative to however the phone happened to be held when tracking started, not absolute
    /// world-frame attitude — using the raw absolute value would mean a phone already held at a
    /// natural resting angle starts near the effect's clamp range, leaving little room for further
    /// motion to actually register.
    private(set) var roll: Double = 0
    private(set) var pitch: Double = 0

    /// This is a singleton that lives for the app's whole lifetime (created once, injected via
    /// `.environment` at the root) - it never actually deallocates before process exit, so there's
    /// no meaningful `deinit` cleanup to write; `stopDeviceMotionUpdates` would only matter for a
    /// short-lived instance.
    init() {
        guard motionManager.isDeviceMotionAvailable else { return }
        motionManager.deviceMotionUpdateInterval = 1.0 / 30.0
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let motion, let self else { return }
            if baselineRoll == nil {
                baselineRoll = motion.attitude.roll
                baselinePitch = motion.attitude.pitch
            }
            roll = motion.attitude.roll - (baselineRoll ?? 0)
            pitch = motion.attitude.pitch - (baselinePitch ?? 0)
        }
    }
}
