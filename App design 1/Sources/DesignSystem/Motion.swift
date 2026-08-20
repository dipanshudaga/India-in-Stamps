import SwiftUI

/// design.md §6.1. Damping stays at 1.0 (critically damped, no overshoot) everywhere except
/// the tear — bounce is reserved for the one interaction that carries real gestural momentum.
enum StampMotion {
    static let instant = Animation.spring(response: 0.25, dampingFraction: 1.0)
    static let fast = Animation.spring(response: 0.4, dampingFraction: 1.0)
    static let base = Animation.spring(response: 0.35, dampingFraction: 1.0)
    static let slow = Animation.spring(response: 0.5, dampingFraction: 1.0)

    /// The tear (§6.4) only.
    static let signature = Animation.spring(response: 0.5, dampingFraction: 0.65)

    /// §6.5 Reduce Motion fallback — every spring-and-arc interaction collapses to this.
    static let reduceMotionFallback = Animation.easeInOut(duration: 0.2)
}
