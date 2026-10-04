"""Converts `Stamps Enriched.csv` to the JSON the Expo app bundles as a local asset.

Mirrors `App Mobile/../App design 2/Sources/Data/StampRepository.swift`'s row-to-Stamp mapping so
both apps read the same catalog. Re-run whenever the CSV changes:

    python3 "Scripts/csv_to_json.py"
"""
import csv
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = REPO_ROOT / "Stamps Enriched.csv"
OUT_PATH = REPO_ROOT / "App Mobile" / "src" / "data" / "stamps.json"
CLEAN_ROOT = REPO_ROOT / "Stamps Images Clean"


def relative_image_path(image_local: str) -> str | None:
    """Same rule as `StampRepository.relativePath(from:)`: take the path after 'Stamps Images/'
    and swap whatever extension the CSV recorded for `.png` (the clean-cutout set is always PNG)."""
    if not image_local:
        return None
    marker = "Stamps Images/"
    idx = image_local.find(marker)
    if idx == -1:
        return None
    remainder = image_local[idx + len(marker):]
    rel = Path(remainder).with_suffix(".png")
    # Same as the native `Stamp.localImageURL`: a path with no file behind it is "no image",
    # not a 404 the UI has to discover at render time.
    return str(rel) if (CLEAN_ROOT / rel).exists() else None


def main() -> None:
    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    stamps = []
    for i, row in enumerate(rows):
        if not any(v.strip() for v in row.values() if v):
            continue

        tags = [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()]

        try:
            denomination = float(row.get("denomination_inr") or 0)
        except ValueError:
            denomination = 0.0

        try:
            year = int(row.get("year") or 0)
        except ValueError:
            year = 0

        stamps.append({
            "id": i,
            "name": row.get("name") or "",
            "issueDateDisplay": row.get("issue_date") or "",
            "issueDateIso": row.get("iso_date") or None,
            "year": year,
            "denominationINR": denomination,
            "type": row.get("type") or "",
            "imageURL": row.get("image_url") or None,
            "localImageRelativePath": relative_image_path(row.get("image_local") or ""),
            "brochureURL": row.get("brochure_url") or None,
            "pageURL": row.get("page_url") or None,
            "tags": tags,
            "description": row.get("description") or "",
        })

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(stamps, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"Wrote {len(stamps)} stamps to {OUT_PATH}")


if __name__ == "__main__":
    main()
