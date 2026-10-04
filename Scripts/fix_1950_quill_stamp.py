"""One-off replacement for the 1950 Quill/Inkwell stamp: the original album-scan source blends
the stamp's cream paper into the mat too closely for the corner-flood cutout to trace a clean
edge. Swap in a cleaner Wikipedia catalog photo instead, background-removed the same way (corner
flood-fill), with a mild exposure lift."""
import os

import cv2
import numpy as np
from PIL import Image, ImageEnhance

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = "/Users/dipanshudaga/Downloads/1950_Republic_India_02.jpg"
DST = os.path.join(REPO_ROOT, "Stamps Images Clean", "1950", "1950_Images_Stamps1950_26-01-1950-1.png")

FLOODFILL_TOLERANCE = 20
CLEANUP_KERNEL_SIZE = 5
EDGE_ERODE_PX = 1
FEATHER_KERNEL = (3, 3)
EXPOSURE_FACTOR = 1.12


def corner_flood_background_mask(bgr, tolerance):
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


def trace_perforation_mask(bgr):
    h, w = bgr.shape[:2]
    bg_mask = corner_flood_background_mask(bgr, FLOODFILL_TOLERANCE)
    largest = largest_foreground_mask(bg_mask)
    if largest is None:
        return None
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(mask, [largest], -1, 255, thickness=cv2.FILLED)
    if EDGE_ERODE_PX > 0:
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (EDGE_ERODE_PX * 2 + 1,) * 2)
        mask = cv2.erode(mask, erode_kernel, iterations=1)
    mask = cv2.GaussianBlur(mask, FEATHER_KERNEL, 0)
    return mask


def main():
    img = cv2.imread(SRC, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError(f"could not read {SRC}")

    mask = trace_perforation_mask(img)
    if mask is None:
        raise RuntimeError("could not trace perforation edge")

    b, g, r = cv2.split(img)
    x, y, w, h = cv2.boundingRect(mask)
    b, g, r, mask = b[y:y + h, x:x + w], g[y:y + h, x:x + w], r[y:y + h, x:x + w], mask[y:y + h, x:x + w]
    rgba = cv2.merge([r, g, b, mask])

    out = Image.fromarray(rgba, "RGBA")
    rgb, alpha = out.convert("RGB"), out.getchannel("A")
    rgb = ImageEnhance.Brightness(rgb).enhance(EXPOSURE_FACTOR)
    out = Image.merge("RGBA", (*rgb.split(), alpha))

    out.save(DST)
    print(f"saved {DST} ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    main()
