"""Contact sheet of rendered creatures on a dark backdrop: python3 tools/art/preview.py out.png ids..."""
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "assets", "art", "creatures")
out, ids = sys.argv[1], sys.argv[2:]
show_n = os.environ.get("NORMALS") == "1"
tiles = []
for cid in ids:
    im = Image.open(os.path.join(D, f"{cid}.png")).convert("RGBA")
    gl = Image.open(os.path.join(D, f"{cid}_glow.png")).convert("RGBA")
    bg = Image.new("RGBA", im.size, (14, 12, 11, 255))
    bg.alpha_composite(im)
    bg = Image.fromarray(__import__("numpy").clip(__import__("numpy").asarray(bg, dtype=float)[..., :3] + __import__("numpy").asarray(gl, dtype=float)[..., :3] * (__import__("numpy").asarray(gl, dtype=float)[..., 3:4] / 255) * 0.8, 0, 255).astype("uint8"))
    tiles.append(bg)
    if show_n:
        tiles.append(Image.open(os.path.join(D, f"{cid}_n.png")).convert("RGB"))
th = 420
tiles = [t.resize((int(t.width * th / t.height), th)) for t in tiles]
sheet = Image.new("RGB", (sum(t.width for t in tiles) + 10 * len(tiles), th), (14, 12, 11))
x = 0
for t in tiles:
    sheet.paste(t, (x, 0))
    x += t.width + 10
sheet.save(out)
