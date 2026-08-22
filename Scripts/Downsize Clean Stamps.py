import glob
import os

from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_ROOT = os.path.join(REPO_ROOT, "Stamps Images Clean")

MAX_DIMENSION = 2000


def downsize_all():
    files = sorted(glob.glob(os.path.join(CLEAN_ROOT, "*", "*.png")))
    resized, skipped, failed = 0, 0, 0

    for path in files:
        try:
            with Image.open(path) as img:
                w, h = img.size
                if max(w, h) <= MAX_DIMENSION:
                    skipped += 1
                    continue

                scale = MAX_DIMENSION / max(w, h)
                new_size = (max(1, round(w * scale)), max(1, round(h * scale)))
                resized_img = img.convert("RGBA").resize(new_size, Image.LANCZOS)
                resized_img.save(path, optimize=True)
                resized += 1
                print(f"  resized {os.path.relpath(path, CLEAN_ROOT)}: {w}x{h} -> {new_size[0]}x{new_size[1]}")
        except Exception as e:
            print(f"  FAILED {path}: {e}")
            failed += 1

    print(f"DONE: {resized} resized, {skipped} already under {MAX_DIMENSION}px, {failed} failed")


if __name__ == "__main__":
    downsize_all()
