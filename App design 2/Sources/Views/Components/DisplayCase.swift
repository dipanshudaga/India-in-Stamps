import SwiftUI

/// The core visual device of this design direction: a stamp presented inside a real museum glass
/// display case. `CaseBackLayer` and `CaseFrameLayer` are Cycles-rendered (Blender) PNGs — an
/// actual boolean-cut shadow-box body with a beveled glass-ring bevel and stainless corner rivets,
/// not a flat SwiftUI approximation. The stamp is sandwiched between them: back layer (recessed
/// cream cavity) → stamp, fit within the case's real recess opening → front layer (frame + rivets)
/// → `CaseGlassHighlights`, the actual glass material's rendered light contribution (rendered
/// against a black world so only its own reflections/specular hits are non-black), composited with
/// additive/screen blending. Cycles can't produce a physically-correct alpha channel for a
/// transmissive surface rendered alone — it marks the whole glass opaque even where it's mostly
/// see-through — so a true glass render can't simply overlay a dynamic stamp via normal alpha
/// compositing. Screen-blending the highlights-only pass sidesteps that: black contributes nothing,
/// and the real Cycles-computed reflections/bevel glints add on top, which is what actually reads
/// as glass instead of a flat gradient standing in for it. Every case renders at the same square size regardless
/// of the stamp's own aspect ratio (which spans roughly 0.5–2.5 across the real dataset, individual
/// stamps to souvenir sheets) — the stamp always letterboxes inside the fixed recess, it never
/// resizes the case, and it is hard-clipped to the recess so a wide/tall outlier can never spill
/// past the frame.
struct DisplayCase<Content: View>: View {
    @Environment(TiltMotionManager.self) private var tilt
    var content: Content

    /// Temporarily off: the Blender-rendered case (frame/backing/glass) isn't at the quality bar
    /// yet, so the case chrome is hidden and stamps show plainly while that work continues
    /// separately. Flip back to `true` once the case render is approved — nothing else about this
    /// view or its call sites needs to change.
    private let showsCase = false

    /// The rendered case's recess opening as a fraction of the full case width/height. This is
    /// *measured directly from the cropped PNG's alpha channel* (hole span ÷ canvas span at the
    /// image's center row/column: 713px ÷ 780px), not computed from the Blender scene's own
    /// 0.94 hole/case ratio — that theoretical value was wrong in practice (camera framing meant
    /// the case didn't fill the canvas the way the scene geometry alone implied) and produced a
    /// stamp visibly larger than the frame's actual opening. If the assets are ever re-rendered,
    /// re-measure this from the new PNG rather than recomputing it from Blender geometry.
    private let recessFraction: CGFloat = 0.9141

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        if showsCase {
            caseBody
        } else {
            plainBody
        }
    }

    /// Stamp shown plainly, no case chrome and no background card — just the stamp itself with a
    /// shadow that follows its *actual* silhouette (the perforated edge, since `.shadow()` reads
    /// the content's own alpha channel rather than a bounding rectangle) so it reads as a real
    /// object floating over the page, not a photo in a frame. A small device-tilt parallax
    /// (`rotation3DEffect` driven by `TiltMotionManager`) reinforces that — the same "it's a
    /// physical thing sitting slightly above the surface" cue iOS uses for its own home screen icons.
    private var plainBody: some View {
        content
            .aspectRatio(contentMode: .fit)
            .shadow(color: .black.opacity(0.22), radius: 10, x: 0, y: 7)
            .shadow(color: .black.opacity(0.12), radius: 2, x: 0, y: 1)
            .rotation3DEffect(
                .radians(clampedTilt(tilt.pitch) * -1.1),
                axis: (x: 1, y: 0, z: 0),
                perspective: 0.35
            )
            .rotation3DEffect(
                .radians(clampedTilt(tilt.roll) * 1.1),
                axis: (x: 0, y: 1, z: 0),
                perspective: 0.35
            )
    }

    private func clampedTilt(_ radians: Double) -> Double {
        min(max(radians, -0.3), 0.3)
    }

    private var caseBody: some View {
        GeometryReader { geometry in
            let size = min(geometry.size.width, geometry.size.height)
            let recessSize = size * recessFraction

            ZStack {
                Image("CaseBackLayer")
                    .resizable()
                    .frame(width: size, height: size)

                content
                    .frame(width: recessSize, height: recessSize)
                    .contentShape(Rectangle())
                    .clipShape(Rectangle())
                    .frame(width: recessSize, height: recessSize)

                Image("CaseFrameLayer")
                    .resizable()
                    .frame(width: size, height: size)
            }
            // Flatten back+stamp+frame into one rendered layer *before* the highlights blend mode
            // is evaluated - without this, `.blendMode(.screen)` below has nothing in its own
            // compositing group to blend against and just paints its source image as-is (this is
            // exactly what produced the opaque black rectangle over everything).
            .compositingGroup()
            .overlay(
                Image("CaseGlassHighlights")
                    .resizable()
                    .frame(width: size, height: size)
                    .blendMode(.screen)
                    .allowsHitTesting(false)
            )
            .frame(width: size, height: size)
            .clipShape(Rectangle())
            .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
            .shadow(color: .black.opacity(0.22), radius: 20, x: 0, y: 14)
            .shadow(color: .black.opacity(0.12), radius: 5, x: 0, y: 3)
        }
        .aspectRatio(1, contentMode: .fit)
    }
}
