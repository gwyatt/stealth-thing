"""Draft Steam store capsules from the game's own art. Output: steam/store_art/

These are placeholders sized to Steamworks' current requirements; replace them
with commissioned key art before launch.
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "steam", "store_art")
SCENES = os.path.join(ROOT, "assets", "art", "scenes")
CRE = os.path.join(ROOT, "assets", "art", "creatures")
FONT = os.path.join(ROOT, "assets", "fonts", "cinzel-latin-400-normal.woff2")

SIZES = {
    "header_capsule": (920, 430),
    "small_capsule": (462, 174),
    "main_capsule": (1232, 706),
    "vertical_capsule": (748, 896),
    "library_capsule": (600, 900),
    "library_hero": (3840, 1240),
}


def cover(img, w, h, focus=(0.5, 0.5)):
    k = max(w / img.width, h / img.height)
    im = img.resize((int(img.width * k) + 1, int(img.height * k) + 1), Image.LANCZOS)
    x = int((im.width - w) * focus[0])
    y = int((im.height - h) * focus[1])
    return im.crop((x, y, x + w, y + h))


def creature(cid, height):
    im = Image.open(os.path.join(CRE, f"{cid}.png")).convert("RGBA")
    glow = Image.open(os.path.join(CRE, f"{cid}_glow.png")).convert("RGBA")
    k = height / im.height
    size = (int(im.width * k), height)
    im = im.resize(size, Image.LANCZOS)
    glow = glow.resize(size, Image.LANCZOS)
    a = np.asarray(im, np.float32)
    g = np.asarray(glow, np.float32)
    a[..., :3] = np.clip(a[..., :3] * 1.15 + g[..., :3] * (g[..., 3:4] / 255) * 0.9, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def vignette(img, strength=0.75):
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w * 0.6)) ** 2 + ((yy - h / 2) / (h * 0.62)) ** 2)
    k = 1 - np.clip(d - 0.55, 0, 1) * strength
    a = np.asarray(img.convert("RGB"), np.float32) * k[..., None]
    return Image.fromarray(a.astype(np.uint8))


def logo(img, size, y_frac=0.5, x_frac=0.5, sub=True):
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT, size)
    text = "EMBERDEEP"
    bw = d.textlength(text, font=f)
    x = img.width * x_frac - bw / 2
    y = img.height * y_frac - size * 0.6
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text((x, y + size * 0.05), text, font=f, fill=(0, 0, 0, 220))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(size * 0.12)))
    d.text((x, y), text, font=f, fill=(233, 225, 207, 255))
    if sub:
        fs = ImageFont.truetype(FONT, max(12, int(size * 0.22)))
        s = "THE LAST FLAME DESCENDS"
        sw = d.textlength(s, font=fs)
        d.text((img.width * x_frac - sw / 2, y + size * 1.15), s, font=fs, fill=(214, 180, 122, 255))


def make(name, w, h):
    bg = Image.open(os.path.join(SCENES, "throne_far.png")).convert("RGBA")
    mid = Image.open(os.path.join(SCENES, "throne_mid.png")).convert("RGBA")
    bg.alpha_composite(mid)
    tall = h > w
    img = cover(bg, w, h, (0.5, 0.45)).convert("RGBA")
    img = vignette(img, 0.6).convert("RGBA")
    if name != "small_capsule":
        boss = creature("ember_tyrant", int(h * (0.62 if tall else 0.78)))
        hero = creature("player", int(h * (0.5 if tall else 0.62)))
        bx = int(w * (0.5 if tall else 0.7) - boss.width / 2)
        img.alpha_composite(boss, (bx, int(h * (0.18 if tall else 0.12))))
        hx = int(w * (0.28 if tall else 0.2) - hero.width / 2)
        img.alpha_composite(hero, (hx, h - hero.height - int(h * 0.04)))
    if name != "library_hero":
        if tall:
            logo(img, int(w * 0.13), 0.12)
        elif name == "small_capsule":
            logo(img, int(h * 0.36), 0.42, sub=False)
        else:
            logo(img, int(h * 0.15), 0.18, 0.36)
    img.convert("RGB").save(os.path.join(OUT, f"{name}.png"))


def library_logo():
    img = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    logo(img, 190, 0.45)
    img.save(os.path.join(OUT, "library_logo.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for n, (w, h) in SIZES.items():
        make(n, w, h)
    library_logo()
    print("capsules written to", OUT)
