"""Synthesize Emberdeep's sound effects and ambient music.

SFX  -> assets/audio/sfx/<name>.wav (mono 44.1 kHz)
Music -> assets/audio/music/<name>.ogg (seamless loops, via ffmpeg/libvorbis)
Usage: python3 tools/audio/synth.py [sfx|music]
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from scipy import signal

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 44100
rng = np.random.default_rng(11)


def t(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, a=0.005, d=0.2, s=0.0, r=0.1, curve=3.0):
    """Exponential-ish ADSR over n samples (d/r in seconds)."""
    x = np.zeros(n)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(1, min(na, n))
    x[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na)
    x[na:na + nd] = s + (1 - s) * np.exp(-np.linspace(0, curve, nd))
    rest = n - na - nd
    if rest > 0:
        x[na + nd:] = (s if s else x[na + nd - 1] if nd else 1) * np.exp(-np.linspace(0, curve, rest)) if r else s
    return x


def noise(dur):
    return rng.uniform(-1, 1, int(SR * dur))


def lp(x, cutoff, order=2):
    b, a = signal.butter(order, min(cutoff / (SR / 2), 0.99), "low")
    return signal.lfilter(b, a, x)


def hp(x, cutoff, order=2):
    b, a = signal.butter(order, min(cutoff / (SR / 2), 0.99), "high")
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], "band")
    return signal.lfilter(b, a, x)


def sine(freq, dur, phase=0.0):
    tt = t(dur)
    f = np.broadcast_to(freq, tt.shape) if np.ndim(freq) else np.full(tt.shape, freq)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def glide(f0, f1, dur, curve=2.0):
    k = np.linspace(0, 1, int(SR * dur)) ** curve
    return f0 + (f1 - f0) * k


def reverb(x, decay=1.6, mix=0.3, predelay=0.02):
    n = int(SR * decay)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 6, n))
    ir = lp(ir, 5000)
    ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
    wet = signal.fftconvolve(x, ir)[: len(x) + len(ir)]
    wet /= max(1e-9, np.max(np.abs(wet)))
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix * np.max(np.abs(x))


def norm(x, peak=0.9):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def write_ogg(path, x, quality=3):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp = f.name
    write_wav(tmp, x)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-c:a", "libvorbis", "-q:a", str(quality), path], check=True)
    os.unlink(tmp)


# ───────────── Sound effects ─────────────
def sfx():
    S = {}
    # UI
    S["click"] = norm(sine(glide(900, 600, 0.05), 0.05) * env(int(SR * 0.05), d=0.04), 0.4)
    S["hover"] = norm(bp(noise(0.06), 2000, 6000) * env(int(SR * 0.06), d=0.05), 0.15)
    S["error"] = norm((sine(140, 0.18) + 0.5 * sine(147, 0.18)) * env(int(SR * 0.18), d=0.15), 0.4)
    S["select"] = norm(sine(glide(500, 760, 0.09), 0.09) * env(int(SR * 0.09), d=0.08), 0.3)
    # Cards
    swish = bp(noise(0.22), 800, 5000) * env(int(SR * 0.22), a=0.03, d=0.18)
    S["card"] = norm(swish + 0.2 * sine(glide(300, 520, 0.22), 0.22) * env(int(SR * 0.22), d=0.2), 0.45)
    S["end_turn"] = norm(reverb(bp(noise(0.4), 300, 2500) * env(int(SR * 0.4), a=0.02, d=0.35), 0.8, 0.3), 0.4)
    S["turn"] = norm(reverb(sine(glide(180, 240, 0.4), 0.4) * env(int(SR * 0.4), a=0.02, d=0.35) + 0.4 * sine(360, 0.4) * env(int(SR * 0.4), d=0.3), 1.2, 0.4), 0.35)
    # Combat
    thud = sine(glide(130, 45, 0.25), 0.25) * env(int(SR * 0.25), d=0.22)
    crack = lp(noise(0.25), 3500) * env(int(SR * 0.25), d=0.08)
    S["hit"] = norm(thud * 0.9 + crack * 0.8, 0.8)
    big = sine(glide(90, 30, 0.6), 0.6) * env(int(SR * 0.6), d=0.5) + lp(noise(0.6), 1800) * env(int(SR * 0.6), d=0.25) * 1.2
    S["hit_big"] = norm(reverb(big, 1.0, 0.25), 0.95)
    S["block"] = norm(reverb(sum(sine(f, 0.5) * env(int(SR * 0.5), d=0.4) * a for f, a in ((620, 1), (1340, 0.5), (2210, 0.3))) + bp(noise(0.5), 3000, 8000) * env(int(SR * 0.5), d=0.03), 0.9, 0.3), 0.5)
    S["burn"] = norm(bp(noise(0.5), 1200, 7000) * env(int(SR * 0.5), a=0.05, d=0.4) * (1 + 0.5 * sine(23, 0.5)), 0.45)
    S["light"] = norm(reverb(sum(sine(f, 0.9) * env(int(SR * 0.9), a=0.01 + i * 0.06, d=0.7) for i, f in enumerate((660, 880, 1320))), 1.6, 0.45), 0.4)
    S["heal"] = norm(reverb(sine(440, 0.8) * env(int(SR * 0.8), a=0.05, d=0.6) + sine(660, 0.8) * env(int(SR * 0.8), a=0.15, d=0.6), 1.5, 0.4), 0.4)
    S["buff"] = norm(reverb(sine(glide(220, 440, 0.5, 0.6), 0.5) * env(int(SR * 0.5), a=0.03, d=0.45), 1.0, 0.3), 0.4)
    S["debuff"] = norm(reverb(sine(glide(400, 160, 0.6, 0.7), 0.6) * env(int(SR * 0.6), a=0.02, d=0.5) * (1 + 0.4 * sine(9, 0.6)), 1.0, 0.3), 0.4)
    S["death"] = norm(reverb(lp(noise(1.4), 900) * env(int(SR * 1.4), a=0.05, d=1.2) + sine(glide(160, 40, 1.4), 1.4) * env(int(SR * 1.4), d=1.0) * 0.8, 2.0, 0.35), 0.7)
    S["revive"] = norm(reverb(sine(glide(200, 600, 1.0, 0.5), 1.0) * env(int(SR * 1.0), a=0.3, d=0.6) + bp(noise(1.0), 2000, 6000) * env(int(SR * 1.0), a=0.4, d=0.5) * 0.3, 2.0, 0.5), 0.5)
    S["summon"] = norm(reverb(sine(110, 1.0) * env(int(SR * 1.0), a=0.1, d=0.8) * (1 + 0.6 * sine(5, 1.0)) + sine(165, 1.0) * env(int(SR * 1.0), a=0.2, d=0.7) * 0.5, 2.0, 0.4), 0.5)
    S["potion"] = norm(sum(sine(glide(300 + i * 90, 900 + i * 150, 0.07), 0.07) * env(int(SR * 0.07), d=0.06) for i in range(3)), 0.3)
    S["potion"] = np.concatenate([S["potion"], np.zeros(int(SR * 0.04)), S["potion"] * 0.7])
    # Spoils
    coin = lambda f: sum(sine(f * m, 0.35) * env(int(SR * 0.35), d=0.3) * a for m, a in ((1, 1), (2.76, 0.5), (5.4, 0.25)))
    S["gold"] = norm(np.concatenate([coin(1800), np.zeros(int(SR * 0.05))]) + np.concatenate([np.zeros(int(SR * 0.05)), coin(2200)]), 0.35)
    S["pickup"] = norm(reverb(sine(523, 0.4) * env(int(SR * 0.4), d=0.35) + sine(784, 0.4) * env(int(SR * 0.4), a=0.06, d=0.3), 1.2, 0.35), 0.4)
    creak = bp(noise(0.7), 200, 900) * env(int(SR * 0.7), a=0.2, d=0.4) * (1 + sine(31, 0.7))
    S["chest"] = norm(np.concatenate([creak, S["gold"]]), 0.5)
    S["smith"] = norm(reverb(np.concatenate([S["block"], np.zeros(int(SR * 0.12)), S["block"] * 0.8]), 1.2, 0.3), 0.5)
    S["step"] = norm(lp(noise(0.18), 600) * env(int(SR * 0.18), d=0.1), 0.4)
    S["blessing"] = norm(reverb(sum(sine(f, 1.6) * env(int(SR * 1.6), a=0.2 + i * 0.1, d=1.2) * 0.5 for i, f in enumerate((262, 392, 523, 659))), 2.5, 0.5), 0.45)
    gong = sum(sine(f, 4.0) * env(int(SR * 4.0), a=0.005, d=3.6, curve=4) * a for f, a in ((62, 1), (124.5, 0.6), (171, 0.4), (247, 0.25), (402, 0.12)))
    S["gong"] = norm(reverb(gong + lp(noise(4.0), 300) * env(int(SR * 4.0), d=0.2) * 0.4, 3.0, 0.4), 0.7)
    S["victory"] = norm(reverb(sum(np.concatenate([np.zeros(int(SR * i * 0.18)), sine(f, 1.4) * env(int(SR * 1.4), a=0.02, d=1.2)]) [: int(SR * 2.2)] if False else np.pad(sine(f, 1.4) * env(int(SR * 1.4), a=0.02, d=1.2), (int(SR * i * 0.18), int(SR * (0.8 - i * 0.18)))) for i, f in enumerate((262, 330, 392, 523))), 2.5, 0.45), 0.5)
    low = sum(np.pad(sine(f, 2.0) * env(int(SR * 2.0), a=0.05, d=1.8), (int(SR * i * 0.5), int(SR * (1.5 - i * 0.5)))) for i, f in enumerate((196, 165, 131, 98)))
    S["death_toll"] = norm(reverb(low, 3.0, 0.5), 0.5)
    out = os.path.join(ROOT, "assets", "audio", "sfx")
    for name, x in S.items():
        write_wav(os.path.join(out, name + ".wav"), x)
    print(f"wrote {len(S)} sfx")


# ───────────── Music: dark ambient loops ─────────────
def pad(freqs, dur, detune=0.3, bright=1200, lfo=0.07):
    x = np.zeros(int(SR * dur))
    for f in freqs:
        for d in (-detune, 0, detune):
            x += signal.sawtooth(2 * np.pi * np.cumsum(np.full(len(x), f + d)) / SR) * 0.3
    sweep = (0.5 + 0.5 * np.sin(2 * np.pi * lfo * t(dur))) * bright + 200
    # Time-varying low-pass via block processing.
    out = np.zeros_like(x)
    block = 2048
    zi = None
    for i in range(0, len(x), block):
        c = sweep[min(i, len(sweep) - 1)]
        b, a = signal.butter(2, c / (SR / 2), "low")
        if zi is None:
            zi = signal.lfilter_zi(b, a) * 0
        out[i:i + block], zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
    return out


def wind(dur, lo=200, hi=900, depth=0.6, rate=0.05):
    n = bp(noise(dur), lo, hi)
    return n * (1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t(dur) + 1.3)))


def bell(f, dur=5.0):
    return sum(sine(f * m, dur) * env(int(SR * dur), a=0.003, d=dur * 0.9, curve=5) * a for m, a in ((1, 1), (2.0, 0.35), (2.76, 0.4), (5.4, 0.15), (8.9, 0.06)))


def place(track, x, at):
    i = int(at * SR)
    end = min(len(track), i + len(x))
    track[i:end] += x[: end - i]


def loopify(x, fade=3.0):
    """Crossfade the tail into the head so the loop is seamless."""
    n = int(fade * SR)
    head, tail = x[:n], x[-n:]
    k = np.linspace(0, 1, n)
    x = x[:-n].copy()
    x[:n] = head * k + tail * (1 - k)
    return x


def ambient(root, chords, dur=64.0, bells=(), bright=900, wind_amt=0.25, drone_amt=0.6, pulse=0.0, seed=0):
    global rng
    rng = np.random.default_rng(seed)
    total = dur + 3.0
    x = np.zeros(int(SR * total))
    seg = total / len(chords)
    for i, ch in enumerate(chords):
        p = pad([root * r for r in ch], seg + 4, bright=bright)
        p *= env(len(p), a=2.5, d=seg + 1, s=0.6, r=2.0, curve=1.0)
        place(x, p * 0.5, i * seg - (2 if i else 0))
    x += sine(root / 2, total) * drone_amt * (0.8 + 0.2 * np.sin(2 * np.pi * 0.03 * t(total)))
    x += wind(total) * wind_amt * 3
    if pulse:
        beat = 60 / pulse
        for k in range(int(total / beat)):
            place(x, sine(glide(root, root * 0.5, 0.6), 0.6) * env(int(SR * 0.6), d=0.5) * 0.7, k * beat)
    for at, f in bells:
        place(x, bell(f) * 0.25, at)
    x = reverb(x, 4.0, 0.45)
    x = lp(x, 6000)
    return norm(loopify(x[: int(SR * total)]), 0.6)


def music():
    out = os.path.join(ROOT, "assets", "audio", "music")
    A = 55.0
    tracks = {
        # The crypt: cold minor drone with distant bells.
        "act1": ambient(A * 2, [(1, 1.2, 1.5), (0.89, 1.06, 1.33), (1, 1.19, 1.5), (0.84, 1.0, 1.26)], bells=((6, 440), (21, 392), (37, 330), (52, 294)), seed=1),
        # The warrens: murky, wet, slower movement.
        "act2": ambient(A * 1.78, [(1, 1.19, 1.41), (1.06, 1.26, 1.5), (0.94, 1.12, 1.41)], bright=600, wind_amt=0.35, bells=((10, 311), (34, 349)), seed=2),
        # The throne: low and hot, a slow pulse beneath.
        "act3": ambient(A * 1.5, [(1, 1.19, 1.5), (1.06, 1.26, 1.59), (0.94, 1.19, 1.41), (1, 1.12, 1.5)], bright=1300, pulse=40, seed=3),
        "boss": ambient(A * 1.5, [(1, 1.06, 1.5), (0.94, 1.12, 1.41), (1, 1.19, 1.59), (0.89, 1.06, 1.33)], dur=48, bright=1600, pulse=70, drone_amt=0.9, seed=4),
        "title": ambient(A * 2, [(1, 1.5, 2.0), (0.89, 1.33, 1.78), (0.84, 1.26, 1.68), (0.94, 1.41, 1.89)], dur=72, bright=700, bells=((4, 523), (30, 494), (56, 440)), seed=5),
        "campfire": ambient(A * 2.25, [(1, 1.26, 1.5), (1.12, 1.41, 1.68)], dur=48, bright=500, wind_amt=0.1, drone_amt=0.3, bells=((12, 659), (36, 587)), seed=6),
        "victory": ambient(A * 2.25, [(1, 1.26, 1.5), (1.33, 1.68, 2.0), (1.12, 1.5, 1.78), (1, 1.26, 1.5)], dur=48, bright=1400, bells=((2, 523), (14, 659), (26, 784)), seed=7),
        "defeat": ambient(A * 1.6, [(1, 1.19, 1.41), (0.94, 1.12, 1.33)], dur=40, bright=400, drone_amt=0.8, seed=8),
    }
    for name, x in tracks.items():
        write_ogg(os.path.join(out, name + ".ogg"), x)
        print("wrote music", name)


if __name__ == "__main__":
    what = sys.argv[1:] or ["sfx", "music"]
    if "sfx" in what:
        sfx()
    if "music" in what:
        music()
