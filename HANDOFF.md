# India in Stamps — session handoff

Paste this whole file into a new chat to continue with full context. Written because the previous
session's context window ran out mid-task.

## What this project is

Native SwiftUI iOS 26+ app cataloging every Indian postage stamp since 1947 (~3,045 records).
Offline-first — bundles the dataset, no network calls. `design.md` and `prd.md` at the repo root
are the original design system spec and product brief (mostly superseded now by live decisions
made in chat — see "Design decisions" below).

**Repo root**: `/Users/dipanshudaga/My Projects/Coding/India in Stamps`
**GitHub**: `https://github.com/dipanshudaga/India-in-Stamps` (public)
**Branches**: `main` (has "App design 1" only, 2 commits) and `design-change` (currently checked
out; has "App design 2" but **it is 100% uncommitted** — `git status` shows `App design 2/` as
untracked). Committing it is a reasonable next step once the user confirms the current state is good.

## Two parallel app builds

### App design 1 — `main` branch, folder `App design 1/`
The original build. Museum-sepia palette (warm tan/cream, `#EDE7DA` family), New York serif for
large titles only, SF Pro elsewhere, Liquid Glass tab bar/toolbars, the signature "tear" save
animation. Xcode project name `IndiaInStamps`, bundle id `com.dipanshudaga.IndiaInStamps`. This is
the baseline/reference build — stable, not being actively changed right now.

### App design 2 — `design-change` branch, folder `App design 2/` (current focus)
A "modern museum / display case" visual direction, built from a spec doc the user supplied
(`india_in_stamps_modern_museum_ui_direction.md`, in their Downloads — not in the repo). Same data
layer as design 1 (untouched, copied over). Xcode project name `IndiaInStampsDesign2`, bundle id
`com.dipanshudaga.IndiaInStamps.design2` (deliberately different so both apps can be installed
side by side).

**Key files in App design 2:**
- `Sources/DesignSystem/Colors.swift` — near-white bg tokens (`bgPage` `#FAF8F4`, `bgCard`
  `#FFFFFF`), plus case-specific tokens: `caseBacking` `#C7BCA3` (deliberately darker than page —
  first version was too subtle, see "Lessons learned"), `caseFrame` `#8F836A`.
- `Sources/DesignSystem/Typography.swift` — Large Title / Title 1 now `.bold` weight (reference
  images show heavier serif than default).
- `Sources/DesignSystem/PaperTexture.swift` — very faint grain, dialed down hard per the spec's
  "barely perceptible" rule.
- `Sources/Views/Components/DisplayCase.swift` — **the core reusable component**. Wraps any
  content in a museum display case: recessed interior (darker backing + top-lit gradient), mount
  plane, defined frame, glass sheen overlay, corner "rivet" hardware accents, layered shadows. Used
  by `StampCard` and directly in `StampDetailView`'s hero and `TimelineView`'s featured stamp.
  **This is currently a flat 2D SwiftUI approximation — see "In-flight work" below, the user wants
  a real 3D rendered glass box instead.**
- `Sources/Views/Components/StampCard.swift` — thin wrapper: `DisplayCase { LocalStampImage }`.
- `Sources/Views/Components/CustomIcons.swift` — hand-drawn `PerforatedStampOutline` and
  `PostmarkIcon` (Canvas-based vector art, no image assets) for empty states.
- `Sources/Views/Timeline/TimelineView.swift` + `TimelineRuler.swift` — **currently: single large
  stamp in a display case + horizontal scrubber ruler below** (ported back from App design 1's
  structure per user request — an earlier year-list version was tried and reverted, see history
  below). Ruler has distance-tapered tick sizes, springs into place, haptic on each step, extra
  scale boost while actively dragging. Calendar reached via toolbar icon (not a 5th tab).
- `Sources/Views/Timeline/CalendarView.swift` — new feature, not in original design.md. Real month
  grid, marks days with a stamp release, tap a day to see what was issued. Year-jump via a Menu.
- `Sources/Views/Gallery/GalleryView.swift` — type-based filter chips using **real** CSV `type`
  values (Commemorative, Personality, Event, Thematic, Institution, Defence — verified via direct
  CSV query, NOT the reference mockup's guessed "Definitive/Series"). Uniform grid now (not
  masonry — see design decisions).
- `Sources/Views/Detail/StampDetailView.swift` — hero in a big `DisplayCase`, name, then a compact
  "denomination · issue date" line (no bordered table, no category/currency rows — all removed per
  user request), tags, description. Floating Clear-glass toolbar (back/save/share) unchanged from
  design 1.
- `Sources/Views/Search/SearchView.swift`, `Views/Collections/*` — same structure as design 1,
  restyled with `DisplayCase`/uniform sizing, collection cards now single-image (not fanned stack).
- `Sources/Views/RootTabView.swift` — 4 tabs (Timeline, Gallery, floating Search capsule,
  Collections). `.searchable()` is at the TabView level for the `role: .search` floating-capsule
  behavior to work — this leaks an inline search bar into other tabs' nav bars as a side effect;
  fixed on Timeline via `.toolbar(removing: .search)` (confirmed working). **Not yet applied to
  Gallery/Collections** if that bar shows up there too — wasn't asked about, worth checking.
- `asset-prompts.md` (in App design 2 folder) — a wishlist of optional AI-image-gen prompts for
  things pure SwiftUI can't achieve well (app icon, glass sheen texture, gallery background
  texture, mount texture). None are blocking; the app runs fully without them.

## Design decisions made live in chat (override design.md where they conflict)

- **4 tabs only**, no 5th "More" tab — Settings/About via profile icon in Collections toolbar.
- **No corner radius on stamp images** — real stamps have straight-edge corners.
- **Perforation-dot motif and per-card bookmark icon removed entirely** — save-to-collection now
  lives only in Detail's floating toolbar.
- **Detail screen presents as a bottom sheet** (`.sheet`), not a push/zoom navigation transition —
  applied consistently everywhere a stamp is tapped (Timeline, Gallery, Search, Collections).
- **Broader serif usage**: Title2/Title3 also New York now (stamp names, collection titles), not
  just Large Title/Title1 as design.md originally specified.
- **Uniform display-case sizing everywhere** (Gallery/Search/Collections all switched from
  masonry/variable sizing to a fixed grid) — the user's reasoning: source images have
  inconsistent native aspect ratios baked in, so masonry read as "inconsistent," not intentional.
- **Calendar feature** — not in original design.md/PRD, added per direct request. Browse by actual
  release date. Reached from Timeline's toolbar.

## Critical bugs found and fixed this session (don't reintroduce these patterns)

1. **CSV parser silently ate the whole file.** `Stamps Enriched.csv` uses Windows CRLF line
   endings. Swift's `Character` type treats `\r\n` as a **single grapheme cluster**, so a
   character-by-character parser matching `case "\n":` never fires on a CRLF file — the entire
   file parsed as one row, causing a `Dictionary` duplicate-key crash on launch. Fix (already
   applied in both apps' `CSVParser.swift`): `content.replacingOccurrences(of: "\r\n", with:
   "\n")` before parsing. **If either app's CSV parsing ever breaks again, check this first.**
2. **Swift 6 strict concurrency crash** in `CollectionsStore.swift` — a `DispatchQueue.main.asyncAfter`
   closure capturing `self` weakly inside a non-actor-isolated context. Fixed by marking the whole
   class `@MainActor` and using `Task { try? await Task.sleep(...) }` instead of `DispatchQueue`.
3. **Real-device hang → watchdog kill (signal 9)**, not a real crash. Root cause: `TimelineView`
   (the year-list version, since reverted) used a plain `VStack` instead of `LazyVStack` for ~79
   year sections, each doing an unmemoized `O(n)` filter over the full stamp array on every body
   evaluation. Simulator (Mac-class CPU) hid this; the physical iPhone 12 didn't. **General rule
   applied everywhere now**: any list scoped to run on-device must use `LazyVStack`/`LazyHStack`,
   and any per-item grouping (`Dictionary(grouping:)`) must be computed once into `@State` via
   `.task(id:)`, never as a recomputing `var` computed property. `CalendarView.stampsByDate` was
   fixed the same way pre-emptively (same bug pattern, would have hit the same wall).
4. **A live Gemini API key was hardcoded** in `Scripts/AI Enrichment.py` — removed before the
   initial git commit (replaced with an environment-variable check). **The user should still
   rotate/revoke that key** in their Gemini/Google AI Studio console — this was flagged but I
   can't confirm it's been done. (The key value itself is intentionally not repeated here — it
   was already caught once by GitHub push protection when this file was drafted.)
5. **`Wikipedia Stamp Collection/` folder mysteriously vanished from disk mid-session** — no
   confirmed cause (wasn't anything I ran). Restored from git (it was already committed). Nothing
   else was affected. Just noting it happened in case it recurs.

## Tooling / environment notes

- **XcodeGen** generates both `.xcodeproj` files from `project.yml` — after adding/removing/renaming
  any source file, you MUST run `xcodegen generate` in that app's folder before building, or the
  build will fail with "cannot find X in scope" even though the file exists on disk.
- **Physical device deployment is set up and working**: user's iPhone 12, iOS 26.5.2, device id
  `00008101-000669AE2200801E`, Apple ID `dipanshudaga24@gmail.com`, personal team
  `FSQA5JT668` (`CODE_SIGN_STYLE: Automatic` + `DEVELOPMENT_TEAM: FSQA5JT668` in App design 2's
  `project.yml`). **Wireless deployment confirmed working** — no cable needed, just same Wi-Fi
  network. Build/install/launch pattern:
  ```
  xcodebuild -project "App design 2/IndiaInStampsDesign2.xcodeproj" -scheme IndiaInStampsDesign2 \
    -destination 'id=00008101-000669AE2200801E' -configuration Debug -allowProvisioningUpdates build
  xcrun devicectl device install app --device 00008101-000669AE2200801E "<path-to-.app>"
  xcrun devicectl device process launch --device 00008101-000669AE2200801E --terminate-existing \
    com.dipanshudaga.IndiaInStamps.design2
  ```
  To check if it's still alive: `xcrun devicectl device info processes --device <id> | grep <AppName>`.
  To debug a hang/crash: `xcrun devicectl device process launch --device <id> --terminate-existing
  --console <bundle-id>` run via Bash with `run_in_background: true`, then read its output after a
  few seconds — shows the actual termination signal.
- **Simulator**: iPhone 17 Pro, UDID `5CCE75E7-E4BC-4B2E-BE13-C7A2236EDC02`, used for App design 1.
  The Claude Code iOS Simulator panel tool has been flaky (loses connection, needs re-`attach`)
  — the user prefers screenshots shared directly over relying on that panel now. **Coordinate
  gotcha**: the panel's tap/swipe coordinates are in *points* (device logical size, e.g. 402×874
  for iPhone 17 Pro), NOT the pixel dimensions of the screenshot image returned (~918px wide) —
  must divide screenshot pixel coords by ~2.28x, or better, calibrate against a known point (e.g.
  tap a tab bar item at a guessed point coordinate and confirm via screenshot) before trusting
  further taps.
- **`brew install gh` and `brew install xcodegen`** were done this session — both now available.
- **`gh` is authenticated** as `dipanshudaga` (used to create/push the GitHub repo).
- No Python image libraries installed yet (opencv/pillow/numpy/rembg) — needed for in-flight work
  below, plan is to use an isolated venv in `Scripts/`.
- **Blender.app is installed** (`/Applications/Blender.app`) and a Blender MCP connection is
  available in this environment (`mcp__Blender__*` tools) — relevant to in-flight work below.

## In-flight work — was mid-plan when context ran out

The user's most recent asks (in order, not yet implemented):

1. Shared a reference image of a **real 3D-rendered glass display case** (visible glass thickness,
   refraction, corner screws, soft studio lighting — genuine dimensional glass, not a flat card
   with a gradient). Wants the display case to actually look like this — "exact transparent glass
   like an industrial design / product design thing."
2. Wants the stamp images **cut out along their actual perforation shape** (transparent background,
   following the real scalloped edge — not a rectangular crop, not a procedural fake scallop).
3. Wants clean cutouts written to a **new separate folder**, originals untouched.
4. Wants this **tested on just 1947 + 1948 first** (8 stamps: 3 from 1947, 5 from 1948) before any
   decision to scale to the full ~3,045 images.
5. Explicitly asked for **an implementation plan before any code/asset work** — this is why the
   previous session entered plan mode.

**A plan was written** to `/Users/dipanshudaga/.claude/plans/cosmic-dancing-tiger.md` (still exists,
worth reading directly — it has the full algorithm detail) covering:
- **Part A**: `Scripts/Extract Clean Stamps.py`, isolated venv, OpenCV-based two-stage cutout —
  (1) strip the outer white mat + black rule border via contour detection, (2) trace the *real*
  perforation edge via Canny edge detection + morphological closing + largest-contour extraction
  (not color thresholding alone, since stamp paper and background paper can be near-identical
  tones — edge/shadow detection is more robust). Output to `Stamps Images Clean/<year>/<file>.png`
  at the repo root (sibling to `Stamps Images/`, not nested in either app folder).
- **Part B**: A real Blender-rendered glass box shell (transparent material ~IOR 1.5, corner
  rivets, soft lighting) rendered once as reusable PNG layer(s) — NOT one render per stamp.
  Composited in SwiftUI as: backing layer → per-stamp cutout PNG from Part A → front-glass layer.
  Flagged as the highest-uncertainty part of the plan — likely needs a render→review→adjust loop,
  and explicitly should be shown to the user directly before any SwiftUI integration. Fallback if
  Blender doesn't pan out: enhanced SwiftUI-native pseudo-3D panels (safe but no true refraction).
- Explicitly scoped to 8 stamps only, no `DisplayCase.swift`/app integration yet — that's a
  separate follow-up decision after both pieces are validated.

**Where it actually stopped**: `ExitPlanMode` was called to present this plan for approval, but the
tool call failed with a transport error (`AbortError: Tool permission stream closed before response
received`) and the user's next message was "context window getting over, give me a handoff doc" —
**the plan has not been shown to or approved by the user yet.** The plan file exists and is ready;
next step in the new chat should be to re-surface it for approval (re-call `ExitPlanMode`, or just
summarize it and confirm) before writing any script or touching Blender.

## Immediate next steps for the new chat

1. Read `/Users/dipanshudaga/.claude/plans/cosmic-dancing-tiger.md` for the full plan detail.
2. Get the user's actual sign-off on it (it was never confirmed) — likely just re-enter plan mode
   or directly ask if the written plan is good to execute.
3. Once approved: set up the Python venv, write and iterate on the cutout script against the 8
   test images, then prototype the Blender glass box, show results directly rather than describing
   them, before any `DisplayCase.swift` integration.
4. Separately, still outstanding: commit "App design 2" to git (currently fully uncommitted on
   `design-change`), and the reminder to rotate the exposed Gemini API key.
