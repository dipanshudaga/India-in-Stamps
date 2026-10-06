"""Builds the data for the web "Wall of India" (Three.js): sprite atlas sheets, per-stamp colour
features, and the Time / Colour lens layouts. One script, so atlas order, features and layouts can
never drift apart.

Outputs (web/):
    public/stamps/atlas/<n>.webp  2048px sheets of 80px cells (static files; CDN/R2 later)
    src/data/wall.json            ids + atlas cell + per-lens grid coordinates (bundled, ~150KB)
    public/stamps/previews/*.png  contact sheets of each lens, for eyeballing layouts off-device

Layouts are "skylines": stamps stack into columns of ROWS cells, a group (a year, a hue) gets as many
columns as it needs, groups are separated by a one-column gap. Coordinates are integer grid cells;
the app multiplies by its pitch. Re-run whenever stamps.json or the thumbs change.

    python3 Scripts/make_thumbs.py && python3 Scripts/make_wall.py
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
APP = REPO / "web"
STAMPS = APP / "src" / "data" / "stamps.json"
THUMBS = APP / "public" / "stamps" / "thumbs"
ATLAS = APP / "public" / "stamps" / "atlas"
PREVIEWS = APP / "public" / "stamps" / "previews"
OUT = APP / "src" / "data" / "wall.json"

CELL = 80
SHEET = 2048
PER_ROW = SHEET // CELL          # 25
PER_SHEET = PER_ROW * PER_ROW    # 625
ROWS = 24                        # skyline height in cells
HUE_BINS = 24


def thumb_path(stamp: dict) -> Path:
    return (THUMBS / stamp["localImageRelativePath"]).with_suffix(".webp")


def colour_features(rgba: np.ndarray) -> tuple[float, float, float]:
    """(hue 0-1 of the most vivid dominant colour, mean saturation, mean luminance) over opaque pixels."""
    mask = rgba[..., 3] > 0.5
    if mask.sum() < 20:
        return 0.0, 0.0, 0.5
    rgb = rgba[..., :3][mask]
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    mx, mn = rgb.max(1), rgb.min(1)
    d = mx - mn
    sat = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)

    h = np.zeros_like(mx)
    nz = d > 1e-6
    rc = nz & (mx == r)
    gc = nz & ~rc & (mx == g)
    bc = nz & ~rc & ~gc
    h[rc] = ((g[rc] - b[rc]) / d[rc]) % 6
    h[gc] = (b[gc] - r[gc]) / d[gc] + 2
    h[bc] = (r[bc] - g[bc]) / d[bc] + 4
    h /= 6.0

    # The dominant *vivid* hue: saturated, not-too-dark pixels vote, weighted by how vivid they are.
    vivid = (sat > 0.2) & (mx > 0.2)
    lum = float((0.2126 * r + 0.7152 * g + 0.0722 * b).mean())
    if vivid.sum() < 10:
        return 0.0, float(sat.mean()), lum
    votes = np.bincount((h[vivid] * HUE_BINS).astype(int) % HUE_BINS, weights=(sat * mx)[vivid], minlength=HUE_BINS)
    hue = (int(votes.argmax()) + 0.5) / HUE_BINS
    return hue, float(sat.mean()), lum


def skyline(groups: list[tuple[object, list[int]]]):
    """groups: [(key, [stamp indices bottom-to-top, left-to-right])] -> (positions, spans, width)."""
    pos: dict[int, tuple[int, int]] = {}
    spans: list[tuple[object, int, int]] = []
    x = 0
    for key, idxs in groups:
        cols = math.ceil(len(idxs) / ROWS)
        for k, i in enumerate(idxs):
            pos[i] = (x + k // ROWS, k % ROWS)
        spans.append((key, x, x + cols - 1))
        x += cols + 1
    return pos, spans, x - 1


def main() -> None:
    stamps = sorted((s for s in json.loads(STAMPS.read_text()) if s["localImageRelativePath"]), key=lambda s: s["id"])
    n = len(stamps)
    missing = [s["id"] for s in stamps if not thumb_path(s).exists()]
    assert not missing, f"{len(missing)} thumbs missing (run make_thumbs.py first): {missing[:5]}"

    sheets = (n + PER_SHEET - 1) // PER_SHEET
    ATLAS.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    canvases = [Image.new("RGBA", (SHEET, SHEET), (0, 0, 0, 0)) for _ in range(sheets)]

    hue, sat, lum = [0.0] * n, [0.0] * n, [0.0] * n
    for i, stamp in enumerate(stamps):
        with Image.open(thumb_path(stamp)) as src:
            img = src.convert("RGBA")
        img.thumbnail((CELL - 4, CELL - 4), Image.LANCZOS)
        arr = np.asarray(img, dtype=np.float32) / 255.0
        hue[i], sat[i], lum[i] = colour_features(arr)

        # Alpha bleed: transparent texels take the stamp's mean colour, so mip-mapping/filtering at the
        # perforated edge blends toward paper-ish colour instead of dark fringes.
        solid = arr[..., 3] > 0.5
        if solid.any():
            mean_rgb = (arr[..., :3][solid].mean(0) * 255).astype(np.uint8)
            px = np.asarray(img).copy()
            px[~solid, :3] = mean_rgb
            img = Image.fromarray(px, "RGBA")

        sheet, cell = divmod(i, PER_SHEET)
        col, row = cell % PER_ROW, cell // PER_ROW
        canvases[sheet].paste(img, (col * CELL + (CELL - img.width) // 2, row * CELL + (CELL - img.height) // 2))

    for old in ATLAS.glob("*.png"):
        old.unlink()
    for k, canvas in enumerate(canvases):
        # Lossy WebP with lossless alpha: browsers decode it natively, and it is ~5x smaller than PNG
        # (the perforated edge lives in the alpha channel, so that stays exact).
        canvas.save(ATLAS / f"{k}.webp", "WEBP", quality=88, alpha_quality=100, method=4)

    # --- Time lens: a block per year, oldest first; within a year by issue date.
    by_year: dict[int, list[int]] = {}
    for i, s in enumerate(stamps):
        by_year.setdefault(s["year"], []).append(i)
    for idxs in by_year.values():
        idxs.sort(key=lambda i: (stamps[i]["issueDateIso"] or "", stamps[i]["id"]))
    time_pos, time_spans, time_w = skyline(sorted(by_year.items()))

    # --- Colour lens: a block per hue bin, greys last; within a block dark at the bottom.
    NEUTRAL = HUE_BINS
    by_hue: dict[int, list[int]] = {}
    for i in range(n):
        key = NEUTRAL if sat[i] < 0.18 else int(hue[i] * HUE_BINS) % HUE_BINS
        by_hue.setdefault(key, []).append(i)
    for idxs in by_hue.values():
        idxs.sort(key=lambda i: lum[i])
    colour_pos, colour_spans, colour_w = skyline(sorted(by_hue.items()))

    assert len(time_pos) == n and len(colour_pos) == n
    flat = lambda pos: [v for i in range(n) for v in pos[i]]
    OUT.write_text(json.dumps({
        "count": n, "cell": CELL, "sheet": SHEET, "perSheet": PER_SHEET, "sheets": sheets, "rows": ROWS,
        "ids": [s["id"] for s in stamps],
        "time": flat(time_pos), "colour": flat(colour_pos),
        "hue": [round(v, 3) for v in hue], "lum": [round(v, 3) for v in lum],
        "years": [[y, a, b] for y, a, b in time_spans],
        "hues": [[h, a, b] for h, a, b in colour_spans],
        "width": {"time": time_w, "colour": colour_w},
    }, separators=(",", ":")))

    # --- Contact sheets of each lens, from the atlas cells (so they show what the phone will show).
    def preview(name: str, pos: dict, width: int) -> None:
        px = 14
        canvas = Image.new("RGB", ((width + 2) * px, (ROWS + 2) * px), (250, 248, 244))
        for i in range(n):
            sheet, cell = divmod(i, PER_SHEET)
            col, row = cell % PER_ROW, cell // PER_ROW
            tile = canvases[sheet].crop((col * CELL, row * CELL, col * CELL + CELL, row * CELL + CELL)).resize((px - 1, px - 1), Image.LANCZOS)
            gx, gy = pos[i]
            canvas.paste(tile, ((gx + 1) * px, (ROWS - gy) * px), tile)
        canvas.save(PREVIEWS / f"{name}.png")

    preview("time", time_pos, time_w)
    preview("colour", colour_pos, colour_w)

    print(f"{n} stamps -> {sheets} atlas sheets ({SHEET}px, {CELL}px cells)")
    print(f"time skyline:   {time_w + 1} cols x {ROWS} rows, {len(time_spans)} years")
    print(f"colour skyline: {colour_w + 1} cols x {ROWS} rows, {len(colour_spans)} hue blocks")
    print(f"wall.json {OUT.stat().st_size // 1024}KB | previews in {PREVIEWS}")


if __name__ == "__main__":
    main()
