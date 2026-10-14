"""Render emblem designs (art_src/emblems/*.svg) as bevelled, engraved-metal icons.

Icons are neutral light grey with baked lighting so the game can tint them per use
(relic colours, intent colours, card types). Output: assets/art/icons/<name>.png
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
import svgparts  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "art_src", "emblems")
OUT = os.path.join(ROOT, "assets", "art", "icons")
SIZE = 192
SS = 3
PAD = 12
LIGHT = np.array([-0.5, -0.6, 0.62])


def mask_for(part, scale):
    img = Image.new("L", ((SIZE + 2 * PAD) * SS,) * 2, 0)
    d = ImageDraw.Draw(img)
    off = PAD * SS
    if part.stroke and part.stroke_width > 0:
        w = max(1, int(part.stroke_width * SS))
        for p in part.polys:
            pts = [(x * SS + off, y * SS + off) for x, y in p]
            if part.closed and len(pts) > 2:
                pts.append(pts[0])
            d.line(pts, fill=255, width=w, joint="curve")
            for q in (pts[0], pts[-1]):
                d.ellipse([q[0] - w / 2, q[1] - w / 2, q[0] + w / 2, q[1] + w / 2], fill=255)
    if part.fill:
        for p in part.polys:
            if len(p) > 2:
                d.polygon([(x * SS + off, y * SS + off) for x, y in p], fill=255)
    img = img.resize((SIZE + 2 * PAD,) * 2, Image.LANCZOS)
    return np.asarray(img, np.float32) / 255.0


def render(name):
    design = svgparts.load(os.path.join(SRC, f"{name}.svg"), SIZE / 64.0)
    N = SIZE + 2 * PAD
    raised = np.zeros((N, N), np.float32)
    liquid = np.zeros((N, N), np.float32)
    for part in design.parts:
        m = mask_for(part, SIZE / 64.0) * part.opacity
        col = (part.fill or part.stroke or "#fff").lower()
        if col in ("#000", "#000000"):
            raised = np.clip(raised - m, 0, 1)
        elif col.startswith("#c83a3a"):
            liquid = np.maximum(liquid, m)
        else:
            raised = np.maximum(raised, m)
    alpha = np.clip(raised + liquid, 0, 1)
    dist = ndimage.distance_transform_edt(raised > 0.5)
    h = 1 - (1 - np.clip(dist / 5.0, 0, 1)) ** 2
    rng = np.random.default_rng(len(name))
    h = ndimage.gaussian_filter(h + rng.random((N, N)) * 0.05, 1.0)
    gy, gx = np.gradient(h)
    n = np.dstack([-gx * 5, -gy * 5, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    ndl = np.clip(np.tensordot(n, LIGHT, axes=([2], [0])), 0, 1)
    half = (LIGHT + [0, 0, 1]) / np.linalg.norm(LIGHT + [0, 0, 1])
    spec = np.clip(np.tensordot(n, half, axes=([2], [0])), 0, 1) ** 30
    shade = 0.45 + 0.6 * ndl + 0.35 * spec
    grey = np.clip(shade * 0.82, 0, 1.2)
    rgb = np.dstack([grey, grey * 0.98, grey * 0.95])
    # Liquid (potion fill) stays white so the game can tint it separately via a second icon.
    rgb = np.where(liquid[..., None] > 0.5, np.array([1.0, 1.0, 1.0]) * (0.7 + 0.3 * ndl[..., None]), rgb)
    # Dark outline for legibility on busy art.
    outline = np.clip(ndimage.grey_dilation(alpha, size=(5, 5)) - alpha, 0, 1)
    out_a = np.clip(alpha + outline * 0.85, 0, 1)
    rgb = rgb * (alpha[..., None] / np.maximum(out_a[..., None], 1e-4))
    img = np.dstack([np.clip(rgb, 0, 1), out_a])
    Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(OUT, f"{name}.png"), optimize=True)
    if liquid.max() > 0:
        lq = np.dstack([np.ones_like(liquid), np.ones_like(liquid), np.ones_like(liquid), liquid])
        Image.fromarray((lq * 255).astype(np.uint8)).save(os.path.join(OUT, f"{name}_liquid.png"), optimize=True)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(SRC) if f.endswith(".svg"))
    for n in names:
        render(n)
    print(f"rendered {len(names)} icons")
