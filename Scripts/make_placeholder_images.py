"""Generates PLACEHOLDER stamp images for the web app from Unsplash photos, for when the real stamp
scans (`Stamps Images Clean/`) aren't available (e.g. cloud sessions). Writes the same layout the app
expects under `web/public/stamps/` (gitignored):

    thumbs/<year>/<file>.webp   atlas/<n>.webp   full/<year>/<file>.png

Only PHOTOS x CROPS distinct stamp designs are rendered; every stamp maps to one of them by id, and
thumbs/full files for the rest are symlinks, so this stays fast and small.

    python3 Scripts/make_placeholder_images.py
"""
import io
import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parent.parent
WEB = REPO / "web"
OUT = WEB / "public" / "stamps"
CACHE = Path("/tmp/unsplash_placeholders")

# Unsplash photo ids (free licence, https://unsplash.com/license) - Indian heritage architecture.
PHOTOS = [
    "photo-1524230507669-5ff97982bb5e",  # Hawa Mahal - Annie Spratt
    "photo-1532664189809-02133fee698d",  # Taj Mahal reflection - Fahrul Azmi
    "photo-1515091943-9d5c0ad475af",     # Humayun's Tomb - Raghu Nayyar
    "photo-1523980077198-60824a7b2148",  # Taj Mahal - Annie Spratt
    "photo-1524309784716-6a4be8299c7f",  # Amer Fort - Annie Spratt
    "photo-1561042771-abb14f50b8f4",     # Interior - Ishan Ansari
    "photo-1592555793101-4735dfe82341",  # Courtyard - Ahmad Mansuri Alkindii
    "photo-1582998451055-5ce52763e246",  # Rampuriya Havelis - Mahima Agarwal
    "photo-1678626719534-727e94037a9d",  # Reflection - Dewang Gupta
]
CROPS = [(1.0, 0.5, 0.2), (1.35, 0.3, 0.6), (1.7, 0.7, 0.4), (1.15, 0.5, 0.85)]  # zoom, x, y
W, H, PAPER, HOLE = 300, 360, 16, 9
CELL, SHEET = 80, 2048


def photo(pid: str) -> Image.Image:
    CACHE.mkdir(exist_ok=True)
    f = CACHE / f"{pid}.jpg"
    if not f.exists():
        url = f"https://images.unsplash.com/{pid}?fm=jpg&fit=max&w=900&q=80"
        f.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})).read())
    return Image.open(f).convert("RGB")


def stamp(img: Image.Image, zoom: float, fx: float, fy: float) -> Image.Image:
    iw, ih = W - 2 * PAPER, H - 2 * PAPER
    scale = max(iw / img.width, ih / img.height) * zoom
    big = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    x = round((big.width - iw) * fx)
    y = round((big.height - ih) * fy)
    out = Image.new("RGBA", (W, H), (246, 240, 226, 255))  # paper
    out.paste(big.crop((x, y, x + iw, y + ih)), (PAPER, PAPER))
    mask = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(mask)
    for cx in range(HOLE, W, HOLE * 2 + 2):  # perforations along top/bottom/left/right
        d.ellipse((cx - HOLE // 2, -HOLE // 2, cx + HOLE // 2, HOLE // 2), fill=0)
        d.ellipse((cx - HOLE // 2, H - HOLE // 2, cx + HOLE // 2, H + HOLE // 2), fill=0)
    for cy in range(HOLE, H, HOLE * 2 + 2):
        d.ellipse((-HOLE // 2, cy - HOLE // 2, HOLE // 2, cy + HOLE // 2), fill=0)
        d.ellipse((W - HOLE // 2, cy - HOLE // 2, W + HOLE // 2, cy + HOLE // 2), fill=0)
    out.putalpha(mask)
    return out


def link(dst: Path, src: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.is_symlink() or dst.exists():
        dst.unlink()
    dst.symlink_to(src.resolve())


def main() -> None:
    stamps = {s["id"]: s for s in json.load(open(WEB / "src/data/stamps.json"))}
    wall = json.load(open(WEB / "src/data/wall.json"))
    designs = [stamp(photo(p), *c) for p in PHOTOS for c in CROPS]
    n = len(designs)

    base = OUT / "_designs"
    base.mkdir(parents=True, exist_ok=True)
    thumbs, fulls = [], []
    for k, im in enumerate(designs):
        t = im.copy(); t.thumbnail((360, 360), Image.LANCZOS)
        t.save(base / f"{k}.webp", "WEBP", quality=82, alpha_quality=100); thumbs.append(base / f"{k}.webp")
        f = im.resize((W * 2, H * 2), Image.LANCZOS)
        f.save(base / f"{k}.png"); fulls.append(base / f"{k}.png")

    for s in stamps.values():
        rel = s["localImageRelativePath"]
        if rel:
            link((OUT / "thumbs" / rel).with_suffix(".webp"), thumbs[s["id"] % n])
            link(OUT / "full" / rel, fulls[s["id"] % n])

    # Atlas: cell i holds wall id ids[i] (same packing as Scripts/make_wall.py).
    per_row, per_sheet = SHEET // CELL, (SHEET // CELL) ** 2
    cells = []
    for im in designs:
        c = im.copy(); c.thumbnail((CELL - 4, CELL - 4), Image.LANCZOS); cells.append(c)
    sheets = [Image.new("RGBA", (SHEET, SHEET), (0, 0, 0, 0)) for _ in range(wall["sheets"])]
    for i, sid in enumerate(wall["ids"]):
        c = cells[sid % n]
        sh, cell = divmod(i, per_sheet)
        col, row = cell % per_row, cell // per_row
        sheets[sh].paste(c, (col * CELL + (CELL - c.width) // 2, row * CELL + (CELL - c.height) // 2))
    (OUT / "atlas").mkdir(exist_ok=True)
    for k, sh in enumerate(sheets):
        sh.save(OUT / "atlas" / f"{k}.webp", "WEBP", quality=88, alpha_quality=100)
    print(f"{n} designs, {len(wall['ids'])} wall cells, {wall['sheets']} atlas sheets -> {OUT}")


if __name__ == "__main__":
    main()
