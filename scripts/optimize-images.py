#!/usr/bin/env python3
"""Make smaller WebP copies of the store photos (run it after adding photos to public/media).

    python3 scripts/optimize-images.py          # only new or changed photos
    python3 scripts/optimize-images.py --force  # redo everything

For every photo public/media/<name>.jpg it writes
    public/media/w480/<name>.webp   (product cards, thumbnails)
    public/media/w960/<name>.webp   (product page, quick view)
and for the homepage banner public/ab.jpeg it writes public/ab.webp and public/ab-1600.webp.
The store picks the right size automatically and falls back to the original photo if a copy
is missing, so running this is optional but makes pages load much faster.
Needs Pillow (pip install Pillow). Copies whose source photo was deleted are removed.
"""
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is needed: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "public" / "media"
SIZES = {"w480": 480, "w960": 960}
HERO = ROOT / "public" / "ab.jpeg"
HERO_SIZES = {"ab-1600.webp": 1600, "ab.webp": None}  # None = keep the full width
QUALITY = 78
PHOTO_TYPES = {".jpg", ".jpeg", ".png", ".webp"}


def prepared(path):
    """Open a photo upright, in a mode WebP can store."""
    image = ImageOps.exif_transpose(Image.open(path))
    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    return image.convert("RGBA" if has_alpha else "RGB")


def save_webp(image, target, width):
    if width and image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    image.save(target, "WEBP", quality=QUALITY, method=5)
    return target.stat().st_size


def up_to_date(source, targets):
    return all(t.exists() and t.stat().st_mtime >= source.stat().st_mtime for t in targets)


def main():
    force = "--force" in sys.argv
    for folder in SIZES:
        (MEDIA / folder).mkdir(exist_ok=True)

    photos = sorted(p for p in MEDIA.iterdir() if p.is_file() and p.suffix.lower() in PHOTO_TYPES)
    made = kept = failed = 0
    original_bytes = {name: 0 for name in SIZES}
    new_bytes = {name: 0 for name in SIZES}

    for photo in photos:
        targets = {name: MEDIA / name / f"{photo.stem}.webp" for name in SIZES}
        if not force and up_to_date(photo, targets.values()):
            kept += 1
            continue
        try:
            image = prepared(photo)
            for name, width in SIZES.items():
                new_bytes[name] += save_webp(image, targets[name], width)
                original_bytes[name] += photo.stat().st_size
            made += 1
        except Exception as err:  # a broken photo must not stop the others
            failed += 1
            print(f"  skipped {photo.name}: {err}")

    # Remove copies of photos that no longer exist
    stems = {p.stem for p in photos}
    removed = 0
    for name in SIZES:
        for copy in (MEDIA / name).glob("*.webp"):
            if copy.stem not in stems:
                copy.unlink()
                removed += 1

    print(f"Photos: {len(photos)} ({made} converted, {kept} already up to date, {failed} failed, {removed} old copies removed)")
    for name in SIZES:
        if original_bytes[name]:
            print(f"  {name}: {new_bytes[name] / 1e6:.1f} MB (originals {original_bytes[name] / 1e6:.1f} MB)")

    if HERO.exists():
        targets = {file: HERO.parent / file for file in HERO_SIZES}
        if force or not up_to_date(HERO, targets.values()):
            image = prepared(HERO)
            for file, width in HERO_SIZES.items():
                size = save_webp(image, targets[file], width)
                print(f"Banner {file}: {size / 1024:.0f} KB (original {HERO.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
