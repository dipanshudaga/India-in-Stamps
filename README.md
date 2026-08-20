# India in Stamps

An offline-first, native SwiftUI catalog of every Indian postage stamp issued since 1947 — 3,000+
records, each with a historical description and semantic tags, browsed chronologically or by theme.

Targets iOS 26+. Design system and full screen specs are in [`design.md`](design.md); original
product brief in [`prd.md`](prd.md).

## Structure

- `App design 1/` — the SwiftUI app (Xcode project generated via [XcodeGen](https://github.com/yonaskolb/XcodeGen) from `project.yml`; product/target name is still `IndiaInStamps` internally — this folder name just labels the design direction)
- `Stamps Enriched.csv` / `Stamps Raw.csv` — the catalog dataset
- `Scripts/` — data cleanup/enrichment scripts used to build the dataset
- `Wikipedia Stamp Collection/` — cross-reference data used during enrichment

## Building

The app bundles `Stamps Enriched.csv` directly (see `App design 1/Sources/Resources/`). Stamp
*images* are not included in this repo (1.4GB of source photography) — the Xcode project expects
a local `Stamps Images/` folder at the repo root, organized as `Stamps Images/<year>/<file>.jpg`,
symlinked or copied into `App design 1/Sources/Resources/StampImages` before building.

```bash
cd "App design 1"
xcodegen generate   # only needed if project.yml changed
open IndiaInStamps.xcodeproj
```
