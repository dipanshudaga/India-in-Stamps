import glob
import os

import cv2
import numpy as np
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ROOT = os.path.join(REPO_ROOT, "Stamps Images")
DST_ROOT = os.path.join(REPO_ROOT, "Stamps Images Clean")
DEBUG_ROOT = os.path.join(REPO_ROOT, "Stamps Images Clean", "_debug")

TEST_YEARS = ["1947", "1948"]

RULE_INSET = 15
MAT_TOLERANCE = 30
FLOODFILL_TOLERANCE = 14
CLEANUP_KERNEL_SIZE = 5
EDGE_ERODE_PX = 1
FEATHER_KERNEL = (3, 3)

DEBUG_BG_COLOR = (0, 200, 140)  # teal, BGR - to spot white halo against


def corner_flood_background_mask(bgr, tolerance):
    # The background (white photo mat, or the cream margin around a stamp)
    # is one uniform region that always touches all four corners of the
    # image/crop, while the content of interest (rule border + stamp, or the
    # stamp itself) never does. Flood-filling from the corners against the
    # *fixed* seed color (not the floating neighbor-to-neighbor default)
    # follows that true boundary reliably even across a soft scan-blur
    # gradient, and - unlike a darkness/edge threshold - can't be fooled by
    # high-contrast ink or print lines further inside the content.
    h, w = bgr.shape[:2]
    bg_mask = np.zeros((h, w), np.uint8)
    lo = up = (tolerance,) * 3
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for cx, cy in corners:
        ff_mask = np.zeros((h + 2, w + 2), np.uint8)
        cv2.floodFill(
            bgr.copy(), ff_mask, (cx, cy), 255,
            loDiff=lo, upDiff=up,
            flags=4 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8),
        )
        bg_mask |= ff_mask[1:-1, 1:-1]
    return bg_mask


def largest_foreground_mask(bg_mask):
    fg = cv2.bitwise_not(bg_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLEANUP_KERNEL_SIZE, CLEANUP_KERNEL_SIZE))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, kernel, iterations=1)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return None
    return max(contours, key=cv2.contourArea)


def find_content_bbox(img_bgr):
    bg_mask = corner_flood_background_mask(img_bgr, MAT_TOLERANCE)
    largest = largest_foreground_mask(bg_mask)
    if largest is None:
        return None
    return cv2.boundingRect(largest)


def trace_perforation_mask(cropped_bgr):
    h, w = cropped_bgr.shape[:2]
    bg_mask = corner_flood_background_mask(cropped_bgr, FLOODFILL_TOLERANCE)
    largest = largest_foreground_mask(bg_mask)
    if largest is None:
        return None

    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(mask, [largest], -1, 255, thickness=cv2.FILLED)
    if EDGE_ERODE_PX > 0:
        # Pixels right at the true boundary are a blend of mat and paper color
        # (scan blur/antialiasing), not fully either - including that thin band
        # as opaque leaves a faint discolored fringe. Eroding 1px trims the band.
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (EDGE_ERODE_PX * 2 + 1,) * 2)
        mask = cv2.erode(mask, erode_kernel, iterations=1)
    mask = cv2.GaussianBlur(mask, FEATHER_KERNEL, 0)
    return mask


def extract_stamp(src_path):
    img = cv2.imread(src_path, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError(f"could not read {src_path}")

    rect = find_content_bbox(img)
    if rect is None:
        raise RuntimeError(f"could not find rule border in {src_path}")
    x, y, w, h = rect
    x0, y0 = x + RULE_INSET, y + RULE_INSET
    x1, y1 = x + w - RULE_INSET, y + h - RULE_INSET
    cropped = img[y0:y1, x0:x1]

    mask = trace_perforation_mask(cropped)
    if mask is None:
        raise RuntimeError(f"could not trace perforation edge in {src_path}")

    b, g, r = cv2.split(cropped)
    rgba = cv2.merge([r, g, b, mask])
    return rgba, mask, cropped


def composite_on_debug_bg(rgba):
    rgb = rgba[:, :, :3].astype(np.float32)
    alpha = (rgba[:, :, 3:4].astype(np.float32)) / 255.0
    bg = np.array(DEBUG_BG_COLOR[::-1], dtype=np.float32)  # to RGB
    out = rgb * alpha + bg * (1 - alpha)
    return out.astype(np.uint8)


def process_year(year, write_debug=False):
    src_dir = os.path.join(SRC_ROOT, year)
    dst_dir = os.path.join(DST_ROOT, year)
    os.makedirs(dst_dir, exist_ok=True)
    if write_debug:
        debug_dir = os.path.join(DEBUG_ROOT, year)
        os.makedirs(debug_dir, exist_ok=True)

    ok, failed, copied = 0, 0, 0

    # Primary source: album-scan JPGs (white mat + black rule + cream margin + perforated
    # edge) - the two-stage flood-fill cutout below is tuned specifically for this structure.
    jpg_files = sorted(glob.glob(os.path.join(src_dir, "*.jpg")) + glob.glob(os.path.join(src_dir, "*.JPG")))
    for path in jpg_files:
        name = os.path.splitext(os.path.basename(path))[0]
        out_path = os.path.join(dst_dir, name + ".png")
        if os.path.exists(out_path):
            ok += 1
            continue
        try:
            rgba, mask, cropped = extract_stamp(path)
        except Exception as e:
            # A handful of files carry a .jpg extension but aren't actually album scans (no
            # mat/rule border for the cutout to find) - same gap-fill situation as the
            # jpeg/png/gif files below, just mislabeled. Fall back to a straight copy rather
            # than leaving the stamp missing from the clean set entirely.
            try:
                img = Image.open(path).convert("RGBA")
                img.save(out_path)
                copied += 1
            except Exception as e2:
                print(f"  FAILED {year}/{name}: {e} (copy-through fallback also failed: {e2})")
                failed += 1
            continue

        Image.fromarray(rgba, "RGBA").save(out_path)
        if write_debug:
            debug_composite = composite_on_debug_bg(rgba)
            Image.fromarray(debug_composite, "RGB").save(os.path.join(debug_dir, name + "_on_teal.png"))
            Image.fromarray(mask, "L").save(os.path.join(debug_dir, name + "_mask.png"))
        ok += 1

    # Gap-fill substitutes (jpeg/png/gif) - sourced separately (e.g. a "download missing"
    # pass), already tightly cropped with no mat/rule border to remove. Running the
    # mat-detection cutout on these would be wrong (there's no mat to find); just convert to
    # RGBA and copy through untouched.
    other_files = []
    for ext in ("*.jpeg", "*.JPEG", "*.png", "*.PNG", "*.gif", "*.GIF"):
        other_files.extend(glob.glob(os.path.join(src_dir, ext)))
    for path in sorted(set(other_files)):
        name = os.path.splitext(os.path.basename(path))[0]
        out_path = os.path.join(dst_dir, name + ".png")
        if os.path.exists(out_path):
            copied += 1
            continue
        try:
            img = Image.open(path).convert("RGBA")
            img.save(out_path)
            copied += 1
        except Exception as e:
            print(f"  FAILED (copy-through) {year}/{name}: {e}")
            failed += 1

    return ok, failed, copied


def all_years():
    return sorted(
        d for d in os.listdir(SRC_ROOT)
        if os.path.isdir(os.path.join(SRC_ROOT, d)) and d.isdigit()
    )


if __name__ == "__main__":
    import sys

    years = all_years() if "--all" in sys.argv else TEST_YEARS
    total_ok, total_failed, total_copied = 0, 0, 0
    for i, year in enumerate(years):
        ok, failed, copied = process_year(year, write_debug=("--all" not in sys.argv))
        total_ok += ok
        total_failed += failed
        total_copied += copied
        print(f"[{i + 1}/{len(years)}] {year}: {ok} cut, {copied} copied, {failed} failed "
              f"(running total: {total_ok} cut, {total_copied} copied, {total_failed} failed)")

    print(f"DONE: {total_ok} cut, {total_copied} copied, {total_failed} failed across {len(years)} years")
