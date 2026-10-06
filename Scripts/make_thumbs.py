"""Builds grid thumbnails from `Stamps Images Clean/` for the web app and lays out its static image
root (`web/public/stamps/`):

    stamps/thumbs/<year>/<file>.webp  360px max, alpha preserved (grid cells)
    stamps/full -> ../../../Stamps Images Clean   (symlink, detail hero)

The same `thumbs/` + `full/` prefixes are what gets uploaded to R2 later, so the app's URL scheme
doesn't change between dev and production. Re-runnable; skips thumbs that already exist.

    python3 Scripts/make_thumbs.py
"""
import os
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "Stamps Images Clean"
DEV = REPO_ROOT / "web" / "public" / "stamps"
THUMBS = DEV / "thumbs"
MAX_DIM = 360


def make_thumb(src: Path) -> bool:
    out = (THUMBS / src.relative_to(SRC)).with_suffix(".webp")
    if out.exists():
        return False
    out.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as img:
        img = img.convert("RGBA")
        img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
        img.save(out, "WEBP", quality=82, method=4)
    return True


def main() -> None:
    DEV.mkdir(parents=True, exist_ok=True)
    link = DEV / "full"
    if not link.exists():
        link.symlink_to(os.path.relpath(SRC, DEV))

    files = sorted(SRC.glob("*/*.png"))
    with ProcessPoolExecutor() as pool:
        made = sum(pool.map(make_thumb, files, chunksize=32))
    print(f"{made} thumbs written, {len(files) - made} already present -> {THUMBS}")


if __name__ == "__main__":
    main()
