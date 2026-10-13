// Full-screen background scenes (1600x900, rendered with preserveAspectRatio slice).
const W = 1600;
const H = 900;

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const commonDefs = `
  <filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  <filter id="stone" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.06 0.14" numOctaves="3" seed="11" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 -0.18" result="na"/>
    <feComposite in="na" in2="SourceGraphic" operator="in" result="t"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="t"/></feMerge>
  </filter>
  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>
  <radialGradient id="warm"><stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/><stop offset="0.4" stop-color="#ff7a2a" stop-opacity="0.35"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
  <radialGradient id="fireCore" cx="0.5" cy="0.75" r="0.6"><stop offset="0" stop-color="#fff4c2"/><stop offset="0.3" stop-color="#ffb347"/><stop offset="0.7" stop-color="#c8401a"/><stop offset="1" stop-color="#5a0f05" stop-opacity="0"/></radialGradient>`;

function wrap(defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">
<defs>${commonDefs}${defs}</defs>
${body}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

// Pointed gothic arch outline. (x, y) is bottom-left.
function arch(x, y, w, h) {
  const top = y - h;
  return `M${x} ${y} V${top + w * 0.55} C${x} ${top + w * 0.18} ${x + w * 0.28} ${top} ${x + w / 2} ${top} C${x + w * 0.72} ${top} ${x + w} ${top + w * 0.18} ${x + w} ${top + w * 0.55} V${y} Z`;
}

function candle(x, y, h = 30) {
  return `<rect x="${x - 4}" y="${y - h}" width="8" height="${h}" fill="#bfb39a"/><path d="M${x - 4} ${y - h} q4 6 8 0" fill="#e8dcc0"/>
  <circle cx="${x}" cy="${y - h - 8}" r="26" fill="url(#warm)" opacity="0.55"/>
  <path d="M${x} ${y - h - 2} c-5 -3 -5 -10 0 -18 c5 8 5 15 0 18z" fill="url(#fireCore)"/>`;
}

function motes(r, n, { x0 = 0, x1 = W, y0 = 0, y1 = H, color = '#fff', max = 2.2, op = 0.6 } = {}) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${(x0 + r() * (x1 - x0)).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" r="${(0.5 + r() * max).toFixed(1)}" fill="${color}" opacity="${(0.15 + r() * op).toFixed(2)}"/>`;
  }
  return s;
}

function fog(y, color, opacity, r) {
  let s = '';
  for (let i = 0; i < 9; i++) {
    s += `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(y + (r() - 0.5) * 60).toFixed(0)}" rx="${(220 + r() * 260).toFixed(0)}" ry="${(30 + r() * 40).toFixed(0)}" fill="${color}" opacity="${opacity}"/>`;
  }
  return `<g filter="url(#b40)">${s}</g>`;
}

// ── Act 1: flooded crypt, cold light through tall windows ──
export function crypt() {
  const r = rng(3);
  const defs = `
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070a"/><stop offset="0.55" stop-color="#121a20"/><stop offset="1" stop-color="#06080a"/></linearGradient>
  <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc4d6"/><stop offset="1" stop-color="#2a3e4a"/></linearGradient>
  <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8d8e8" stop-opacity="0.22"/><stop offset="1" stop-color="#b8d8e8" stop-opacity="0"/></linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18232a"/><stop offset="1" stop-color="#030506"/></linearGradient>
  <linearGradient id="pillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3236"/><stop offset="0.35" stop-color="#14191c"/><stop offset="1" stop-color="#050607"/></linearGradient>`;
  let wall = `<rect x="0" y="0" width="${W}" height="640" fill="#0e1417" filter="url(#stone)"/>`;
  let windows = '';
  let shafts = '';
  let reflections = '';
  [[260, 120, 520], [560, 110, 560], [900, 110, 560], [1200, 120, 520]].forEach(([x, w, h], i) => {
    windows += `<path d="${arch(x, 600, w, h)}" fill="#05080a"/><path d="${arch(x + 12, 590, w - 24, h - 20)}" fill="url(#win)" opacity="${0.55 + i * 0.05}"/>
      <path d="M${x + w / 2} ${600 - h + 20} V590 M${x + 12} ${600 - h * 0.45} H${x + w - 12}" stroke="#05080a" stroke-width="8"/>`;
    shafts += `<polygon points="${x + 14},${600 - h + 60} ${x + w - 14},${600 - h + 60} ${x + w + 220},900 ${x + 40},900" fill="url(#shaft)"/>`;
    reflections += `<path d="${arch(x + 12, 590, w - 24, h - 20)}" fill="#9fc4d6" opacity="0.08" transform="translate(0 1250) scale(1 -1)" filter="url(#b6)"/>`;
  });
  let ripples = '';
  for (let i = 0; i < 40; i++) {
    const y = 650 + r() * 240;
    const x = r() * W;
    ripples += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} h${(40 + r() * 140).toFixed(0)}" stroke="#9fc4d6" stroke-width="1.5" opacity="${(0.05 + r() * 0.12).toFixed(2)}"/>`;
  }
  const pillars = [[-40, 230], [1410, 240]].map(([x, w]) => `<rect x="${x}" y="0" width="${w}" height="${H}" fill="url(#pillar)" filter="url(#stone)"/>
     <rect x="${x - 20}" y="610" width="${w + 40}" height="60" fill="#0b0f11"/>`).join('');
  const chains = [420, 760, 1080].map((x) => `<path d="M${x} 0 V${160 + r() * 140}" stroke="#0a0c0d" stroke-width="5" stroke-dasharray="10 4"/>`).join('');
  const body = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${wall}${windows}
  <g filter="url(#b20)">${shafts}</g>
  <rect x="0" y="600" width="${W}" height="300" fill="url(#water)"/>
  ${reflections}${ripples}
  ${fog(640, '#9fc4d6', 0.12, r)}
  ${chains}${pillars}
  <g>${candle(150, 610, 34)}${candle(186, 612, 22)}${candle(1470, 612, 28)}${candle(1500, 610, 40)}</g>
  ${motes(r, 60, { y1: 640, color: '#cfe9ff', max: 1.4, op: 0.4 })}`;
  return wrap(defs, body);
}

// ── Act 2: fungal cavern with bioluminescent growth ──
export function warrens() {
  const r = rng(9);
  const defs = `
  <linearGradient id="cave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030504"/><stop offset="0.6" stop-color="#0e1610"/><stop offset="1" stop-color="#040604"/></linearGradient>
  <radialGradient id="biolum"><stop offset="0" stop-color="#6fe0c0" stop-opacity="0.7"/><stop offset="1" stop-color="#6fe0c0" stop-opacity="0"/></radialGradient>
  <radialGradient id="biolumP"><stop offset="0" stop-color="#c88cff" stop-opacity="0.6"/><stop offset="1" stop-color="#c88cff" stop-opacity="0"/></radialGradient>
  <linearGradient id="stem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3a2c"/><stop offset="1" stop-color="#0c0d09"/></linearGradient>`;
  const jag = (y, amp, color, seed) => {
    const rr = rng(seed);
    let d = `M0 ${H} L0 ${y}`;
    for (let x = 0; x <= W; x += 60) d += ` L${x} ${(y + (rr() - 0.5) * amp).toFixed(0)}`;
    return `<path d="${d} L${W} ${H} Z" fill="${color}" filter="url(#stone)"/>`;
  };
  let stalac = '';
  for (let x = 0; x < W; x += 50 + r() * 90) {
    const h = 60 + r() * 200;
    stalac += `<path d="M${x.toFixed(0)} 0 L${(x + 18 + r() * 30).toFixed(0)} ${h.toFixed(0)} L${(x + 50 + r() * 30).toFixed(0)} 0 Z" fill="#050705"/>`;
  }
  const mushroom = (x, y, s, glow) => `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="0" cy="-150" r="160" fill="url(#${glow})" filter="url(#b20)"/>
    <path d="M-14 0 C-10 -60 -16 -110 -8 -150 L8 -150 C14 -110 10 -60 16 0 Z" fill="url(#stem)"/>
    <path d="M-110 -140 C-100 -230 100 -230 110 -140 C60 -128 -60 -128 -110 -140 Z" fill="#141a14"/>
    <path d="M-104 -140 C-60 -128 60 -128 104 -140 C60 -150 -60 -150 -104 -140 Z" fill="${glow === 'biolum' ? '#6fe0c0' : '#c88cff'}" opacity="0.7"/>
  </g>`;
  let roots = '';
  for (let i = 0; i < 14; i++) {
    const x = r() * W;
    const len = 120 + r() * 260;
    roots += `<path d="M${x.toFixed(0)} 0 C${(x + 30).toFixed(0)} ${(len * 0.3).toFixed(0)} ${(x - 30).toFixed(0)} ${(len * 0.6).toFixed(0)} ${(x + 10).toFixed(0)} ${len.toFixed(0)}" stroke="#0b0d08" stroke-width="${(2 + r() * 5).toFixed(1)}" fill="none"/>`;
  }
  let glowSpots = '';
  for (let i = 0; i < 24; i++) {
    const x = r() * W;
    const y = 640 + r() * 200;
    glowSpots += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(10 + r() * 30).toFixed(0)}" ry="${(3 + r() * 6).toFixed(0)}" fill="${r() > 0.5 ? '#6fe0c0' : '#c88cff'}" opacity="${(0.15 + r() * 0.3).toFixed(2)}" filter="url(#b2)"/>`;
  }
  const body = `
  <rect width="${W}" height="${H}" fill="url(#cave)"/>
  ${jag(330, 120, '#0f1610', 1)}
  ${mushroom(380, 560, 0.7, 'biolum')}${mushroom(1180, 540, 0.9, 'biolumP')}${mushroom(820, 590, 0.45, 'biolum')}
  ${fog(520, '#6fe0c0', 0.06, r)}
  ${jag(610, 70, '#0a0f0a', 2)}
  ${mushroom(90, 760, 1.2, 'biolumP')}${mushroom(1520, 780, 1.1, 'biolum')}
  ${stalac}${roots}${glowSpots}
  ${fog(700, '#a8d8c0', 0.08, r)}
  ${motes(r, 90, { color: '#d8ffe8', max: 1.8, op: 0.5 })}
  ${motes(r, 40, { color: '#e7c8ff', max: 1.6, op: 0.5 })}`;
  return wrap(defs, body);
}

// ── Act 3: a burning cathedral above a river of magma ──
export function throne() {
  const r = rng(21);
  const defs = `
  <linearGradient id="hell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050202"/><stop offset="0.45" stop-color="#2a0905"/><stop offset="0.68" stop-color="#8a2a0c"/><stop offset="1" stop-color="#140403"/></linearGradient>
  <linearGradient id="blackstone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1312"/><stop offset="1" stop-color="#050303"/></linearGradient>
  <linearGradient id="lava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.5" stop-color="#ff6a1a"/><stop offset="1" stop-color="#7a1505"/></linearGradient>`;
  let arches = '';
  [[120, 260, 600], [470, 300, 680], [830, 300, 680], [1220, 260, 600]].forEach(([x, w, h], i) => {
    const broken = i % 2 === 0 ? `<path d="M${x + w * 0.55} ${640 - h} l40 30 l-30 20 l50 20 l-60 10 Z" fill="#2a0905"/>` : '';
    arches += `<path d="${arch(x - 30, 640, w + 60, h + 30)} ${arch(x, 640, w, h)}" fill="url(#blackstone)" fill-rule="evenodd" filter="url(#stone)"/>${broken}`;
  });
  const throneSil = `<g transform="translate(800 600)">
    <path d="M-160 40 L160 40 L130 0 L-130 0 Z M-120 0 L120 0 L96 -30 L-96 -30 Z" fill="#0a0504"/>
    <path d="M-70 -30 L-70 -190 L-50 -150 L-30 -230 L0 -170 L30 -230 L50 -150 L70 -190 L70 -30 Z" fill="#0a0504"/>
    <ellipse cx="0" cy="-120" rx="120" ry="140" fill="#ff6a1a" opacity="0.18" filter="url(#b40)"/>
  </g>`;
  let lava = '';
  for (let i = 0; i < 7; i++) {
    const y = 700 + i * 30 + r() * 20;
    let d = `M-20 ${y.toFixed(0)}`;
    for (let x = 0; x <= W + 40; x += 80) d += ` Q${(x + 40).toFixed(0)} ${(y + (r() - 0.5) * 40).toFixed(0)} ${(x + 80).toFixed(0)} ${(y + (r() - 0.5) * 20).toFixed(0)}`;
    lava += `<path d="${d}" stroke="url(#lava)" stroke-width="${(2 + r() * 6).toFixed(1)}" fill="none" opacity="${(0.25 + r() * 0.45).toFixed(2)}"/>`;
  }
  const smoke = Array.from({ length: 10 }, () => `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(100 + r() * 300).toFixed(0)}" rx="${(200 + r() * 200).toFixed(0)}" ry="${(40 + r() * 60).toFixed(0)}" fill="#000" opacity="0.5"/>`).join('');
  const pillars = [[-60, 220], [1440, 240]].map(([x, w]) => `<path d="M${x} ${H} V${120 + r() * 80} l${w * 0.3} -40 l${w * 0.3} 60 l${w * 0.4} -30 V${H} Z" fill="url(#blackstone)" filter="url(#stone)"/>`).join('');
  const body = `
  <rect width="${W}" height="${H}" fill="url(#hell)"/>
  <g filter="url(#b40)">${smoke}</g>
  ${arches}
  ${throneSil}
  <rect x="0" y="640" width="${W}" height="260" fill="#0a0403"/>
  <g filter="url(#b2)">${lava}</g>
  <g filter="url(#b20)" opacity="0.6">${lava}</g>
  ${fog(660, '#ff6a1a', 0.1, r)}
  ${pillars}
  ${motes(r, 140, { color: '#ffb347', max: 2.2, op: 0.7 })}
  ${motes(r, 60, { color: '#bdb5ab', max: 1.4, op: 0.4 })}`;
  return wrap(defs, body);
}

// ── Title: a lone lantern on a cliff before a ruined spire sinking into the abyss ──
export function title() {
  const r = rng(5);
  const defs = `
  <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040508"/><stop offset="0.5" stop-color="#151a22"/><stop offset="0.75" stop-color="#2a1a14"/><stop offset="1" stop-color="#050404"/></linearGradient>
  <radialGradient id="moon"><stop offset="0" stop-color="#e8e2d0"/><stop offset="0.6" stop-color="#b8b2a0"/><stop offset="1" stop-color="#b8b2a0" stop-opacity="0"/></radialGradient>
  <linearGradient id="spire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e2228"/><stop offset="1" stop-color="#07080a"/></linearGradient>`;
  let spires = '';
  [[980, 120, 40, 520], [1080, 200, 60, 560], [1200, 80, 46, 520], [1290, 240, 34, 520], [900, 300, 30, 520]].forEach(([x, top, w, base]) => {
    spires += `<path d="M${x} ${base + 200} V${top + 60} L${x + w / 2} ${top} L${x + w} ${top + 60} V${base + 200} Z" fill="url(#spire)"/>
      <rect x="${x + w * 0.35}" y="${top + 120}" width="${w * 0.3}" height="${w * 0.6}" fill="#ffb347" opacity="${(0.2 + r() * 0.4).toFixed(2)}"/>`;
  });
  const body = `
  <rect width="${W}" height="${H}" fill="url(#night)"/>
  <circle cx="1180" cy="200" r="190" fill="#b8b2a0" opacity="0.12" filter="url(#b40)"/>
  <circle cx="1180" cy="200" r="90" fill="url(#moon)" opacity="1"/><circle cx="1180" cy="200" r="260" fill="#cfd6e8" opacity="0.08" filter="url(#b40)"/>
  ${motes(r, 120, { y1: 420, color: '#dfe6ff', max: 1.2, op: 0.5 })}
  <path d="M760 900 L800 700 L860 650 L880 590 L930 560 L980 570 L1040 530 L1120 545 L1200 520 L1290 548 L1360 530 L1420 590 L1460 640 L1520 700 L1560 900 Z" fill="#0b0d11" filter="url(#stone)"/>
  ${spires}
  ${fog(700, '#8a8fa0', 0.18, r)}
  <path d="M0 900 L0 730 C120 712 240 724 330 708 C430 696 520 744 600 774 C640 794 662 842 700 900 Z" fill="#070708" filter="url(#stone)"/>
  <path d="M110 722 C100 650 120 610 108 560 M108 610 C90 590 76 588 60 570 M110 650 C130 630 150 630 166 610" stroke="#070708" stroke-width="7" fill="none" stroke-linecap="round"/>
  <g transform="translate(330 708)">
    <circle cx="16" cy="-22" r="70" fill="url(#warm)" opacity="0.8"/>
    <path d="M-6 0 L-10 -40 C-10 -54 4 -58 8 -46 L10 0 Z" fill="#050505"/>
    <path d="M-12 -40 C-16 -62 12 -66 10 -42 Z" fill="#050505"/>
    <path d="M8 -36 L18 -26" stroke="#050505" stroke-width="3"/>
    <rect x="14" y="-26" width="7" height="9" fill="#ffcf7a"/>
  </g>
  ${fog(860, '#2a1a14', 0.3, r)}
  ${motes(r, 40, { y0: 500, color: '#ffb347', max: 1.6, op: 0.6 })}`;
  return wrap(defs, body);
}

// ── Campfire: a sword planted in a pile of ash and bones ──
export function bonfire() {
  const r = rng(13);
  const defs = `
  <radialGradient id="campLight" cx="0.5" cy="0.62" r="0.6"><stop offset="0" stop-color="#5a2a10"/><stop offset="0.5" stop-color="#1a0d07"/><stop offset="1" stop-color="#050303"/></radialGradient>`;
  let stones = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = 800 + Math.cos(a) * 170;
    const y = 690 + Math.sin(a) * 40;
    stones += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(22 + r() * 10).toFixed(0)}" ry="${(14 + r() * 6).toFixed(0)}" fill="${Math.cos(a) < 0 ? '#3a2a20' : '#1a120e'}"/>`;
  }
  const body = `
  <rect width="${W}" height="${H}" fill="url(#campLight)"/>
  <path d="${arch(250, 700, 300, 520)} ${arch(1050, 700, 300, 520)}" fill="#0a0706" filter="url(#stone)"/>
  <circle cx="800" cy="600" r="380" fill="url(#warm)" opacity="0.5"/>
  <ellipse cx="800" cy="700" rx="200" ry="50" fill="#2a1a12"/>
  ${stones}
  <path d="M700 700 C720 660 760 650 800 646 C840 650 880 660 900 700 Z" fill="#3a2d26"/>
  <path d="M740 690 L770 672 M820 676 L860 690 M790 690 C786 680 796 676 800 684" stroke="#bfb39a" stroke-width="5" stroke-linecap="round"/>
  <g transform="translate(800 690)">
    <ellipse cx="0" cy="-60" rx="110" ry="140" fill="url(#fireCore)" filter="url(#b20)" opacity="0.9"/>
    <path d="M0 0 C-60 -10 -70 -80 -30 -130 C-28 -96 -10 -96 -10 -120 C-4 -160 -14 -190 -26 -220 C30 -190 60 -120 50 -60 C46 -30 30 -6 0 0Z" fill="url(#fireCore)"/>
    <path d="M0 -6 C-24 -12 -30 -46 -14 -76 C-8 -56 6 -60 6 -80 C22 -60 24 -30 14 -14 Z" fill="#fff4c2" opacity="0.85"/>
  </g>
  <path d="M794 690 L792 470 L800 440 L808 470 L806 690 Z" fill="#6d6455" opacity="0.9"/>
  <path d="M792 470 L800 440 L808 470" fill="#bfb39a"/>
  <path d="M770 690 L830 690" stroke="#2a1d12" stroke-width="10"/>
  ${motes(r, 80, { x0: 600, x1: 1000, y0: 200, y1: 680, color: '#ffb347', max: 2, op: 0.8 })}`;
  return wrap(defs, body);
}

// ── Map backdrop: a scorched vellum ──
export function vellum() {
  const defs = `
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.006" numOctaves="5" seed="4"/>
    <feColorMatrix type="matrix" values="0 0 0 0.10 0.03  0 0 0 0.08 0.025  0 0 0 0.06 0.02  0 0 0 0 1"/>
  </filter>
  <filter id="stains" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="8"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.2"/>
  </filter>`;
  const body = `
  <rect width="${W}" height="${H}" fill="#120d0a"/>
  <rect width="${W}" height="${H}" filter="url(#paper)" opacity="0.9"/>
  <rect width="${W}" height="${H}" filter="url(#stains)" opacity="0.18"/>`;
  return wrap(defs, body);
}
