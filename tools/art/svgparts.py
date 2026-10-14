"""Minimal SVG reader for the character design sources in art_src/.

Turns each drawable element into a Part: polygons in pixel space plus fill/stroke
info. Supports the subset the designs use: path (M L H V C S Q T A Z, absolute and
relative), rect, circle, ellipse, g with translate/scale, opacity and filters.
"""
import math
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

NS = "{http://www.w3.org/2000/svg}"


@dataclass
class Part:
    polys: list            # list of [(x, y), ...] in output pixels
    fill: str | None       # '#rrggbb', 'url(#id)' or None
    stroke: str | None
    stroke_width: float
    opacity: float
    blur: float            # blur radius in output pixels (0 = crisp)
    evenodd: bool = False
    closed: bool = True
    order: int = 0


@dataclass
class Design:
    width: float
    height: float
    gradients: dict = field(default_factory=dict)  # id -> list of (offset, color, opacity)
    parts: list = field(default_factory=list)


def _mat_mul(a, b):
    return (
        a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
    )


def _parse_transform(s):
    m = (1, 0, 0, 1, 0, 0)
    for name, args in re.findall(r"(\w+)\s*\(([^)]*)\)", s or ""):
        v = [float(x) for x in re.split(r"[\s,]+", args.strip()) if x]
        if name == "translate":
            t = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif name == "scale":
            t = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        elif name == "rotate":
            a = math.radians(v[0])
            t = (math.cos(a), math.sin(a), -math.sin(a), math.cos(a), 0, 0)
            if len(v) == 3:
                t = _mat_mul(_mat_mul((1, 0, 0, 1, v[1], v[2]), t), (1, 0, 0, 1, -v[1], -v[2]))
        elif name == "matrix":
            t = tuple(v)
        else:
            continue
        m = _mat_mul(m, t)
    return m


def _apply(m, pts):
    return [(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]) for x, y in pts]


def _bezier(p0, p1, p2, p3, n=14):
    out = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        out.append((
            u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
            u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
        ))
    return out


def _quad(p0, p1, p2, n=10):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(1, n + 1))]


def _arc(p0, rx, ry, phi, large, sweep, p1, n=16):
    if rx == 0 or ry == 0:
        return [p1]
    phi = math.radians(phi)
    cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (p0[0] - p1[0]) / 2, (p0[1] - p1[1]) / 2
    x1 = cp * dx + sp * dy
    y1 = -sp * dx + cp * dy
    rx, ry = abs(rx), abs(ry)
    lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry)
    if lam > 1:
        rx *= math.sqrt(lam)
        ry *= math.sqrt(lam)
    num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    den = rx * rx * y1 * y1 + ry * ry * x1 * x1
    co = math.sqrt(max(0, num / den)) if den else 0
    if large == sweep:
        co = -co
    cx1 = co * rx * y1 / ry
    cy1 = -co * ry * x1 / rx
    cx = cp * cx1 - sp * cy1 + (p0[0] + p1[0]) / 2
    cy = sp * cx1 + cp * cy1 + (p0[1] + p1[1]) / 2
    a1 = math.atan2((y1 - cy1) / ry, (x1 - cx1) / rx)
    a2 = math.atan2((-y1 - cy1) / ry, (-x1 - cx1) / rx)
    da = a2 - a1
    if sweep and da < 0:
        da += 2 * math.pi
    elif not sweep and da > 0:
        da -= 2 * math.pi
    out = []
    for i in range(1, n + 1):
        a = a1 + da * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        out.append((cp * x - sp * y + cx, sp * x + cp * y + cy))
    return out


def parse_path(d):
    tokens = re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?", d)
    subpaths, cur, closed = [], [], []
    x = y = sx = sy = 0.0
    last_ctrl = None
    cmd = None
    i = 0

    def num():
        nonlocal i
        v = float(tokens[i])
        i += 1
        return v

    while i < len(tokens):
        if re.match(r"[A-Za-z]", tokens[i]):
            cmd = tokens[i]
            i += 1
            if cmd in "Zz":
                if cur:
                    subpaths.append(cur)
                    closed.append(True)
                cur = []
                x, y = sx, sy
                continue
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            nx, ny = num(), num()
            if rel:
                nx += x
                ny += y
            if cur:
                subpaths.append(cur)
                closed.append(False)
            x, y, sx, sy = nx, ny, nx, ny
            cur = [(x, y)]
            cmd = "l" if rel else "L"
            last_ctrl = None
        elif c == "L":
            nx, ny = num(), num()
            if rel:
                nx += x
                ny += y
            x, y = nx, ny
            cur.append((x, y))
            last_ctrl = None
        elif c == "H":
            nx = num()
            x = nx + x if rel else nx
            cur.append((x, y))
        elif c == "V":
            ny = num()
            y = ny + y if rel else ny
            cur.append((x, y))
        elif c in "CS":
            if c == "C":
                x1, y1 = num(), num()
                if rel:
                    x1 += x
                    y1 += y
            else:
                x1, y1 = (2 * x - last_ctrl[0], 2 * y - last_ctrl[1]) if last_ctrl else (x, y)
            x2, y2, nx, ny = num(), num(), num(), num()
            if rel:
                x2 += x
                y2 += y
                nx += x
                ny += y
            cur.extend(_bezier((x, y), (x1, y1), (x2, y2), (nx, ny)))
            last_ctrl = (x2, y2)
            x, y = nx, ny
        elif c in "QT":
            if c == "Q":
                x1, y1 = num(), num()
                if rel:
                    x1 += x
                    y1 += y
            else:
                x1, y1 = (2 * x - last_ctrl[0], 2 * y - last_ctrl[1]) if last_ctrl else (x, y)
            nx, ny = num(), num()
            if rel:
                nx += x
                ny += y
            cur.extend(_quad((x, y), (x1, y1), (nx, ny)))
            last_ctrl = (x1, y1)
            x, y = nx, ny
        elif c == "A":
            rx, ry, rot, large, sweep, nx, ny = num(), num(), num(), num(), num(), num(), num()
            if rel:
                nx += x
                ny += y
            cur.extend(_arc((x, y), rx, ry, rot, int(large), int(sweep), (nx, ny)))
            x, y = nx, ny
            last_ctrl = None
    if cur:
        subpaths.append(cur)
        closed.append(False)
    return subpaths, closed


def _ellipse(cx, cy, rx, ry, n=48):
    return [(cx + rx * math.cos(2 * math.pi * k / n), cy + ry * math.sin(2 * math.pi * k / n)) for k in range(n)]


BLURS = {"b1": 1.2, "b3": 3, "b8": 8, "b2": 2, "b6": 6, "b20": 20, "b40": 40}


def load(path, scale):
    root = ET.parse(path).getroot()
    vb = [float(v) for v in root.get("viewBox").split()]
    design = Design(vb[2] * scale, vb[3] * scale)
    for grad in root.iter():
        if grad.tag in (NS + "linearGradient", NS + "radialGradient"):
            stops = []
            for s in grad.findall(NS + "stop"):
                stops.append((float(s.get("offset", 0)), s.get("stop-color", "#000"), float(s.get("stop-opacity", 1))))
            design.gradients[grad.get("id")] = stops
    base = (scale, 0, 0, scale, 0, 0)
    order = [0]

    def walk(el, m, opacity, blur, skip, inherited=None):
        inherited = dict(inherited or {})
        for k in ("fill", "stroke", "stroke-width", "fill-rule"):
            if el.get(k) is not None:
                inherited[k] = el.get(k)
        tag = el.tag.replace(NS, "")
        if tag in ("defs", "filter", "linearGradient", "radialGradient"):
            return
        m = _mat_mul(m, _parse_transform(el.get("transform")))
        opacity *= float(el.get("opacity", 1))
        f = el.get("filter")
        if f:
            fid = re.search(r"#([\w-]+)", f).group(1)
            if fid == "grain":
                f = None
            else:
                blur = max(blur, BLURS.get(fid, 2) * scale)
        if tag in ("svg", "g"):
            for ch in el:
                walk(ch, m, opacity, blur, skip, inherited)
            return
        polys, closed = [], True
        if tag == "path":
            sub, cl = parse_path(el.get("d", ""))
            polys = [_apply(m, p) for p in sub if len(p) > 1]
            closed = all(cl) if cl else True
        elif tag == "rect":
            x, y, w, h = (float(el.get(k, 0)) for k in ("x", "y", "width", "height"))
            polys = [_apply(m, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)])]
        elif tag == "circle":
            r = float(el.get("r"))
            polys = [_apply(m, _ellipse(float(el.get("cx", 0)), float(el.get("cy", 0)), r, r))]
        elif tag == "ellipse":
            polys = [_apply(m, _ellipse(float(el.get("cx", 0)), float(el.get("cy", 0)), float(el.get("rx")), float(el.get("ry"))))]
        else:
            return
        fill = inherited.get("fill", "#000")
        if fill == "none":
            fill = None
        if fill and "shadow" in fill:
            return  # ground shadows are drawn by the engine
        stroke = inherited.get("stroke")
        sw = float(inherited.get("stroke-width", 1)) * scale * math.sqrt(abs(m[0] * m[3] - m[1] * m[2])) / scale if stroke else 0
        order[0] += 1
        design.parts.append(Part(polys, fill, stroke, sw, opacity * float(el.get("fill-opacity", 1)), blur,
                                 inherited.get("fill-rule") == "evenodd", closed, order[0]))

    walk(root, base, 1.0, 0.0, False)
    return design
