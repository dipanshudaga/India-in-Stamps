# App design 2 — optional asset prompts

None of these are blocking — the app runs fully today with pure SwiftUI approximations (gradients,
shadows, procedurally-drawn icons) standing in for all of them. This is a wishlist of places where
a real generated asset would look more premium than the code-drawn version, in priority order.

For all of these: match `india_in_stamps_modern_museum_ui_direction.md`'s restraint — soft, diffuse,
warm-neutral, no drama. If a generated result looks "designed" or draws attention to itself, it's
too strong for this brief.

---

## 1. App icon

Currently skipped entirely (no icon set, system default placeholder). `design.md` §10 proposed a
single stamp shape with a perforated edge and a compass-rose or map-pin center mark — never
confirmed. If you want to finalize this:

> A minimal app icon for an iOS stamp-collecting app. A single rectangular postage stamp shape,
> centered, with a genuine perforated edge (small semicircular notches around all four sides,
> matching real stamp perforation gauge). Warm ivory/off-white stamp face (#FFFFFF to #FAF8F4),
> rendered on a very light warm-white background (#FAF8F4). A simple engraved center mark — a
> compass rose or a minimal map-pin silhouette — in dark warm ink (#26221D), thin monoline weight.
> No text, no country name, no flag colors, no tricolor. Flat, precise, contemporary museum-catalogue
> aesthetic — not vintage, not ornate, not skeuomorphic. Square canvas, generous padding, works at
> small sizes (should read clearly at 40px).

## 2. Display-case glass sheen

Currently a SwiftUI `LinearGradient` (white, top-left to bottom-trailing, fading to transparent).
A real soft glass-reflection texture could sell the "under glass" feeling more convincingly at the
Detail hero's larger scale specifically (`StampDetailView.heroImage`, `DisplayCase.swift`).

> A subtle, realistic glass reflection overlay as a transparent PNG. A single soft diagonal
> streak of light, white, very low opacity (peak ~15%), heavily feathered/blurred at both edges,
> running from the top-left corner toward the center — like the reflection on a museum vitrine
> under diffuse gallery lighting. No hard edges, no lens-flare artifacts, no rainbow/chromatic
> aberration. Must read as almost invisible at a glance — obvious to guide placement, unnoticeable
> in the final composite. Transparent background.

## 3. Gallery-wall background texture

Currently a two-stop `LinearGradient` (near-white, top to bottom) plus a handful of near-invisible
procedural specks (`PaperTexture.swift`). A genuinely crafted "soft gallery lighting falloff" could
read as more considered than the procedural version, used as the base layer behind every screen.

> An extremely subtle, almost-white background texture for a museum app, evoking a softly lit
> gallery wall. Warm off-white (#FAF8F4) base, with barely perceptible tonal variation — the
> faintest hint of soft overhead lighting falling off toward the edges, like plaster catching
> diffuse light. No visible grain, no paper fibers, no stains, no vignette darkening at the
> corners. The texture should be invisible at a glance and only reward close inspection. Seamless
> or large enough to tile without a visible repeat (at least 1170×2532px, iPhone screen resolution).

## 4. Archival mount surface texture

Currently a flat white fill (`bg.card`, `#FFFFFF`) for the plane a stamp sits on inside its case.
A very faint cotton/archival-paper texture (not the "old paper" look explicitly ruled out in the
brief, closer to acid-free conservation card) could add a hint of material tactility here.

> An extremely subtle, near-white archival mounting board texture — the kind of acid-free cotton
> card used to mount specimens in a contemporary museum. Bright warm white (#FFFFFF to #FBFAF8),
> with the faintest visible fiber texture, no yellowing, no aging, no stains, no vintage
> character. Should read as pristine and contemporary, not antique. Flat lighting, no shadow
> baked in (shadows are added separately in code). Seamless tile, small size is fine (512×512px).

## 5. Empty-state illustrations (optional upgrade)

`Search` and `Collections` empty states currently use code-drawn vector icons
(`Views/Components/CustomIcons.swift` — `PerforatedStampOutline`, `PostmarkIcon`). These already
match the brief reasonably well and aren't blocking; only revisit if you want more character here.

> A minimal line-art icon of [a single unmounted postage stamp with a dashed perforated edge, no
> image inside / a circular postmark cancellation mark with radiating lines], in warm dark ink
> (#A79E8C), thin monoline stroke (1.5pt at 24×24 scale), no fill, no color, no shading. Sits on a
> transparent background. Restrained and precise — a museum catalogue mark, not a cute mascot icon.
