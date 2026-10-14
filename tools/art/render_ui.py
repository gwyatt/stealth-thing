"""Paint UI textures: card frames, cost gem, panel 9-slice, map node disc.

Output: assets/art/ui/*.png
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "art", "ui")
LIGHT = np.array([-0.5, -0.65, 0.58])

TYPE_TINT = {
    "attack": (0.42, 0.11, 0.08),
    "skill": (0.11, 0.19, 0.25),
    "power": (0.36, 0.27, 0.09),
    "status": (0.2, 0.19, 0.17),
    "curse": (0.22, 0.11, 0.28),
}


def noise(h, w, cell, rng, octaves=4):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for _ in range(octaves):
        gh, gw = h // cell + 3, w // cell + 3
        g = (rng.random((gh, gw)) * 255).astype(np.uint8)
        out += np.asarray(Image.fromarray(g).resize((gw * cell, gh * cell), Image.BICUBIC), np.float32)[:h, :w] / 255 * amp
        tot += amp
        amp *= 0.5
        cell = max(2, cell // 2)
    return out / tot


def rect_mask(h, w, x0, y0, x1, y1, r=0):
    img = Image.new("L", (w * 2, h * 2), 0)
    ImageDraw.Draw(img).rounded_rectangle([x0 * 2, y0 * 2, x1 * 2, y1 * 2], radius=r * 2, fill=255)
    return np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255


def bevel_shade(mask, width, strength=1.0):
    d = ndimage.distance_transform_edt(mask > 0.5)
    hgt = np.clip(d / width, 0, 1)
    hgt = ndimage.gaussian_filter(hgt, 1.0)
    gy, gx = np.gradient(hgt)
    n = np.dstack([-gx * width * strength, -gy * width * strength, np.ones_like(hgt)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    ndl = np.clip(np.tensordot(n, LIGHT, axes=([2], [0])), 0, 1)
    half = (LIGHT + [0, 0, 1]) / np.linalg.norm(LIGHT + [0, 0, 1])
    spec = np.clip(np.tensordot(n, half, axes=([2], [0])), 0, 1) ** 28
    return ndl, spec


def metal(h, w, rng, base=(0.55, 0.42, 0.25)):
    n = noise(h, w, 24, rng)
    streak = ndimage.uniform_filter(rng.random((h, w)).astype(np.float32), size=(1, 24))
    return np.array(base)[None, None] * (0.65 + 0.35 * n + 0.2 * streak)[..., None]


def save(arr, name):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, name), optimize=True)


def card_frame(kind, rng):
    W, H = 440, 620
    img = np.zeros((H, W, 4), np.float32)
    body = rect_mask(H, W, 4, 4, W - 4, H - 4, 22)
    tint = np.array(TYPE_TINT[kind])
    stone = (0.08 + 0.06 * noise(H, W, 40, rng))[..., None] * np.array([1.0, 0.92, 0.85])
    stone = stone * 0.7 + tint * 0.12
    img[..., :3] = stone
    img[..., 3] = body
    # Bronze border.
    inner = rect_mask(H, W, 20, 20, W - 20, H - 20, 14)
    border = np.clip(body - inner, 0, 1)
    ndl, spec = bevel_shade(border, 8, 1.2)
    m = metal(H, W, rng)
    bcol = m * (0.35 + 0.95 * ndl)[..., None] + spec[..., None] * 0.6
    img[..., :3] = img[..., :3] * (1 - border[..., None]) + bcol * border[..., None]
    # Thin inner gilt line.
    line = np.clip(rect_mask(H, W, 26, 26, W - 26, H - 26, 10) - rect_mask(H, W, 28, 28, W - 28, H - 28, 10), 0, 1)
    img[..., :3] = img[..., :3] * (1 - line[..., None]) + np.array([0.6, 0.47, 0.28]) * line[..., None]
    # Name plate.
    plate = rect_mask(H, W, 40, 30, W - 40, 80, 8)
    ndl, spec = bevel_shade(plate, 6, 0.8)
    pcol = (np.array([0.1, 0.085, 0.07]) + tint * 0.25)[None, None] * (0.6 + 0.6 * ndl)[..., None]
    img[..., :3] = img[..., :3] * (1 - plate[..., None]) + pcol * plate[..., None]
    # Art window (recessed, type-coloured glow).
    win = rect_mask(H, W, 38, 92, W - 38, 318, 6)
    yy, xx = np.mgrid[0:H, 0:W]
    rad = np.clip(1 - np.sqrt(((xx - W / 2) / 190) ** 2 + ((yy - 215) / 130) ** 2), 0, 1)
    wcol = (tint[None, None] * (0.25 + 1.4 * rad[..., None] ** 1.5)) * (0.75 + 0.4 * noise(H, W, 18, rng))[..., None]
    shadow = ndimage.gaussian_filter(1 - win, 6) * win
    wcol *= (1 - shadow * 1.6)[..., None]
    img[..., :3] = img[..., :3] * (1 - win[..., None]) + wcol * win[..., None]
    frame = np.clip(rect_mask(H, W, 34, 88, W - 34, 322, 8) - win, 0, 1)
    ndl, _ = bevel_shade(frame, 3, 1.0)
    img[..., :3] = img[..., :3] * (1 - frame[..., None]) + (np.array([0.45, 0.35, 0.2]) * (0.4 + ndl[..., None] * 0.9)) * frame[..., None]
    # Text panel.
    txt = rect_mask(H, W, 44, 360, W - 44, H - 40, 10)
    tcol = np.array([0.075, 0.065, 0.055]) * (0.8 + 0.4 * noise(H, W, 30, rng))[..., None]
    img[..., :3] = img[..., :3] * (1 - txt[..., None] * 0.9) + tcol * txt[..., None] * 0.9
    # Type ribbon.
    rib = rect_mask(H, W, 150, 322, W - 150, 352, 4)
    ndl, spec = bevel_shade(rib, 4, 0.8)
    rcol = (tint * 1.2)[None, None] * (0.5 + 0.7 * ndl)[..., None]
    img[..., :3] = img[..., :3] * (1 - rib[..., None]) + rcol * rib[..., None]
    save(img, f"card_{kind}.png")


def cost_gem(rng):
    S = 120
    yy, xx = np.mgrid[0:S, 0:S]
    d = np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2)
    outer = np.clip(S / 2 - 2 - d, 0, 1)
    inner = np.clip(S / 2 - 14 - d, 0, 1)
    ring = np.clip(outer - inner, 0, 1)
    img = np.zeros((S, S, 4), np.float32)
    ndl, spec = bevel_shade(ring, 6, 1.2)
    img[..., :3] = metal(S, S, rng) * (0.4 + 0.9 * ndl)[..., None] + spec[..., None] * 0.6
    core = np.clip(1 - d / (S / 2 - 12), 0, 1)
    ccol = np.array([1.0, 0.75, 0.4]) * core[..., None] ** 1.4 * 0.9 + np.array([0.25, 0.06, 0.02]) * (1 - core[..., None])
    img[..., :3] = img[..., :3] * (1 - inner[..., None]) + ccol * inner[..., None]
    img[..., 3] = outer
    save(img, "cost_gem.png")


def panel(rng):
    S = 192
    img = np.zeros((S, S, 4), np.float32)
    body = rect_mask(S, S, 2, 2, S - 2, S - 2, 10)
    img[..., :3] = (0.05 + 0.035 * noise(S, S, 20, rng))[..., None] * np.array([1.0, 0.9, 0.8])
    inner = rect_mask(S, S, 14, 14, S - 14, S - 14, 6)
    border = np.clip(body - inner, 0, 1)
    ndl, spec = bevel_shade(border, 6, 1.1)
    img[..., :3] = img[..., :3] * (1 - border[..., None]) + (metal(S, S, rng, (0.32, 0.27, 0.2)) * (0.35 + 0.9 * ndl)[..., None] + spec[..., None] * 0.35) * border[..., None]
    line = np.clip(rect_mask(S, S, 19, 19, S - 19, S - 19, 4) - rect_mask(S, S, 21, 21, S - 21, S - 21, 4), 0, 1)
    img[..., :3] = img[..., :3] * (1 - line[..., None]) + np.array([0.5, 0.4, 0.26]) * line[..., None] * 0.8
    img[..., 3] = body * 0.94
    save(img, "panel.png")


def node_disc(rng):
    S = 128
    yy, xx = np.mgrid[0:S, 0:S]
    d = np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2)
    disc = np.clip(S / 2 - 3 - d, 0, 1)
    ndl, spec = bevel_shade(disc, 10, 1.3)
    img = np.zeros((S, S, 4), np.float32)
    img[..., :3] = (np.array([0.12, 0.1, 0.08]) * (0.7 + 0.5 * noise(S, S, 12, rng))[..., None]) * (0.45 + 0.8 * ndl)[..., None] + spec[..., None] * 0.15
    ring = np.clip(disc - np.clip(S / 2 - 8 - d, 0, 1), 0, 1)
    img[..., :3] = img[..., :3] * (1 - ring[..., None]) + np.array([0.5, 0.4, 0.26]) * (0.5 + ndl[..., None]) * ring[..., None]
    img[..., 3] = disc
    save(img, "node_disc.png")


def icon_app():
    """Application / Steam library icon: a lantern ember on black."""
    rng = np.random.default_rng(1)
    S = 512
    yy, xx = np.mgrid[0:S, 0:S]
    d = np.sqrt((xx - S / 2) ** 2 + (yy - S * 0.55) ** 2) / (S / 2)
    img = np.zeros((S, S, 4), np.float32)
    img[..., :3] = np.array([0.03, 0.025, 0.02])
    glow = np.clip(1 - d, 0, 1) ** 2.2
    img[..., :3] += np.array([1.0, 0.55, 0.2])[None, None] * glow[..., None] * 0.9
    lantern = Image.open(os.path.join(ROOT, "assets", "art", "icons", "lantern.png")).convert("RGBA").resize((300, 300), Image.LANCZOS)
    li = np.asarray(lantern, np.float32) / 255
    y0, x0 = 120, 106
    a = li[..., 3:4]
    tinted = li[..., :3] * np.array([0.25, 0.2, 0.16])
    img[y0:y0 + 300, x0:x0 + 300, :3] = img[y0:y0 + 300, x0:x0 + 300, :3] * (1 - a) + tinted * a
    img[..., 3] = np.clip(1 - np.clip((np.maximum(np.abs(xx - S / 2), np.abs(yy - S / 2)) - (S / 2 - 40)) / 40, 0, 1) * 0, 0, 1)
    mask = rect_mask(S, S, 8, 8, S - 8, S - 8, 90)
    img[..., 3] = mask
    save(img, "icon.png")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(7)
    for k in TYPE_TINT:
        card_frame(k, rng)
    cost_gem(rng)
    panel(rng)
    node_disc(rng)
    icon_app()
    print("ui textures done")
