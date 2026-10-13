// Tiny procedural sound effects via WebAudio. No assets required.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('emberdeep.muted') === '1'; } catch { /* storage unavailable */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.15, slide = 0, delay = 0 } = {}) {
  const a = ac();
  if (!a || muted) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.2, filter = 1200, delay = 0 } = {}) {
  const a = ac();
  if (!a || muted) return;
  const t = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filter;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  card: () => tone(520, 0.08, { type: 'triangle', vol: 0.08, slide: 200 }),
  hit: () => { noise(0.12, { vol: 0.25, filter: 900 }); tone(140, 0.12, { type: 'square', vol: 0.05, slide: -60 }); },
  bigHit: () => { noise(0.25, { vol: 0.35, filter: 600 }); tone(90, 0.25, { type: 'sawtooth', vol: 0.08, slide: -40 }); },
  block: () => tone(880, 0.12, { type: 'square', vol: 0.05, slide: -300 }),
  light: () => { tone(660, 0.1, { vol: 0.07 }); tone(990, 0.14, { vol: 0.05, delay: 0.05 }); },
  burn: () => noise(0.2, { vol: 0.12, filter: 3000 }),
  heal: () => { tone(440, 0.15, { vol: 0.07 }); tone(660, 0.2, { vol: 0.07, delay: 0.08 }); },
  buff: () => tone(300, 0.2, { type: 'triangle', vol: 0.08, slide: 300 }),
  debuff: () => tone(400, 0.25, { type: 'triangle', vol: 0.08, slide: -250 }),
  death: () => { tone(300, 0.4, { type: 'sawtooth', vol: 0.07, slide: -250 }); noise(0.3, { vol: 0.15, filter: 500 }); },
  gold: () => { tone(1200, 0.06, { type: 'square', vol: 0.04 }); tone(1600, 0.1, { type: 'square', vol: 0.04, delay: 0.06 }); },
  click: () => tone(700, 0.04, { type: 'triangle', vol: 0.05 }),
  error: () => tone(160, 0.15, { type: 'square', vol: 0.05 }),
  victory: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.09, delay: i * 0.12 })),
  defeat: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.45, { type: 'sawtooth', vol: 0.06, delay: i * 0.2 })),
  turn: () => tone(240, 0.18, { type: 'triangle', vol: 0.07, slide: 120 }),
};

export function isMuted() {
  return muted;
}

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('emberdeep.muted', m ? '1' : '0'); } catch { /* ignore */ }
}
