"""Composite a scene's layers for review: python3 tools/art/preview_scene.py out.png scene [scene...]"""
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "assets", "art", "scenes")
out, scenes = sys.argv[1], sys.argv[2:]
tiles = []
for s in scenes:
    base = Image.open(os.path.join(D, f"{s}_far.png")).convert("RGBA")
    for layer in ("mid", "near"):
        p = os.path.join(D, f"{s}_{layer}.png")
        if os.path.exists(p):
            base.alpha_composite(Image.open(p).convert("RGBA"))
    tiles.append(base.resize((960, 540)))
cols = 2
sheet = Image.new("RGB", (960 * min(cols, len(tiles)), 540 * ((len(tiles) + cols - 1) // cols)))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 960, (i // cols) * 540))
sheet.save(out)
