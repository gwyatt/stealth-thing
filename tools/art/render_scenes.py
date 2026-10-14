"""Paint the background scenes as parallax layers (far / mid / near).

Output: assets/art/scenes/<scene>_<layer>.png at 2560x1440. Layers other than
`far` are transparent. Godot adds fog, particles and light on top.
Usage: python3 tools/art/render_scenes.py [scene ...]
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "art", "scenes")
W, H = 2560, 1440
SS = 2


# ───────────── tools ─────────────
def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


class Layer:
    def __init__(self, opaque=False, color="#000000"):
        self.c = np.zeros((H, W, 3), np.float32)
        self.a = np.zeros((H, W), np.float32)
        if opaque:
            self.c[:] = rgb(color)
            self.a[:] = 1

    def paint(self, mask, color, opacity=1.0):
        m = (mask * opacity)[..., None]
        col = color if np.ndim(color) == 3 else np.broadcast_to(rgb(color) if isinstance(color, str) else color, (H, W, 3))
        self.c = self.c * (1 - m) + col * m
        self.a = np.maximum(self.a, m[..., 0]) if True else self.a

    def add(self, mask, color, strength=1.0):
        col = rgb(color) if isinstance(color, str) else color
        self.c = self.c + (mask * strength)[..., None] * col
        self.a = np.maximum(self.a, np.clip(mask * strength, 0, 1))

    def save(self, name):
        img = np.dstack([np.clip(self.c, 0, 1), np.clip(self.a, 0, 1)])
        Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(OUT, name + ".png"), optimize=True)


def poly(points_list, blur=0.0):
    img = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(img)
    for pts in points_list:
        d.polygon([(x * SS, y * SS) for x, y in pts], fill=255)
    m = np.asarray(img.resize((W, H), Image.LANCZOS), np.float32) / 255
    return ndimage.gaussian_filter(m, blur) if blur else m


def ellipse(cx, cy, rx, ry, blur=0.0):
    yy, xx = np.ogrid[0:H, 0:W]
    m = np.clip(1.5 - np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) * 1.5, 0, 1).astype(np.float32)
    m = (m > 0.5).astype(np.float32) if not blur else m
    return ndimage.gaussian_filter(m, blur) if blur else m


def radial(cx, cy, r, power=2.0):
    yy, xx = np.ogrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    return (np.clip(1 - d, 0, 1) ** power).astype(np.float32)


def vgrad(c0, c1, y0=0, y1=H):
    t = np.clip((np.arange(H, dtype=np.float32) - y0) / max(1, y1 - y0), 0, 1)[:, None, None]
    return np.broadcast_to(rgb(c0) * (1 - t) + rgb(c1) * t, (H, W, 3)).copy()


def noise(cell, rng, octaves=5):
    out = np.zeros((H, W), np.float32)
    amp, tot = 1.0, 0.0
    for _ in range(octaves):
        gh, gw = H // cell + 3, W // cell + 3
        g = (rng.random((gh, gw)) * 255).astype(np.uint8)
        out += np.asarray(Image.fromarray(g).resize((gw * cell, gh * cell), Image.BICUBIC), np.float32)[:H, :W] / 255 * amp
        tot += amp
        amp *= 0.5
        cell = max(2, cell // 2)
    return out / tot


def arch(x, y, w, h, n=40):
    """Pointed gothic arch outline, (x, y) bottom-left."""
    top = y - h
    pts = [(x, y), (x, top + w * 0.55)]
    for i in range(n + 1):
        t = i / n
        a = math.pi * (1 - t)
        # Two circle segments meeting at a point.
        if t <= 0.5:
            cx, r = x + w, w
            ang = math.pi - (t * 2) * (math.pi / 3)
            pts.append((cx + r * math.cos(ang), top + w * 0.55 - r * math.sin(ang) * 0.95 + 0))
        else:
            cx, r = x, w
            ang = (math.pi / 3) * (1 - (t - 0.5) * 2)
            pts.append((cx + r * math.cos(ang), top + w * 0.55 - r * math.sin(ang) * 0.95))
    pts += [(x + w, top + w * 0.55), (x + w, y)]
    return pts


def stone(rng, base, var=0.35, bricks=True, brick_h=46, brick_w=110):
    n = noise(160, rng) * 0.6 + noise(12, rng, 3) * 0.4
    tex = 1 - var + var * 2 * n
    if bricks:
        yy, xx = np.mgrid[0:H, 0:W]
        row = yy // brick_h
        off = (row % 2) * brick_w // 2
        mortar = ((yy % brick_h) < 3) | (((xx + off) % brick_w) < 3)
        brick_id = (row * 977 + (xx + off) // brick_w) % 4096
        lut = 0.72 + 0.5 * rng.random(4096).astype(np.float32)
        tex = tex * lut[brick_id] * np.where(mortar, 0.45, 1.0)
        # Chipped edges and grime running down from the mortar.
        grime = ndimage.uniform_filter(mortar.astype(np.float32), size=(18, 1))
        tex *= 1 - grime * 0.35
    return np.broadcast_to(rgb(base), (H, W, 3)) * tex[..., None]


def fog_band(rng, y, thickness, strength):
    n = noise(220, rng, 4)
    yy = np.arange(H, dtype=np.float32)[:, None]
    band = np.exp(-((yy - y) / thickness) ** 2)
    return np.clip(band * (0.35 + n) * strength, 0, 1)


def vignette(layer, strength=0.75):
    yy, xx = np.ogrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.45) / (H * 0.7)) ** 2)
    layer.c *= (1 - np.clip(d - 0.55, 0, 1) * strength)[..., None]


def motes(layer, rng, n, color, y0=0, y1=H, size=2.5, glow=True):
    m = np.zeros((H, W), np.float32)
    for _ in range(n):
        x, y = int(rng.random() * W), int(y0 + rng.random() * (y1 - y0))
        r = 0.6 + rng.random() * size
        m += ellipse(x, y, r, r) * (0.3 + rng.random() * 0.7) if False else 0
        m[max(0, y - 1):y + 2, max(0, x - 1):x + 2] += 0.4 + rng.random() * 0.6
    m = ndimage.gaussian_filter(m, 1.2)
    layer.add(np.clip(m * 3, 0, 1), color, 1.0)


# ───────────── Act 1: The Sunken Crypt ─────────────
def crypt():
    rng = np.random.default_rng(3)
    far = Layer(opaque=True)
    far.c = vgrad("#06080b", "#0c1216", 0, 900)
    wall = stone(rng, "#1a2125", 0.35)
    wall *= vgrad("#5a6066", "#c8ccd0", 0, 980) * 0.75
    far.paint(poly([[(0, 0), (W, 0), (W, 980), (0, 980)]]), wall * 0.8)
    windows = [(560, 170, 820), (960, 170, 860), (1430, 170, 860), (1830, 170, 820)]
    light = np.zeros((H, W), np.float32)
    for x, w, h in windows:
        frame = poly([arch(x - 14, 960, w + 28, h + 20)])
        far.paint(frame, "#05080a")
        glass = poly([arch(x, 950, w, h)])
        g = vgrad("#7f9fb4", "#1d2f3a", 950 - h, 950)
        g *= (0.75 + 0.45 * noise(30, rng, 3))[..., None]
        far.paint(glass, g, 0.8)
        far.paint(poly([[(x + w / 2 - 6, 950 - h + 10), (x + w / 2 + 6, 950 - h + 10), (x + w / 2 + 6, 950), (x + w / 2 - 6, 950)],
                        [(x, 950 - h * 0.45), (x + w, 950 - h * 0.45), (x + w, 950 - h * 0.45 + 10), (x, 950 - h * 0.45 + 10)]]), "#05080a")
        light += glass
        shaft = poly([[(x + 10, 950 - h + 80), (x + w - 10, 950 - h + 80), (x + w + 360, H), (x + 60, H)]], blur=40)
        far.add(shaft, "#9fc4d8", 0.16)
    far.add(ndimage.gaussian_filter(light, 50), "#7fa8c0", 0.35)
    # Flooded floor with reflections.
    floor = poly([[(0, 980), (W, 980), (W, H), (0, H)]])
    far.paint(floor, vgrad("#121c22", "#030506", 980, H))
    refl = np.flipud(np.roll(light, -2 * 980 + H, axis=0))
    refl = np.roll(np.flipud(light), 2 * 980 - H, axis=0)
    yy = np.arange(H)[:, None]
    ripple = (np.sin(yy * 0.35) * 6).astype(int)
    refl = np.array([np.roll(refl[i], ripple[i, 0]) for i in range(H)])
    far.add(ndimage.gaussian_filter(refl, 6) * floor * np.clip((yy - 980) / 400, 0, 1)[..., 0:1].squeeze()[:, None] * 0 + ndimage.gaussian_filter(refl, 6) * floor, "#8fb4c8", 0.12)
    for _ in range(80):
        y = 1000 + rng.random() * 420
        x = rng.random() * W
        far.add(poly([[(x, y), (x + 60 + rng.random() * 200, y), (x + 60 + rng.random() * 200, y + 2), (x, y + 2)]], blur=1), "#a0c4d8", 0.06 + rng.random() * 0.08)
    far.add(fog_band(rng, 990, 90, 0.5), "#7f9aa8", 0.35)
    vignette(far)
    far.save("crypt_far")

    mid = Layer()
    for x in (250, 2160):
        col = poly([[(x, 0), (x + 150, 0), (x + 150, 1000), (x, 1000)]])
        shade = stone(rng, "#151b1e", 0.3, brick_h=60, brick_w=150)
        xs = np.linspace(0, 1, W)[None, :, None]
        mid.paint(col, shade * (0.6 + 0.6 * np.clip(1 - np.abs(xs - (x + 40) / W) * 30, 0, 1)))
        mid.paint(poly([[(x - 30, 960), (x + 180, 960), (x + 180, 1010), (x - 30, 1010)]]), "#0b0f11")
    for x in (700, 1200, 1700):
        ln = 260 + rng.random() * 200
        for k in range(int(ln / 22)):
            mid.paint(ellipse(x, k * 22 + 8, 6, 11, blur=1), "#0a0c0d")
    for cx, n in ((430, 3), (2110, 4)):
        for k in range(n):
            x = cx + k * 26
            h = 40 + rng.random() * 50
            mid.paint(poly([[(x - 8, 1000 - h), (x + 8, 1000 - h), (x + 8, 1000), (x - 8, 1000)]]), "#bfb39a")
            mid.add(radial(x, 1000 - h - 14, 70, 2), "#ffb050", 0.6)
            mid.add(ellipse(x, 1000 - h - 14, 5, 12, blur=2), "#fff0c0", 1.0)
    motes(mid, rng, 160, "#cfe9ff", 0, 1000)
    mid.save("crypt_mid")

    near = Layer()
    for x0, x1 in ((-60, 200), (2360, 2620)):
        col = poly([[(x0, 0), (x1, 0), (x1, H), (x0, H)]])
        near.paint(col, stone(rng, "#0b0e10", 0.3, brick_h=80, brick_w=200))
    near.paint(poly([[(0, 0), (W, 0), (W, 70), (0, 70)]], blur=30), "#000000", 0.9)
    near.save("crypt_near")


# ───────────── Act 2: The Fungal Warrens ─────────────
def mushroom(layer, x, base, s, glow_col, rng, dark="#141a14"):
    stem = poly([[(x - 18 * s, base), (x - 10 * s, base - 160 * s), (x + 10 * s, base - 160 * s), (x + 20 * s, base)]])
    layer.paint(stem, "#2e2f24")
    cap = poly([[(x - 150 * s + 300 * s * t, base - 150 * s - math.sin(t * math.pi) * 120 * s) for t in np.linspace(0, 1, 40)]
                + [(x + 150 * s, base - 150 * s), (x - 150 * s, base - 150 * s)]])
    yy = np.arange(H, dtype=np.float32)[:, None, None]
    shade = np.clip((yy - (base - 270 * s)) / (130 * s), 0, 1)
    capcol = rgb("#2a2f26") * (1 - shade) * 0.6 + (rgb(dark) * 0.5 + glow_col * 0.35) * shade
    layer.paint(cap, np.broadcast_to(capcol, (H, W, 3)) * (0.8 + 0.4 * noise(20, rng, 3))[..., None])
    gills = poly([[(x - 145 * s, base - 150 * s), (x + 145 * s, base - 150 * s), (x + 120 * s, base - 132 * s), (x - 120 * s, base - 132 * s)]])
    layer.paint(gills, glow_col, 0.85)
    layer.add(radial(x, base - 140 * s, 300 * s, 2.2), glow_col, 0.45)
    for _ in range(6):
        px = x + (rng.random() - 0.5) * 220 * s
        py = base - 190 * s - rng.random() * 60 * s
        layer.add(ellipse(px, py, 8 * s, 6 * s, blur=2), glow_col, 0.5)


def warrens():
    rng = np.random.default_rng(9)
    far = Layer(opaque=True)
    far.c = vgrad("#030504", "#0c140e", 0, 1100)
    wall_y = [500 + math.sin(i * 0.7) * 80 + rng.random() * 60 for i in range(40)]
    wall = poly([[(0, H)] + [(i * W / 39, wall_y[i]) for i in range(40)] + [(W, H)]])
    far.paint(wall, stone(rng, "#151d16", 0.45, bricks=False))
    mushroom(far, 620, 1000, 1.1, rgb("#6fe0c0"), rng)
    mushroom(far, 1820, 980, 1.4, rgb("#c88cff"), rng)
    mushroom(far, 1240, 1030, 0.6, rgb("#6fe0c0"), rng)
    far.add(fog_band(rng, 900, 160, 0.6), "#6fe0c0", 0.12)
    floor = poly([[(0, 1040)] + [(i * W / 30, 1020 + rng.random() * 40) for i in range(31)] + [(W, H), (0, H)]])
    far.paint(floor, stone(rng, "#0b100b", 0.4, bricks=False))
    for _ in range(40):
        x, y = rng.random() * W, 1060 + rng.random() * 360
        far.add(ellipse(x, y, 20 + rng.random() * 40, 4 + rng.random() * 6, blur=3), "#6fe0c0" if rng.random() > 0.5 else "#c88cff", 0.25)
    vignette(far)
    far.save("warrens_far")

    mid = Layer()
    x = 0
    while x < W:
        h = 120 + rng.random() * 320
        w = 40 + rng.random() * 70
        mid.paint(poly([[(x, 0), (x + w / 2, h), (x + w, 0)]]), stone(rng, "#0a0d0a", 0.4, bricks=False))
        x += w + rng.random() * 120
    for _ in range(18):
        rx = rng.random() * W
        ln = 200 + rng.random() * 420
        pts = [(rx + math.sin(t * 5 + rx) * 26, t * ln) for t in np.linspace(0, 1, 30)]
        w = 3 + rng.random() * 6
        mid.paint(poly([[(px - w, py) for px, py in pts] + [(px + w, py) for px, py in reversed(pts)]]), "#0c0e09")
    motes(mid, rng, 220, "#d8ffe8", 0, 1100)
    motes(mid, rng, 100, "#e7c8ff", 0, 1100)
    mid.save("warrens_mid")

    near = Layer()
    mushroom(near, 130, 1500, 2.0, rgb("#c88cff"), rng, dark="#070907")
    mushroom(near, 2450, 1520, 1.8, rgb("#6fe0c0"), rng, dark="#070907")
    near.paint(poly([[(0, 1300), (500, 1340), (700, H), (0, H)], [(1900, H), (2100, 1330), (W, 1290), (W, H)]]), "#050705")
    near.save("warrens_near")


# ───────────── Act 3: The Ember Throne ─────────────
def throne():
    rng = np.random.default_rng(21)
    far = Layer(opaque=True)
    far.c = vgrad("#050202", "#9a300e", 0, 1000)
    far.c = far.c * 0.6 + vgrad("#050202", "#2a0905", 0, 700) * 0.4
    smoke = noise(260, rng, 5)
    far.c *= (0.65 + 0.5 * smoke)[..., None]
    for x, w, h in ((200, 380, 900), (680, 420, 980), (1460, 420, 980), (1980, 380, 900)):
        outer = poly([arch(x - 50, 1000, w + 100, h + 60)])
        inner = poly([arch(x, 1000, w, h)])
        far.paint(np.clip(outer - inner, 0, 1), stone(rng, "#160e0c", 0.35, brick_h=70, brick_w=160))
    cx = W / 2
    far.add(radial(cx, 760, 520, 1.6), "#ff6a1a", 0.35)
    steps = [[(cx - 330 + i * 40, 1000 - i * 34), (cx + 330 - i * 40, 1000 - i * 34), (cx + 330 - i * 40, 1034 - i * 34), (cx - 330 + i * 40, 1034 - i * 34)] for i in range(6)]
    far.paint(poly(steps), "#0a0504")
    far.paint(poly([[(cx - 110, 800), (cx - 110, 520), (cx - 70, 580), (cx - 40, 430), (cx, 540), (cx + 40, 430), (cx + 70, 580), (cx + 110, 520), (cx + 110, 800)]]), "#080404")
    floor = poly([[(0, 1000), (W, 1000), (W, H), (0, H)]])
    far.paint(floor, stone(rng, "#0d0606", 0.35, brick_h=90, brick_w=220))
    # Glowing cracks: ridges of a noise field, confined to the floor.
    n1 = noise(140, rng, 5)
    ridges = np.clip(1 - np.abs(n1 - 0.5) * 26, 0, 1)
    yy = np.arange(H, dtype=np.float32)[:, None]
    lava = ridges * np.clip((yy - 1010) / 120, 0, 1)
    lava = np.clip(lava, 0, 1)
    far.add(ndimage.gaussian_filter(lava, 14), "#ff4a0a", 1.4)
    far.add(lava, "#ffb040", 0.8)
    far.add(fog_band(rng, 1000, 90, 0.6), "#ff6a1a", 0.18)
    vignette(far, 0.6)
    far.save("throne_far")

    mid = Layer()
    for x in (140, 2280):
        p = poly([[(x, H), (x, 260 + rng.random() * 100), (x + 70, 200), (x + 140, 290), (x + 140, H)]])
        mid.paint(p, stone(rng, "#120a09", 0.35, brick_h=70, brick_w=140))
    motes(mid, rng, 300, "#ffb347", 0, H)
    motes(mid, rng, 80, "#bdb5ab", 0, H)
    mid.save("throne_mid")

    near = Layer()
    for x0, x1 in ((-60, 160), (2400, 2620)):
        near.paint(poly([[(x0, 0), (x1, 0), (x1, H), (x0, H)]]), stone(rng, "#0a0505", 0.3, brick_h=90, brick_w=220))
    near.add(ndimage.gaussian_filter(poly([[(0, 1380), (W, 1380), (W, H), (0, H)]]), 40), "#ff5a10", 0.25)
    near.save("throne_near")


# ───────────── Title vista ─────────────
def title():
    rng = np.random.default_rng(5)
    far = Layer(opaque=True)
    far.c = vgrad("#030407", "#1c2129", 0, 1000)
    far.c = far.c * (0.85 + 0.25 * noise(300, rng, 4))[..., None]
    for _ in range(500):
        x, y = rng.random() * W, rng.random() * 800
        far.add(ellipse(x, y, 1.2, 1.2, blur=0.6), "#dfe6ff", 0.2 + rng.random() * 0.6)
    far.add(radial(1880, 330, 520, 2), "#c8cede", 0.25)
    far.paint(ellipse(1880, 330, 140, 140, blur=2), "#e8e2d0", 0.95)
    far.c *= (1 - 0.15 * noise(40, rng, 3)[..., None] * ellipse(1880, 330, 140, 140, blur=2)[..., None])
    rock = poly([[(1240, H), (1300, 1100), (1380, 1030), (1420, 950), (1520, 905), (1600, 920), (1700, 860), (1820, 880), (1940, 845), (2080, 880), (2180, 860), (2280, 950), (2360, 1030), (2440, 1120), (2500, H)]])
    far.paint(rock, stone(rng, "#0b0d11", 0.4, bricks=False))
    for x, top, w in ((1500, 330, 60), (1640, 180, 90), (1820, 120, 70), (1960, 260, 100), (2120, 400, 55)):
        sp = poly([[(x, 1000), (x, top + 90), (x + w / 2, top), (x + w, top + 90), (x + w, 1000)]])
        far.paint(sp, vgrad("#232831", "#0a0b0e", top, 1000))
        for k in range(3):
            wy = top + 160 + k * 170
            if rng.random() > 0.35:
                far.add(poly([[(x + w * 0.4, wy), (x + w * 0.6, wy), (x + w * 0.6, wy + w * 0.5), (x + w * 0.4, wy + w * 0.5)]]), "#ffb347", 0.55)
    far.add(fog_band(rng, 1040, 120, 0.9), "#8a90a0", 0.3)
    cliff = poly([[(0, H), (0, 1150), (220, 1125), (420, 1140), (560, 1118), (720, 1150), (820, 1200), (900, 1300), (960, H)]])
    far.paint(cliff, stone(rng, "#07080a", 0.4, bricks=False))
    tree = [(170, 1130), (166, 1040), (150, 980), (162, 960), (172, 1010), (178, 960), (196, 930), (186, 1000), (182, 1130)]
    far.paint(poly([tree]), "#07080a")
    # The Lanternkeeper on the cliff edge.
    fx, fy = 760, 1170
    far.add(radial(fx + 22, fy - 34, 160, 2), "#ffb347", 0.55)
    far.paint(poly([[(fx - 8, fy), (fx - 14, fy - 58), (fx - 10, fy - 80), (fx + 4, fy - 88), (fx + 14, fy - 70), (fx + 14, fy)]]), "#040404")
    far.add(poly([[(fx + 20, fy - 40), (fx + 30, fy - 40), (fx + 30, fy - 26), (fx + 20, fy - 26)]]), "#ffcf7a", 1.0)
    far.add(fog_band(rng, 1360, 120, 0.8), "#2a1a14", 0.4)
    vignette(far, 0.7)
    far.save("title_far")


# ───────────── Campfire ─────────────
def campfire():
    rng = np.random.default_rng(13)
    far = Layer(opaque=True)
    far.c = vgrad("#0a0605", "#140b07", 0, H)
    wall = stone(rng, "#1e140f", 0.4, brick_h=70, brick_w=170)
    far.paint(poly([[(0, 0), (W, 0), (W, 1040), (0, 1040)]]), wall)
    for x in (420, 1840):
        far.paint(poly([arch(x, 1040, 320, 640)]), "#060403")
    far.paint(poly([[(0, 1040), (W, 1040), (W, H), (0, H)]]), stone(rng, "#120c09", 0.4, bricks=False))
    cx, cy = W / 2, 1160
    far.c *= (0.35 + 1.2 * radial(cx, cy - 120, 1300, 1.3))[..., None]
    far.add(radial(cx, cy - 80, 700, 2.2), "#ff8a3a", 0.35)
    for i in range(16):
        a = i / 16 * math.tau
        x, y = cx + math.cos(a) * 230, cy + 30 + math.sin(a) * 55
        far.paint(ellipse(x, y, 32, 20, blur=1), "#4a3428" if math.sin(a) > 0 or math.cos(a) < 0 else "#2a1d16")
    far.paint(ellipse(cx, cy + 20, 190, 46, blur=3), "#3a2d26")
    for x0, y0, x1, y1 in ((cx - 90, cy + 10, cx - 40, cy - 6), (cx + 30, cy - 2, cx + 90, cy + 14), (cx - 20, cy + 22, cx + 30, cy + 16)):
        far.paint(poly([[(x0, y0 - 5), (x1, y1 - 5), (x1, y1 + 5), (x0, y0 + 5)]], blur=1), "#bfb39a", 0.9)
    blade = poly([[(cx - 9, cy), (cx - 7, cy - 330), (cx, cy - 372), (cx + 7, cy - 330), (cx + 9, cy)]])
    xs = np.linspace(-1, 1, W)[None, :]
    far.paint(blade, np.broadcast_to(rgb("#8d8270"), (H, W, 3)) * (0.7 + 0.5 * np.clip(-xs * 40 + 0.5, 0, 1))[..., None])
    far.paint(poly([[(cx - 50, cy - 8), (cx + 50, cy - 8), (cx + 50, cy + 6), (cx - 50, cy + 6)]]), "#2a1d12")
    vignette(far, 0.8)
    far.save("campfire_far")


# ───────────── Map vellum ─────────────
def vellum():
    rng = np.random.default_rng(4)
    far = Layer(opaque=True)
    n = noise(200, rng, 6)
    stains = noise(90, rng, 4)
    base = rgb("#2a2018")
    far.c = np.broadcast_to(base, (H, W, 3)) * (0.75 + 0.3 * n)[..., None]
    far.c *= (1 - np.clip((stains - 0.6) * 1.2, 0, 0.18))[..., None]
    fibers = ndimage.uniform_filter(rng.random((H, W)).astype(np.float32), size=(1, 30))
    far.c *= (0.9 + 0.2 * fibers)[..., None]
    burn = 1 - np.clip(radial(W / 2, H / 2, W * 0.75, 1.0) * 1.6, 0, 1)
    far.c *= (1 - burn * 0.85)[..., None]
    far.save("vellum_far")


SCENES = {"crypt": crypt, "warrens": warrens, "throne": throne, "title": title, "campfire": campfire, "vellum": vellum}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name in sys.argv[1:] or SCENES:
        SCENES[name]()
        print("painted", name)
