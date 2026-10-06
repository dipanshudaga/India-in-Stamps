# India in Stamps — session handoff

Paste this whole file into a new chat to continue with full context.

## What this project is

A catalog of every Indian postage stamp since 1947 (3,045 records, 3,015 with an image), being built
as a **website (Next.js)** whose core idea is to show stamps as *evidence of history*: a stamp is a
state-issued mini-poster, so arranged well, 3,015 of them are India's self-portrait. Source of truth
is `Stamps Enriched.csv`. `design.md` / `prd.md` are the original native-app spec (partly superseded).

**Repo**: `/Users/dipanshudaga/My Projects/Coding/India in Stamps` · GitHub
`https://github.com/dipanshudaga/India-in-Stamps` (public) · **only `main` exists**; work on `main`.

```
web/                Next.js 16 app (App Router, TypeScript, Tailwind 4, React Three Fiber) — ACTIVE
Archive/            App Mobile (Expo) — archived reference, not maintained (see Archive/README.md)
App design 1/, 2/   native SwiftUI apps — frozen reference
Scripts/            Python data + image pipeline
Blender/            GlassDisplayCase.blend (not used by the web app)
Stamps Images/        raw album scans            — gitignored
Stamps Images Clean/  perforation-cut PNG cutouts — gitignored (1.8GB), what the apps display
```

## Run it

```bash
cd web
npm run dev          # http://localhost:3000   (add ?debug=1 for an fps/draw-call readout)
npm run build        # production build (passes as of now)
```
Open `/?s=<stamp id>` to land on a stamp; `/stamp/<id>` is the shareable, indexable page.
Verify UI changes in a real browser (the Claude browser pane works) — the whole reason for moving to the web.

## Data + image pipeline (`Scripts/`, Python 3 + Pillow + numpy; re-run when the CSV or images change)

```bash
python3 Scripts/csv_to_json.py     # CSV -> web/src/data/stamps.json (nulls image path if the PNG is missing)
python3 Scripts/make_thumbs.py     # 360px WebP thumbs -> web/public/stamps/thumbs, symlink stamps/full -> Stamps Images Clean
python3 Scripts/make_wall.py       # atlas sheets + colour features + lens layouts -> web/public/stamps/atlas, web/src/data/wall.json
```
`web/public/stamps/` is gitignored (generated; production should serve it from a CDN/R2 via
`NEXT_PUBLIC_IMAGE_BASE_URL`). **Keep it same-origin in dev** — WebGL textures need CORS on any other origin.
`make_wall.py` also writes contact-sheet PNGs of each lens to `web/public/stamps/previews/` so layouts
can be judged without running the app.

## The Wall (the signature experience) — `web/src/components/wall/`

One full-viewport 3D scene; every stamp is an instance. A **lens** switch morphs all 3,015 stamps to a
new arrangement **on the GPU** (per-instance `aFrom`/`aTo` attributes + one `uProgress` uniform,
staggered left-to-right, arcing in z). Implemented lenses: **Time** (a column per year, stacked by date —
a "stamp histogram") and **Colour** (hue spectrum by dominant colour).

- `wall-scene.tsx` — R3F scene: 5 `InstancedBufferGeometry` meshes (one per 2048px atlas sheet, 80px cells,
  ~5 draw calls total), the morph shaders, inertia, per-frame year callback.
- `use-wall-controls.ts` — pointer drag (inertia), wheel/trackpad zoom toward cursor, 2-finger pinch,
  click-to-pick, arrow keys + `+/-`. Writes a plain mutable `Controls` object; no React render per event.
- `wall-app.tsx` — shell: canvas, scrims, lens switcher, year label, `?s=` URL sync, loading state.
- `wall-data.ts` — layouts as Float32Arrays, `stampAtCell` (tap -> stamp via grid Map, no raycaster).
- `stamp-detail.tsx` — drawer (side on desktop, bottom sheet on phones); fetches `/api/stamps/[id]`.
- Server: `lib/stamps-server.ts` keeps the 1.9MB catalog off the client bundle; `app/api/stamps/[id]`,
  `app/stamp/[id]` (SSR, metadata, og:image).

Verified in a browser: 60fps, 5 draw calls, ~6k tris, both lenses, click -> drawer, drag/zoom, 5s first load.

### Roadmap (agreed; chosen ideas only)
1. **Theme lens** (~10 islands: Freedom Fighters 329, Science, Wildlife, Sports...) and **Value lens**
   (x = year, y = log denomination; decimalisation 1957). Needs a theme taxonomy from tags (propose to the user).
2. **Era Time Machine** on the Time lens: decade scrubber, fog/colour grade shifts sepia -> clean, currency
   label (annas -> paise -> rupees), a headline event per year (`era-events.json`, ~78 verified one-liners).
3. **People lens + person view**: clusters per personality (Gandhi ~100 stamps) via `people.json`
   (canonical person -> stamp ids, aliases hand-checked); open one to see their stamps across decades.
4. **Design Evolution**: before/after slider between two stamps/eras + loupe (camera dolly to full-res).
5. Other pages: Search (tags/year filters), Calendar (issue dates), Timeline — as ordinary Next routes.
Parked by the user: Story Trails, Today in Stamps, Map of India, Play & Collect.

### Gotchas learned (don't re-learn)
- **R3F aims a new camera at the origin.** Create the `<Canvas camera>` at `x=y=0` and move it in `useFrame`,
  or the whole wall skews. Prettier reformats JSX — a scripted string replace on it can silently miss; Read first.
- **Inertia must integrate exactly** (`travel = (1-exp(-k·dt))/k`), not `v·dt`, and release velocity is capped —
  otherwise a long frame or a huge pointer jump flings the camera across the wall.
- Atlas is **lossy WebP with lossless alpha** (6.6MB vs 29MB PNG); transparent texels are pre-filled with the
  stamp's mean colour so mip-mapping doesn't leave dark fringes at the perforated edge.
- Next 16 differs from older versions: **read `web/node_modules/next/dist/docs/`** before writing Next code
  (`params`/`searchParams` are Promises; `PageProps<'/route'>` / `RouteContext<'/route'>` are global helpers).
- eslint-config-next enables React Compiler lint rules; the imperative GL files carry scoped, explained
  `eslint-disable` headers (`react-hooks/immutability`, `refs`) — keep those scoped to the rule actually hit.
- Expo/RN history (why it was archived): `expo-gl` has partial WebGL2, local-file textures only, and three.js can't
  run in worklets; also `three` must resolve to ONE build under Metro (it ships separate ESM/CJS).

## Data notes
- Types: Commemorative 1,616 / Personality 480 / Event 423 / Thematic 334 / Institution 127 / Defence 65.
  486 distinct tags; decades are lopsided (1940s 12 -> 2010s 836). **Descriptions are one sentence** (median
  144 chars) — real storytelling needs a grounded enrichment pass (event, places, people, story), with
  confidence flags; do not free-generate history. Only ~21% of stamps name a state in their text.
- **The clean cutouts are low-res**: median longest side 480px, 1,821 of 3,043 under 500px. A study of other
  sources (stampsofindia.com, Wikipedia/Commons) is on file in the conversation history but the user chose NOT
  to implement it. Don't revive it unprompted.
- **Known bug, not fixed:** `Scripts/Extract Clean Stamps.py` seeds the background flood-fill from the literal
  corner pixel; antialiased rule-border pixels break `FLOODFILL_FIXED_RANGE`, leaving backgrounds baked in on
  ~676 stamps. Fix: seed a few pixels inset from each corner, reprocess only the affected files, then delete
  their thumbs so `make_thumbs.py` regenerates them (it skips existing), then re-run `make_wall.py`.

## Working with this user
- Terse, fast, iterative; sends follow-ups mid-turn. Wants **root-cause fixes**, not patches; cost-conscious.
- Pivots direction when something isn't good (native -> Expo -> web). Offer a recommendation + the main
  tradeoff, then build; use plan mode for large new directions and ExitPlanMode for approval.
- The auto-mode classifier blocks history rewrites (`git commit --amend`, reset); hand the user the exact command.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Commit/push only when asked.

## Open items
1. **Uncommitted**: the Expo app moved to `Archive/`, the whole `web/` app, script changes, this file. Ask before committing/pushing.
2. Build the Theme/Value lenses, then the Era Time Machine (see roadmap).
3. Host images on a CDN/R2 (`web/public/stamps` is dev-only); decide deployment (Vercel is the obvious fit).
4. Fix the flood-fill seed bug and reprocess ~676 stamps (offered earlier, not approved).
5. **Rotate the Gemini API key** once present in an earlier local commit (never pushed, removed from history) —
   can't confirm it was revoked.
