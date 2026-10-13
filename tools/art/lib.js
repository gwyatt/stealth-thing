// Shared building blocks for the hand-authored SVG art.
// Style: dark silhouettes, directional rim light from the Lanternkeeper's lantern,
// glowing eyes, film grain. Everything is plain SVG so it scales crisply.

export const PALETTES = {
  crypt: { light: '#6f7a80', mid: '#2f3539', dark: '#0d0f11', accent: '#9fd4e6', eye: '#cfe9ff' },
  bone: { light: '#b9ad94', mid: '#6d6455', dark: '#1d1a15', accent: '#e8dcc0', eye: '#ff5a2a' },
  flesh: { light: '#7b6a5f', mid: '#3a2f2a', dark: '#100c0b', accent: '#c9a48c', eye: '#ff3b2f' },
  iron: { light: '#7d7468', mid: '#3a352f', dark: '#0e0c0b', accent: '#b8a07a', eye: '#ffb347' },
  rot: { light: '#5c6448', mid: '#272b1c', dark: '#0d0f08', accent: '#b9d77a', eye: '#d8ff6a' },
  spore: { light: '#6a5d6e', mid: '#2c2430', dark: '#110d12', accent: '#e7a8ff', eye: '#ffe9a8' },
  ash: { light: '#8b8580', mid: '#3c3836', dark: '#0f0e0d', accent: '#d9d0c4', eye: '#ff6a2a' },
  magma: { light: '#8a5a44', mid: '#3a2219', dark: '#100806', accent: '#ff7a2a', eye: '#ffd27a' },
  obsidian: { light: '#5c5566', mid: '#25212b', dark: '#09080b', accent: '#ff4a2a', eye: '#ff4a2a' },
  ember: { light: '#a8573a', mid: '#4a1f14', dark: '#120605', accent: '#ffb347', eye: '#fff1a8' },
  player: { light: '#8c8273', mid: '#3b352e', dark: '#0f0d0b', accent: '#c8a46a', eye: '#ffcf7a' },
};

// Defs shared by every creature: body gradients lit from one side, glows, grain.
export function defs(p, { lightFrom = 'left' } = {}) {
  const [x1, x2] = lightFrom === 'left' ? [0, 1] : [1, 0];
  return `<defs>
  <linearGradient id="body" x1="${x1}" y1="0" x2="${x2}" y2="0.35">
    <stop offset="0" stop-color="${p.light}"/><stop offset="0.38" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.dark}"/>
  </linearGradient>
  <linearGradient id="bodyDark" x1="${x1}" y1="0" x2="${x2}" y2="0.4">
    <stop offset="0" stop-color="${p.mid}"/><stop offset="0.6" stop-color="${p.dark}"/><stop offset="1" stop-color="#050404"/>
  </linearGradient>
  <linearGradient id="bodyV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.light}"/><stop offset="0.5" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.dark}"/>
  </linearGradient>
  <linearGradient id="cloth" x1="${x1}" y1="0" x2="${x2}" y2="1">
    <stop offset="0" stop-color="${p.mid}"/><stop offset="0.7" stop-color="${p.dark}"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/>
  </linearGradient>
  <linearGradient id="metal" x1="${x1}" y1="0" x2="${x2}" y2="1">
    <stop offset="0" stop-color="#b5ab9b"/><stop offset="0.25" stop-color="#5d564d"/><stop offset="0.7" stop-color="#1e1b18"/><stop offset="1" stop-color="#0a0908"/>
  </linearGradient>
  <linearGradient id="bone" x1="${x1}" y1="0" x2="${x2}" y2="1">
    <stop offset="0" stop-color="#e2d6bb"/><stop offset="0.5" stop-color="#8d8270"/><stop offset="1" stop-color="#2b261f"/>
  </linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.9"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
  <radialGradient id="eyeGlow"><stop offset="0" stop-color="${p.eye}"/><stop offset="0.35" stop-color="${p.eye}" stop-opacity="0.6"/><stop offset="1" stop-color="${p.eye}" stop-opacity="0"/></radialGradient>
  <radialGradient id="fire" cx="0.5" cy="0.7" r="0.6"><stop offset="0" stop-color="#fff4c2"/><stop offset="0.3" stop-color="#ffb347"/><stop offset="0.7" stop-color="#d4421a"/><stop offset="1" stop-color="#5a0f05" stop-opacity="0"/></radialGradient>
  <radialGradient id="shadow"><stop offset="0" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <filter id="grain" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.25" result="na"/>
    <feComposite in="na" in2="SourceGraphic" operator="in" result="g"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge>
  </filter>
  <filter id="b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
  <filter id="b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="b8" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>`;
}

export function svg(w, h, p, body, opts = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
${defs(p, opts)}
<ellipse cx="${w / 2}" cy="${h - 10}" rx="${w * 0.36}" ry="10" fill="url(#shadow)"/>
<g filter="url(#grain)">
${body}
</g>
</svg>`;
}

// Glowing eye pair. Returns markup placed above the grain so eyes stay clean.
export function eyes(points, r = 3, color = null) {
  const fill = color ? color : 'url(#eyeGlow)';
  return points
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r * 3.2}" fill="${fill}" opacity="0.55" filter="url(#b3)"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#eyeGlow)"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#fff"/>`)
    .join('');
}

export function glow(x, y, r, opacity = 0.7) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#glow)" opacity="${opacity}"/>`;
}

export function flame(x, y, s = 1, opacity = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
    <ellipse cx="0" cy="-6" rx="16" ry="22" fill="url(#fire)" filter="url(#b3)" opacity="0.8"/>
    <path d="M0 8 C-10 4 -11 -8 -4 -16 C-3 -10 0 -10 0 -14 C2 -20 1 -26 -2 -32 C8 -26 12 -14 9 -4 C8 2 5 7 0 8Z" fill="url(#fire)"/>
    <path d="M0 6 C-4 4 -5 -2 -2 -8 C0 -4 2 -6 2 -10 C5 -6 5 0 3 4Z" fill="#fff4c2" opacity="0.9"/>
  </g>`;
}

// Ragged hanging cloth edge from x0 to x1 at baseline y.
export function tatters(x0, x1, y, depth = 14, n = 7) {
  let d = '';
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * step;
    const mid = a + step * 0.5;
    const len = depth * (0.55 + ((i * 37) % 10) / 20);
    d += ` L${(a + step * 0.15).toFixed(1)} ${y} L${mid.toFixed(1)} ${(y + len).toFixed(1)} L${(a + step * 0.85).toFixed(1)} ${y}`;
  }
  return d;
}
