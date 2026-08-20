# India in Stamps — Design System & UI Specification

Build brief for a native SwiftUI app, targeting iOS 26+. This document is the single source of truth for color, type, materials, motion, layout, and every screen. Sections 2–6 are the load-bearing tokens — everything downstream references them, so keep them consistent if anything changes.

---

## 1. Product thesis

**What it is:** an offline-first, native catalog of every Indian postage stamp issued since 1947 — 3,000+ records, each with a historical description and semantic tags, browsed chronologically or by theme.

**Emotional register:** the *structure* of the app is a quiet, minimal museum archive — restrained chrome, one accent color, generous whitespace, editorial typography. The *feel* of using it is playful and tactile — that personality lives entirely in motion and a handful of custom illustrated touches, never in color or layout density. Think: the hush of a philatelic reading room, but the drawers glide open with real delight.

**Signature move — "the tear":** every stamp card carries a perforated edge, because these are literally perforated objects. Saving a stamp to a collection isn't a heart icon filling in — it's the card detaching along its own perforation and arcing into the collection, like tearing a stamp off a sheet. One bold, on-brief motion moment; everything else stays disciplined. Full choreography in §6.4.

**Explicitly ruled out:** saffron, Ashoka-chakra blue, or any direct tricolor referencing — the palette draws from stamp ink and archive paper instead (§2).

---

## 2. Color system — "Museum sepia"

Two neutrals (background, glass), one ink scale, one sparing accent. Stamps supply every other color in the app — nothing else is allowed to compete with them.

### 2.1 Color tokens

| Token | Hex | Usage |
|---|---|---|
| `bg.page` | `#EDE7DA` | Screen background |
| `bg.glassTint` | `#E3DCCB` | Tint applied to Liquid Glass surfaces (not a flat fill — see §4) |
| `bg.card` | `#F6F2E9` | Opaque card surface (used only where glass is disabled, e.g. Reduce Transparency) |
| `ink.primary` | `#26221D` | Primary text, icons |
| `ink.secondary` | `#6B6455` | Secondary text, inactive icons, metadata labels |
| `ink.tertiary` | `#A79E8C` | Placeholder text, disabled states, perforation motif strokes |
| `accent.primary` | `#6E6350` | Selected tab, active filter chip, links, the *only* saturated interactive color |
| `accent.structural` | `#B8AD98` | Dividers, hairlines, inactive chip borders — never used for CTAs |
| `state.success` | `#4C6B4F` | "Saved to collection" confirmation |
| `state.destructive` | `#8A4A3D` | Delete / remove confirmations only |

### 2.2 Rules
- **No dark mode.** The app forces a single light appearance regardless of the system setting — `.preferredColorScheme(.light)` at the root view. It won't follow a user's system-wide dark mode preference; the Reduce Transparency, Increase Contrast, and Reduce Motion fallbacks in §4–6 still apply on top of this single appearance.
- **One accent, everywhere.** `accent.primary` is the only saturated color permitted on interactive elements (active tab, filled button, selected chip, link). `accent.structural` is dividers and inactive borders only — it never marks something tappable.
- Text rendered on top of a glass surface uses the system's vibrancy behavior against `ink.primary`/`ink.secondary`, not a flat fill — vibrancy lets the same token stay legible as the glass content behind it changes.
- No color outside this table appears anywhere in the UI. The stamps themselves are the only permitted burst of saturated color.

---

## 3. Typography

Fully native — no custom or licensed fonts, so the app never looks like it's wearing a costume.

| Style | Font | Size / Weight | Used for |
|---|---|---|---|
| Large Title | New York, Regular | 34pt | Timeline year headers ("1947") |
| Title 1 | New York, Regular | 28pt | Screen titles (Gallery, Collections) |
| Title 2 | SF Pro, Semibold | 22pt | Section headers within a screen |
| Title 3 | SF Pro, Semibold | 20pt | Collection card titles |
| Headline | SF Pro, Semibold | 17pt | List item titles, stamp denomination on Detail |
| Body | SF Pro, Regular | 17pt | Historical descriptions — set at 1.4 line-height for an editorial, readable block |
| Callout | SF Pro, Regular | 16pt | Secondary descriptive text |
| Subheadline | SF Pro, Regular | 15pt | Metadata rows (issue date, series) |
| Footnote | SF Pro, Regular | 13pt | Tags, timestamps |
| Caption 1 / 2 | SF Pro, Regular | 12pt / 11pt | Micro-labels, image-credit lines |

**Rules:**
- New York appears only at Large Title and Title 1 — it marks "this is a chapter," never a button or a label. Everything a person taps or scans quickly is SF Pro.
- All styles use Dynamic Type text styles (not fixed point sizes) so the whole app scales with the user's system text-size setting.
- Sentence case everywhere. No letter-spaced all-caps section labels — that's a template tell, not a museum one.
- Tracking and leading are never hand-set. Apple tunes both per size on its system fonts — large text gets tighter tracking and tighter leading, small text gets slightly looser tracking and looser leading — and every style above already gets that for free by being a system text style on New York or SF Pro. Body's 1.4 line-height is the one deliberate override in this table, added on top of the system default because a long historical description reads better looser than the system's default body leading; nothing else in §3 should ever carry a manual letter-spacing or line-height value.

---

## 4. Liquid Glass material system

This app should read as a first-party Apple app, so this section follows the platform's actual material system (`Glass`, `.glassEffect()`, `GlassEffectContainer` — the real iOS 26 SwiftUI API) rather than approximating "frosted glass" as a static blur. Everything below assumes iOS 26.0+ / Xcode 26.

### 4.1 What it is, and the three material types
Liquid Glass is a translucent, dynamic material that reflects and refracts whatever is behind it while dynamically transforming to keep focus on content — not a fixed blur-and-tint filter, but a live optical effect (Apple calls the light-bending behavior "lensing"). SwiftUI exposes three variants:

| Variant | Transparency | Adapts to background | Use for |
|---|---|---|---|
| `.regular` | Medium | Fully | The default. Tab bar, toolbars, nav bars, the search field, filter chips — anywhere legible content sits directly on the material |
| `.clear` | High | Limited — needs help | Small floating controls over media-rich, bold content that should read strongly through the glass |
| `.identity` | None | — | Conditionally *disabling* glass in code (e.g. driven by an accessibility flag) without a layout change |

**Clear is conditional, not a style choice.** Apple's own guidance gates it behind three requirements that must *all* hold: the element sits over media-rich content, that content won't suffer from an added dimming layer if legibility needs it, and the content above/around the glass is bold and bright. In this app, that's specifically the Detail screen's floating toolbar (back / save / share) sitting over a stamp's hero image — everything else (tab bar, Gallery/Search toolbars, sheets) uses `.regular`.

### 4.2 Composition: containers, not stacking
**Glass cannot optically sample another glass surface.** Any time more than one glass element sits near each other — the save button and share button in Detail's floating toolbar, for instance — they must share a `GlassEffectContainer`, which gives them a shared sampling region and also lets them morph into and out of each other during state changes. Applying `.glassEffect()` to several neighboring views with no shared container is the single most common Liquid Glass mistake: it's inefficient to render and the light-bending reads as a smear rather than two distinct panes.

This app's three-tier hierarchy, in order:
1. **Content** (bottom) — the stamp grid, timeline, description text. Never glass.
2. **Navigation** (middle) — tab bar, toolbars, the floating Detail controls. Always glass, always grouped in a container when more than one element is present.
3. **Overlay** (top) — text and icons rendered *on* glass, which get the system's automatic vibrancy treatment rather than a flat color fill.

The system already handles legitimate glass-over-glass depth for you — a sheet presenting over a glass toolbar is standard and automatic, not something to avoid. What to avoid is custom, *uncoordinated* glass: never hand-place two overlapping `.glassEffect()` views outside a shared container.

### 4.3 Concentricity
Every rounded corner nests inside its parent around a shared center point — a button inside a card inside a sheet should look like it was cut from the same continuous curve, not three unrelated radii stacked together. SwiftUI has a dedicated value for this rather than a hand-picked radius: `.rect(cornerRadius: .containerConcentric)`, which automatically matches whatever container it's nested in.

| Element | Radius |
|---|---|
| Sheet / modal edge | System default (continuous corner) — never override |
| Card | 20pt |
| Control (button, search field) | 14pt |
| Chip / tag | Full pill |

Where a shape is nested inside another glass container (e.g. a chip inside the Search sheet), prefer `.containerConcentric` over a hard-coded radius so it self-corrects if the parent's radius ever changes.

### 4.4 Tint & interactivity
`.tint()` on a glass surface should communicate *meaning* — a primary/selected state — never decoration; tinting every control flattens the hierarchy this material exists to create. In this app, `accent.primary` is the only tint that ever touches glass (the active tab icon, the selected filter chip, the primary confirm action in a sheet).

`.interactive()` is what makes a glass control feel alive under touch: a slight scale on press, a bounce on release, a shimmer, and touch-point illumination that radiates outward to *nearby* glass in the same container. Apply it to every tappable glass element — save button, filter chips, the collection-picker's options — it's the primary place the brief's "playful" energy shows up in the chrome itself, distinct from the signature tear (§6.4).

### 4.5 Materialization & morphing
Glass elements shouldn't simply fade or slide when they appear or change state — they should feel like they *condense*. Two real mechanisms cover this app's cases:
- **`glassEffectTransition(.materialize)`** — used wherever a glass control appears from nothing: the Search sheet rising, the Collections "new collection" popover, the filter panel.
- **`glassEffectID` + a shared `Namespace`, inside a `GlassEffectContainer`** — used when one glass shape morphs into a related one rather than crossfading, e.g. a compact filter toggle expanding into the full filter-chip row on Search.

For the Gallery/Timeline → Detail transition specifically (§6.2), the real mechanism is `matchedTransitionSource` on the tapped thumbnail paired with `.navigationTransition(.zoom(sourceID:in:))` on the destination — this is what produces the hero-image handoff, with the floating Clear-glass toolbar materializing in a beat after. (This zoom-transition pairing itself shipped in iOS 18, not 26 — it's not a Liquid Glass API, just the mechanism this app uses alongside Liquid Glass for that one transition.) The signature "tear" interaction (§6.4) is deliberately *not* built on glass morphing — it's a custom `matchedGeometryEffect` + path-based mask animation, because it's choreographing a card, not a control changing state.

### 4.6 Where glass appears in this app

| Surface | Variant | Notes |
|---|---|---|
| Tab bar | Regular | `.tabBarMinimizeBehavior(.onScrollDown)` on Timeline and Gallery — the bar collapses while scrolling a long list and reappears on scroll-up or scroll-to-top |
| **Search tab** | Regular | iOS 26 gives a tab marked `role: .search` distinct treatment: it renders as its own floating affordance at bottom-right rather than sitting inline with the other three tab icons, for one-handed reach. Design around this rather than treating Search as a plain fourth icon (see §8, §9.4) |
| Gallery/Search toolbar + year/filter chips | Regular | Grouped via `ToolbarItemGroup`, with a `ToolbarSpacer` separating the filter chips from the primary action |
| Detail's floating controls | Clear | Passes the three-part test in §4.1; the stamp image is the "bold, bright content" underneath |
| Search sheet, filter panel, collection picker, About sheet | Regular (automatic) | Sheets get an inset Liquid Glass background by default in iOS 26 — don't hand-roll a custom `presentationBackground`. All four honor the system's swipe-to-dismiss; none of this app's sheet flows involve unsaved or destructive state, so none need a confirmation guard on dismiss |

### 4.7 Accessibility
Liquid Glass adapts to these automatically at the system level — the rule for this app is to *never override* that adaptation in custom code:
- **Reduce Transparency on** — every glass surface substitutes higher opacity for clarity; in this app's tokens, that's the `bg.card` opaque equivalent from §2. No layout regression, just flat.
- **Increase Contrast on** — glass surfaces gain a defined edge; this app adds a 1pt `accent.structural` hairline border they don't otherwise have.
- **Reduce Motion on** — lensing and elastic effects are toned down system-wide; see §6.5 for how the tear specifically degrades.
- **Tinted mode (iOS 26.1+)** — a user-controlled toggle (Settings → Display & Brightness → Liquid Glass) that increases glass opacity globally. Respect it the same way: don't fight it with a hard-coded opacity anywhere.

### 4.8 Performance & anti-patterns
- Always wrap multiple glass elements in a single `GlassEffectContainer` (§4.2) — beyond the visual smearing, ungrouped glass is meaningfully more expensive to render.
- Avoid continuous animation on any glass surface (e.g. a looping rotation) — let glass rest in a steady state between interactions.
- Community beta testing reported real battery impact from heavy glass usage — double-digit percentage drain versus roughly 1% for equivalent non-glass UI in one iPhone 16 Pro Max test. Treat that as a signal to profile with Instruments on real hardware, not a fixed number, since it's beta-era data — but budget real QA time for it rather than assuming glass is free.
- Test on iPhone 11–13 class hardware specifically; devices below the iOS 26 cutoff (iPhone 11 / SE 2nd gen and later) automatically receive a reduced frosted-glass fallback rather than full Liquid Glass, which you don't need to build yourself but should still see once during QA.
- Anti-patterns to catch in review: glass applied to the content layer itself (a card in the Gallery grid, say), a tint used decoratively rather than to mark selection/primary state, and any hard-coded color scheme that fights the material's automatic light/dark adaptation.

---

## 5. Iconography & the perforation motif

Both illustrated-charm directions, used deliberately rather than everywhere.

### 5.1 Perforation motif
A repeating small-circle cutout pattern, rendered in `ink.tertiary`, used as a **structural** divider — never purely decorative:
- Along the bottom edge of each Timeline year section, separating one year from the next.
- Along the top edge of the Detail sheet, where it presents over the previous screen.
- As the "tear line" in the save-to-collection animation (§6.4) — this is the one place it's animated rather than static.

It does **not** appear on every card border or button — that would flatten it from a motif into wallpaper.

### 5.2 Custom icon set
SF Symbols handle every standard action (back, share, settings, chevrons). A small custom set, drawn on the same 24×24 keyline grid at 1.5pt monoline stroke so it sits flush with SF Symbols in a toolbar, covers what Symbols can't express:
- **Collections tab icon** — a small stamp album/binder shape.
- **Search/filter entry point** — a postmark-style circular stamp cancellation mark.
- **Empty-collection state** — a single unfilled stamp outline with a dashed perforation edge.

Colored via `ink.primary` / `accent.primary` tokens only — never a hardcoded fill, so they stay consistent with the rest of the UI.

---

## 6. Motion & transitions

Motion carries the "playful collectible" half of the brief. It should feel physical — springs, not easing curves.

### 6.1 Duration & spring tokens

Every token below is a `.spring(response:dampingFraction:)` value, not a fixed-duration animation layered on top of a spring — a spring has no independent duration; its settle time emerges from `response` and `dampingFraction` together, so the ms figure is an approximate settle time, not a separate timer. Damping stays at `1.0` (critically damped, no overshoot) everywhere except the tear: Apple's own default is to reserve bounce for interactions where the *gesture itself* carried momentum (a flick, a throw, a drag release) — a tap-driven selection or toggle overshooting reads as noise, not delight. That's also this app's own stated rule (§6.4): everything but the tear stays disciplined.

| Token | Value | Used for |
|---|---|---|
| `motion.instant` | ~100ms, critically damped spring (response 0.25, damping 1.0) | Toggle/tap feedback, tab bar selection |
| `motion.fast` | ~200ms, critically damped spring (response 0.4, damping 1.0) | List item selection, chip toggling |
| `motion.base` | ~350ms, critically damped spring (response 0.35, damping 1.0) | Screen/tab transitions |
| `motion.slow` | ~500ms, critically damped spring (response 0.5, damping 1.0) | Gallery → Detail hero transition |
| `motion.signature` | ~650ms, bouncy spring (response 0.5, damping 0.65) | The tear (§6.4) only — reserve the bounciest spring for the one moment it should read as delight, and the only interaction in the app carrying real gestural momentum |

Every animation built from these tokens should avoid blocking input elsewhere in the UI while it plays — a scroll or a tap on another card during the tear's 650ms flight (§6.4) shouldn't have to wait for it to finish. `motion.base`/`motion.slow` transitions should likewise retarget cleanly from their current on-screen position if interrupted mid-flight by a fast back-navigation or another tap, rather than restarting from the beginning.

### 6.2 Gallery / Timeline → Detail
Shared-element transition: the tapped thumbnail scales and repositions into the Detail screen's hero image position while the glass toolbar materializes in above it (`motion.slow`). The rest of Detail's content (metadata, description) fades up 80ms after the hero image settles, not simultaneously — sequence, don't simultaneity. The custom `matchedTransitionSource`/`.navigationTransition(.zoom(sourceID:in:))` pairing must not come at the cost of the standard left-edge swipe-back gesture on Detail — it stays live and undisturbed, the same as everywhere else in the app.

### 6.3 Timeline scroll reveal
As a year section enters the viewport, its stamp row fades and rises in with a 40ms stagger per item, capped at the first 3 items — reward the first glance, don't animate the whole scrollback every time.

### 6.4 The tear (signature interaction)
Triggered by the save-to-collection action on any stamp card or the Detail screen:
1. `0–100ms` — the card's perforation edge brightens from `ink.tertiary` to `ink.primary`.
2. `100–350ms` — a tear path reveals along the perforation with a slight rotation (2–4°), as if lifting off a sheet.
3. `350–650ms` — the card arcs toward the destination collection icon with the bouncy spring, shrinking as it travels.
4. On arrival — the collection tab icon does a single 120ms scale-bump (1.0 → 1.15 → 1.0) and a success haptic fires.

### 6.5 Reduce Motion fallback
Reduce Motion doesn't mean no feedback — every spring-and-arc interaction becomes a gentler, non-vestibular equivalent rather than disappearing: a plain opacity crossfade at `motion.fast`. The tear becomes: perforation brightens, then the card simply fades out with a success haptic and a small `state.success`-colored checkmark. No parallax, no scale, no rotation anywhere in the app — but the color and haptic confirmation stay, since Reduce Motion strips motion, not comprehension.

---

## 7. Layout, grid & spacing

- **Base unit:** 4pt grid — spacing scale is 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.
- **Screen margin:** 20pt standard.
- **Gallery grid:** masonry, not a rigid uniform grid — stamps come in genuinely different shapes (portrait, square, the occasional diamond-cut commemorative), and forcing a uniform crop would sand off exactly the detail a philatelic catalog should preserve. 3 columns at standard iPhone widths, 12pt gutter.
- **Timeline:** single column, vertical stack of year sections; each section header pins (sticky) while a horizontally-scrolling row of that year's stamps sits beneath it — the same pattern as Apple Music's "browse by year." A thin year-navigator rail sits at the trailing screen edge for fast scrubbing, echoing the alphabet index in Contacts/Photos — like that system pattern, it tracks the touch position 1:1 as the finger moves rather than only registering discrete taps on each year label, and rubber-bands slightly past the first and last year instead of stopping hard at the ends.

```
TIMELINE                    GALLERY                     DETAIL
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ ░░ glass toolbar ░░  │     │ ░░ glass toolbar ░░  │ ← ▨│ ░░ glass toolbar ░░ │⋯▨
├─────────────────────┤ 1955│├──year chips (glass)──┤    ├─────────────────────┤
│ 1947            ⋮   │     │ ┌────┐┌───┐┌──────┐  │    │                     │
│ [▨][▨][▨][▨]···    │ 1961│ │ ▨  ││ ▨ ││  ▨   │  │    │      ▨▨▨▨▨▨▨       │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │     │ └────┘└───┘└──────┘  │    │      (hero image    │
│ 1948            ⋮   │ 1972│ ┌───┐┌──────┐┌────┐  │    │       on glass mat) │
│ [▨][▨][▨]···        │     │ │ ▨ ││  ▨   ││ ▨  │  │    │                     │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │     │ └───┘└──────┘└────┘  │    ├─────────────────────┤
│ 1949            ⋮   │ 1990│                       │    │ Denomination · Date │
│ [▨][▨][▨][▨]···    │     │                       │    │ [tag][tag][tag]     │
└─────────────────────┘     └─────────────────────┘     │ Body description…   │
                                                          └─────────────────────┘
```

---

## 8. Information architecture

Bottom tab bar (glass, Regular weight), 4 tabs:

1. **Timeline** — chronological browse, year by year.
2. **Gallery** — dense visual grid of the whole catalog, filterable inline.
3. **Search** — text search plus faceted filters (tag, personality, historical event, year range) — first-class now rather than the PRD's "future" placeholder, since the enriched dataset already supports it. Marked `role: .search`, so iOS 26 renders it as its own floating affordance at bottom-right rather than a fourth inline tab icon (§4.6) — design the tab bar as three icons plus this separate search capsule, not four equal icons.
4. **Collections** — the user's saved sets.

---

## 9. Screen specifications

### 9.1 Timeline
See wireframe (§7). Sticky year headers in New York Large Title, perforation divider beneath each section (§5.1), horizontal stamp row per year, year-navigator rail.

### 9.2 Gallery
Glass toolbar with a horizontally-scrolling row of year filter chips beneath it. Masonry grid, tap → hero transition to Detail (§6.2).

### 9.3 Detail
As scoped: hero image (native aspect ratio, presented on an `bg.glassTint`-colored mat, echoing a museum specimen mount) → denomination + issue date (Headline / Subheadline) → semantic tag chips → historical description in Body copy at 1.4 line-height. Floating clear-glass toolbar: back chevron, save-to-collection (triggers §6.4), share.

**Missing-image placeholder:** for the 21 stamps the audit flagged as missing their source image, Detail (and the Gallery/Timeline thumbnail) shows a die-cut silhouette card with the perforation motif and a small caption in `ink.secondary` — phrased as archival, not broken: "Image not yet digitized" rather than an error state. This is a real, known gap in the dataset, and the UI should treat it the way a museum treats an item on loan, not the way an app treats a 404.

### 9.4 Search
Tapping the floating search affordance (§8, §4.6) opens the search field pinned under a Regular-glass toolbar. Empty state shows recent searches. Filled state shows filter chips (Tag / Personality / Event / Year range — inactive chips use `accent.structural` border, active chips fill with `accent.primary`) above a live-updating masonry grid identical to Gallery's.

### 9.5 Collections
*(Not specified in the PRD — I've defined this as: user-curated saved sets of stamps, with a system "Favorites" collection created by default and unlimited user-named collections beyond it. Flag if you intended something else — a smart/auto-generated grouping, for instance.)*

Grid of collection cards — each a stacked-photo cover of up to 3 stamps, name, and count (Title 3). Tapping opens a Gallery-style masonry grid scoped to that collection. A glass "+ New collection" control sits in the toolbar.

**Empty state:** the custom empty-collection icon (§5.2) with an inviting headline ("Start a collection") rather than an apology ("Nothing here yet").

### 9.6 Settings / About
Reached via a profile icon in the Collections toolbar, not its own tab (keeps the tab bar at 4, not 5). Standard controls (appearance override, haptics toggle) plus an "About this catalog" section that credits the audit work — dataset scope, the Wikipedia cross-reference process, and an honest note on the known gaps. This is a small but deliberate choice: showing the rigor behind the catalog fits the museum-archive register better than hiding it in a changelog.

---

## 10. App icon

*(Proposed — not confirmed with you yet.)* A single stamp shape with a genuine perforated edge, rendered in `ink.primary` on the `bg.page` cream, with a simple engraved center mark (a compass rose or map-pin silhouette reads as "India, geographically" without touching flag iconography). Built in Icon Composer so it picks up light/dark/tinted variants and the system's tilt parallax for free.

---

## 11. Accessibility

- Full Dynamic Type support — every text style in §3 is a system text style, not a fixed point size.
- Reduce Transparency, Increase Contrast, Reduce Motion, and iOS 26.1's Tinted mode toggle all handled explicitly (§4.7, §6.5) — not just "should degrade gracefully" but the specific fallback stated per case above.
- Every custom icon (§5.2) ships a VoiceOver label describing its function, not its shape ("Search stamps," not "Postmark icon").
- Color is never the only signal — the tear animation pairs with a haptic and (in Reduce Motion) a checkmark; filter chip active-state pairs a fill change with a checkmark glyph, not color alone.
- Every tappable control — the custom icon set (§5.2), filter chips, the year-navigator rail (§7) — meets Apple's 44×44pt minimum hit target, with breathing room between adjacent targets. A 24×24pt icon glyph (§5.2) sits inside a larger tappable area; the glyph size and the hit-target size are never the same number.

---

## 12. Content voice

- Sentence case everywhere, active voice, no exclamation points on system copy.
- Empty states are an invitation, never an apology: "Start a collection," not "You haven't added anything yet."
- The missing-image placeholder and any data gap is stated plainly and archivally — this app is allowed to be honest about the scope of a 3,000-record hand-audited dataset. That honesty is part of the museum-archive credibility, not a flaw to hide.

---

## 13. Assumptions flagged for review

Everything above is either directly from your answers or the PRD, except:
1. **Collections** — defined as user-curated saved sets with a default Favorites collection (§9.5). The PRD doesn't mention this feature at all; the tab bar choice implied it.
2. **App icon direction** (§10) — a proposal, not something you've weighed in on.
3. **Settings/About screen** (§9.6) — added to house the data-audit credit; wasn't asked about directly.
4. **Missing-image placeholder treatment** (§9.3) — my interpretation of how to handle the 21 documented gaps gracefully.
5. **No dark mode, and hex tokens instead of semantic system colors** (§2) — **confirmed 2026-08-20: staying light-only, permanently.** A locally installed native-iOS reference flagged this as a deviation from default HIG conformance (Dark Mode is normally expected on every native app), but this is a deliberate, confirmed brand decision, not an oversight — closed, not to be revisited without a new explicit request.
6. **iPhone-only scope, no iPad/adaptivity spec** — **confirmed 2026-08-20: iPhone-only for v1.** No size-class, split-view, or orientation work is in scope; §7's masonry grid is specified "at standard iPhone widths" on purpose.

Items 1–4 above are likewise **confirmed 2026-08-20** as written — Collections (§9.5), the app icon direction (§10), the Settings/About screen (§9.6), and the missing-image placeholder treatment (§9.3) are all locked, not open questions.

§4's SwiftUI/Liquid Glass API claims were checked against Apple's current developer documentation on 2026-08-20 (no installed skill covers this API surface, so this was direct research, not skill-sourced) — `.glassEffect()`, `GlassEffectContainer`, `Glass.regular`/`.clear`/`.identity`, `glassEffectID`, `glassEffectTransition(.materialize)`, `.containerConcentric`, `tabBarMinimizeBehavior(.onScrollDown)`, `Tab(role: .search)`, `ToolbarSpacer`, and the iOS 26.1 Tinted-mode toggle path (Settings → Display & Brightness → Liquid Glass) all confirmed accurate as written. The one precision note landed inline at §4.5: the zoom-transition pairing used for the hero handoff shipped in iOS 18, not 26.

This document is confirmed-complete as of 2026-08-20 — every open item above is resolved.
