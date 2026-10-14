"""Render character designs (art_src/creatures/*.svg) into game sprites.

For every creature this writes, into assets/art/creatures/:
  <id>.png       colour with baked form lighting, texture and ambient occlusion
  <id>_n.png     normal map (for Godot's 2D lights; green = up)
  <id>_glow.png  emissive layer (eyes, fire, lantern glass), added on top unlit

Usage: python3 tools/art/render_creatures.py [ids...]
"""
import colorsys
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
import svgparts  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "art_src", "creatures")
OUT = os.path.join(ROOT, "assets", "art", "creatures")
SCALE = 3          # output pixels per design unit
SS = 2             # supersampling for anti-aliased masks
PAD = 24           # transparent margin (px) so glows are not clipped

# Light used for the baked form shading (enemies are lit from the left, the
# Lanternkeeper by its own lantern on the right).
LIGHT_LEFT = np.array([-0.55, -0.55, 0.63])
LIGHT_RIGHT = np.array([0.55, -0.5, 0.67])


def hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


# ───────────── noise ─────────────
def value_noise(h, w, cell, rng):
    gh, gw = h // cell + 3, w // cell + 3
    g = rng.random((gh, gw))
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32)[:h, :w] / 255.0


def fbm(h, w, rng, base=64, octaves=5):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    cell = base
    for _ in range(octaves):
        out += value_noise(h, w, max(2, cell), rng) * amp
        tot += amp
        amp *= 0.5
        cell //= 2
    return out / tot


def streaks(h, w, rng, vertical=True, length=40):
    n = rng.random((h, w)).astype(np.float32)
    size = (length, 1) if vertical else (1, length)
    return ndimage.uniform_filter(n, size=size)


# ───────────── materials ─────────────
class Material:
    def __init__(self, kind, color, height=1.0, rough=0.5, spec=0.0, emissive=False):
        self.kind, self.color, self.height, self.rough, self.spec, self.emissive = kind, color, height, rough, spec, emissive


def material_for(paint, grads):
    """Map an SVG fill to a physical-ish material."""
    if paint is None:
        return None
    if paint.startswith("url("):
        gid = paint[5:-1]
        stops = grads.get(gid, [(0, "#808080", 1)])
        cols = [hex_rgb(s[1]) for s in stops]
        if gid in ("glow", "eyeGlow", "fire", "warm", "fireCore", "moon"):
            mat = Material("emissive", cols[0], emissive=True)
            mat.stops = [(o, hex_rgb(c), a) for o, c, a in stops]
            return mat
        if gid == "metal":
            return Material("metal", np.array([0.24, 0.23, 0.22]), height=1.0, rough=0.25, spec=1.1)
        if gid == "bone":
            return Material("bone", np.array([0.58, 0.53, 0.44]), height=1.0, rough=0.6, spec=0.15)
        if gid == "cloth":
            return Material("cloth", (cols[0] * 0.6 + cols[min(1, len(cols) - 1)] * 0.4) * 0.8, height=0.5, rough=0.9)
        if gid == "bodyDark":
            return Material("flesh", cols[0] * 0.7, height=1.0, rough=0.7, spec=0.08)
        # body / bodyV: the palette's light..mid
        light = cols[0]
        mid = cols[1] if len(cols) > 1 else cols[0]
        return Material("flesh", light * 0.45 + mid * 0.55, height=1.0, rough=0.7, spec=0.1)
    c = hex_rgb(paint)
    h, l, s = colorsys.rgb_to_hls(*c)
    if l > 0.6 and s > 0.6:
        return Material("emissive", c, emissive=True)
    if l < 0.06:
        return Material("void", c, height=0.2, rough=1.0)
    if s < 0.25 and l > 0.6:
        return Material("bone", c, height=0.9, rough=0.6, spec=0.15)
    return Material("solid", c, height=0.8, rough=0.7, spec=0.05)


def raster(polys, size, closed, evenodd, stroke_width=0):
    """Anti-aliased coverage mask for polygons (filled) or polylines (stroked)."""
    w, h = size
    img = Image.new("L", (w * SS, h * SS), 0)
    d = ImageDraw.Draw(img)
    if stroke_width > 0:
        lw = max(1, int(round(stroke_width * SS)))
        for p in polys:
            pts = [(x * SS + PAD * SS, y * SS + PAD * SS) for x, y in p]
            if closed and len(pts) > 2:
                pts = pts + [pts[0]]
            d.line(pts, fill=255, width=lw, joint="curve")
            r = lw / 2
            for q in (pts[0], pts[-1]):
                d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=255)
    else:
        if evenodd and len(polys) > 1:
            acc = np.zeros((h * SS, w * SS), bool)
            for p in polys:
                tmp = Image.new("L", img.size, 0)
                ImageDraw.Draw(tmp).polygon([(x * SS + PAD * SS, y * SS + PAD * SS) for x, y in p], fill=255)
                acc ^= np.asarray(tmp) > 127
            img = Image.fromarray((acc * 255).astype(np.uint8))
        else:
            for p in polys:
                if len(p) > 2:
                    d.polygon([(x * SS + PAD * SS, y * SS + PAD * SS) for x, y in p], fill=255)
    img = img.resize((w, h), Image.LANCZOS)
    return np.asarray(img, dtype=np.float32) / 255.0


def render(cid):
    design = svgparts.load(os.path.join(SRC, f"{cid}.svg"), SCALE)
    W = int(design.width) + PAD * 2
    H = int(design.height) + PAD * 2
    rng = np.random.default_rng(abs(hash(cid)) % (2 ** 32))
    light = LIGHT_RIGHT if cid in ("player",) else LIGHT_LEFT

    albedo = np.zeros((H, W, 3), np.float32)
    alpha = np.zeros((H, W), np.float32)
    height = np.zeros((H, W), np.float32)
    rough = np.ones((H, W), np.float32) * 0.7
    specmap = np.zeros((H, W), np.float32)
    seams = np.zeros((H, W), np.float32)
    glow = np.zeros((H, W, 4), np.float32)

    # Shared texture fields.
    grain = fbm(H, W, rng, base=8, octaves=3)
    mottle = fbm(H, W, rng, base=48, octaves=4)
    vstreak = streaks(H, W, rng, True, 30)
    hstreak = streaks(H, W, rng, False, 24)
    z = 0.0

    for part in design.parts:
        for paint, is_stroke in ((part.fill, False), (part.stroke, True)):
            if paint is None or (is_stroke and part.stroke_width <= 0):
                continue
            mat = material_for(paint, design.gradients)
            if mat is None:
                continue
            m = raster(part.polys, (W, H), part.closed, part.evenodd, part.stroke_width if is_stroke else 0)
            m *= part.opacity
            if m.max() <= 0.01:
                continue
            if mat.emissive:
                col = mat.color
                stops = getattr(mat, "stops", None)
                if stops:
                    # Radial gradient: hot core at the shape's centre, fading to its edge.
                    dist = ndimage.distance_transform_edt(m > 0.05)
                    t = 1.0 - np.clip(dist / max(dist.max(), 1.0), 0, 1)
                    offs = np.array([st[0] for st in stops])
                    col = np.dstack([np.interp(t, offs, [st[1][ch] for st in stops]) for ch in range(3)])
                    m = m * np.interp(t, offs, [st[2] for st in stops])
                if part.blur > 0:
                    mm = ndimage.gaussian_filter(m, part.blur * 0.8)
                    strength = 0.75
                else:
                    mm = m
                    strength = 1.0
                a = mm * strength
                glow[..., :3] = glow[..., :3] * (1 - a[..., None]) + col * a[..., None]
                col = col if np.ndim(col) == 3 else np.broadcast_to(col, (H, W, 3))
                glow[..., 3] = np.maximum(glow[..., 3], a)
                if part.blur == 0:
                    # Crisp emissive shapes (lantern glass, flames) also belong to the body.
                    albedo = albedo * (1 - m[..., None]) + col * m[..., None]
                    alpha = np.maximum(alpha, m)
                    height = np.where(m > 0.5, z + 0.2, height)
                continue
            if part.blur > 0:
                m = ndimage.gaussian_filter(m, part.blur * 0.6)
            solid = m > 0.5
            # Height: rounded dome from the distance to the part's edge.
            dist = ndimage.distance_transform_edt(solid)
            r = max(3.0, min(dist.max() * 0.8, 4.5 * SCALE)) if dist.max() > 0 else 1.0
            dome = 1.0 - (1.0 - np.clip(dist / r, 0, 1)) ** 2
            z += 0.35
            # Per-material surface texture.
            col = np.broadcast_to(mat.color, (H, W, 3)).copy()
            if mat.kind == "cloth":
                folds = vstreak * 0.6 + mottle * 0.4
                col *= (0.75 + 0.5 * folds)[..., None]
                bump = folds * 0.9 + grain * 0.15
            elif mat.kind == "metal":
                rust = np.clip((mottle - 0.55) * 4, 0, 1)
                col = col * (0.7 + 0.45 * hstreak + 0.2 * grain)[..., None]
                col = col * (1 - rust[..., None] * 0.6) + np.array([0.22, 0.12, 0.07]) * rust[..., None] * 0.6
                bump = grain * 0.25 + hstreak * 0.35 + rust * 0.3
            elif mat.kind == "bone":
                col *= (0.82 + 0.25 * mottle + 0.12 * grain)[..., None]
                bump = grain * 0.35 + mottle * 0.3
            elif mat.kind == "flesh":
                col *= (0.78 + 0.35 * mottle + 0.12 * grain)[..., None]
                bump = mottle * 0.6 + grain * 0.25
            else:
                col *= (0.85 + 0.2 * mottle)[..., None]
                bump = grain * 0.1
            h_part = z + mat.height * (dome * 3.2 + bump * 2.6)
            a = m[..., None]
            albedo = albedo * (1 - a) + col * a
            glow[..., 3] *= 1 - m  # opaque parts hide glows drawn beneath them
            # A dark seam where this part overlaps something already drawn.
            edge = np.clip(m - ndimage.grey_erosion(m, size=(3, 3)), 0, 1) * (alpha > 0.5)
            seams = np.maximum(seams * (1 - m), edge)
            alpha = np.maximum(alpha, m)
            height = np.where(solid, h_part, height)
            rough = np.where(solid, mat.rough, rough)
            specmap = np.where(solid, mat.spec, specmap)

    # Normals from the height field.
    hs = ndimage.gaussian_filter(height, 1.0)
    gy, gx = np.gradient(hs)
    k = 0.9
    n = np.dstack([-gx * k, -gy * k, np.ones_like(hs)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    # Silhouette edges bend outward for a rounded rim.
    am = ndimage.gaussian_filter(alpha, 2.5)
    ay, ax = np.gradient(am)
    n[..., 0] += -ax * 6
    n[..., 1] += -ay * 6
    n /= np.linalg.norm(n, axis=2, keepdims=True)

    # Ambient occlusion: places lower than their surroundings are darker.
    ao = np.clip(1.0 - (ndimage.gaussian_filter(hs, 6) - hs) * 0.18, 0.45, 1.0)
    ao *= np.clip(1.0 - seams * 0.55, 0, 1)

    ndl = np.clip(np.tensordot(n, light, axes=([2], [0])), 0, 1)
    view = np.array([0, 0, 1.0])
    half = (light + view) / np.linalg.norm(light + view)
    spec = np.clip(np.tensordot(n, half, axes=([2], [0])), 0, 1) ** 24 * specmap
    # Rim light on the side facing the light, from the silhouette gradient.
    rim = np.clip(-(ax * light[0] + ay * light[1]) * 22, 0, 1) * 0.55
    warm = np.array([1.0, 0.82, 0.62])
    # Light falls off across the figure, away from the light source.
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    across = (xs / W - 0.5) * np.sign(light[0]) + (ys / H - 0.5) * 0.6
    falloff = np.clip(0.95 + across * 1.1, 0.35, 1.25)
    grime = 0.72 + 0.38 * fbm(H, W, rng, base=96, octaves=4)
    shade = (0.3 + 1.15 * ndl) * ao * falloff * grime * 1.25
    color = albedo * shade[..., None] + spec[..., None] * np.array([1.0, 0.92, 0.8]) * 0.9
    color += rim[..., None] * warm * albedo.mean(axis=2, keepdims=True) * 1.6
    # Grade: deepen shadows, keep it grim.
    # Grade: deepen shadows, cool them slightly, keep it grim.
    color = np.clip(color, 0, 1) ** 1.1
    luma = color.mean(axis=2, keepdims=True)
    color = color * 0.85 + luma * 0.15
    color = color * np.array([1.0, 0.97, 0.94]) + (1 - luma) * np.array([-0.005, 0.0, 0.012])
    # Emissive glow on top.
    ga = glow[..., 3:4]
    color = color * (1 - ga * 0.85) + glow[..., :3] * ga
    out_alpha = np.maximum(alpha, glow[..., 3] * 0.0)

    rgba = np.dstack([color, out_alpha])
    Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f"{cid}.png"), optimize=True)
    nmap = np.dstack([n[..., 0] * 0.5 + 0.5, -n[..., 1] * 0.5 + 0.5, n[..., 2] * 0.5 + 0.5, out_alpha])
    Image.fromarray((np.clip(nmap, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f"{cid}_n.png"), optimize=True)
    gl = glow.copy()
    gl[..., 3] = np.clip(gl[..., 3], 0, 1)
    Image.fromarray((np.clip(gl, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f"{cid}_glow.png"), optimize=True)
    return W, H


def main(ids):
    os.makedirs(OUT, exist_ok=True)
    if not ids:
        ids = sorted(f[:-4] for f in os.listdir(SRC) if f.endswith(".svg"))
    sizes = {}
    for cid in ids:
        sizes[cid] = render(cid)
        print(f"rendered {cid} {sizes[cid]}")


if __name__ == "__main__":
    main(sys.argv[1:])
