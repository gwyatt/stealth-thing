import { CARDS, cardStats } from '../data/cards.js';
import { RELICS } from '../data/relics.js';
import { POTIONS } from '../data/potions.js';
import { statusInfo } from '../data/statuses.js';
import { emblem, CARD_EMBLEM, RELIC_EMBLEM, POTION_COLOR, STATUS_EMBLEM } from './art/emblems.js';
import { CREATURE_SIZE } from './art/manifest.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));


export const KEYWORDS = {
  Light: 'A resource that persists between turns (max 10). At the end of your turn, 1 Light wanes.',
  Burn: 'At the start of its turn, the creature loses HP equal to its Burn, then Burn is reduced by 1.',
  Block: 'Prevents damage until the start of your next turn.',
  Weak: 'Weakened creatures deal 25% less attack damage.',
  Vulnerable: 'Vulnerable creatures take 50% more attack damage.',
  Frail: 'Frail creatures gain 25% less Block from cards.',
  Exhaust: 'Removed until the end of combat.',
  Ethereal: 'If this is in your hand at the end of your turn, it is Exhausted.',
  Unplayable: 'This card cannot be played.',
  Strength: 'Increases attack damage by 1 per stack.',
  Dexterity: 'Increases Block gained from cards by 1 per stack.',
  Thorns: 'When attacked, deals damage back to the attacker.',
  Energy: 'Spent to play cards. Refills at the start of your turn.',
};

const KEYWORD_RE = new RegExp(`\\b(${Object.keys(KEYWORDS).join('|')})\\b`, 'g');

// Render a card's rules text. With `combat`, {d}/{b} reflect current modifiers.
export function cardText(s, combat = null) {
  const v = s.v || {};
  let html = esc(s.text);
  html = html.replace(/\{(\w+)\}/g, (_, k) => {
    const base = v[k];
    if (base === undefined) return '?';
    let val = base;
    if (combat && k === 'd') val = combat.previewAttack(base);
    if (combat && k === 'b') val = combat.previewBlock(base);
    const cls = val > base ? 'num up' : val < base ? 'num down' : 'num';
    return `<span class="${cls}">${val}</span>`;
  });
  return html.replace(KEYWORD_RE, '<span class="kw">$1</span>');
}

export function cardKeywordTip(s) {
  const found = new Set();
  for (const m of s.text.matchAll(KEYWORD_RE)) found.add(m[1]);
  if (s.lightCost) found.add('Light');
  return [...found].map((k) => `<b>${k}</b>: ${KEYWORDS[k]}`).join('<br>');
}

const TYPE_LABEL = { attack: 'Attack', skill: 'Skill', power: 'Power', status: 'Status', curse: 'Curse' };

// inst: { uid?, id, up }. opts: { combat, playable, selected, extraClass, price, dataAction, dataIndex }
export function renderCard(inst, opts = {}) {
  const s = cardStats(inst);
  const cls = ['card', `type-${s.type}`, `rarity-${s.rarity}`];
  if (s.upgraded) cls.push('upgraded');
  if (opts.playable === false) cls.push('unplayable');
  if (opts.selected) cls.push('selected');
  if (opts.extraClass) cls.push(opts.extraClass);
  const attrs = [];
  if (inst.uid) attrs.push(`data-uid="${esc(inst.uid)}"`);
  if (opts.action) attrs.push(`data-action="${opts.action}"`);
  if (opts.index !== undefined) attrs.push(`data-index="${opts.index}"`);
  if (opts.style) attrs.push(`style="${opts.style}"`);
  const tip = cardKeywordTip(s);
  if (tip) attrs.push(`data-tip="${esc(tip)}"`);
  const cost = s.cost >= 0 ? `<div class="card-cost">${s.cost}</div>` : '';
  const light = s.lightCost ? `<div class="card-light" title="Light cost">${s.lightCost}</div>` : '';
  const price = opts.price !== undefined ? priceTag(opts.price, opts.cantAfford) : '';
  return `<div class="${cls.join(' ')}" ${attrs.join(' ')}>
    ${cost}${light}
    <div class="card-name">${esc(s.name)}</div>
    <div class="card-art">${emblem(CARD_EMBLEM[s.id] || 'rune')}</div>
    <div class="card-type">${TYPE_LABEL[s.type]}${s.rarity !== 'starter' && s.rarity !== 'special' && s.rarity !== 'curse' ? ` · ${s.rarity}` : ''}</div>
    <div class="card-text"><div>${cardText(s, opts.combat)}</div></div>
    ${price}
  </div>`;
}

export function relicTip(id) {
  const r = RELICS[id];
  return `<b>${esc(r.name)}</b> <i class="rarity-tag">${r.rarity}</i><br>${esc(r.desc)}`;
}

export function renderRelic(id, opts = {}) {
  const r = RELICS[id];
  if (!r) return '';
  return `<div class="relic ${opts.big ? 'big' : ''}" data-tip="${esc(relicTip(id))}">${relicIcon(id)}</div>`;
}

export function relicIcon(id) {
  const [name, tint] = RELIC_EMBLEM[id] || ['rune', '#a8875a'];
  return emblem(name, 'relic-emblem', `color:${tint}${name === 'flask' ? `;--liquid:${tint}` : ''}`);
}

export function potionIcon(id) {
  return emblem('flask', 'potion-emblem', `--liquid:${POTION_COLOR[id] || '#c83a3a'}`);
}

export function priceTag(n, tooMuch = false) {
  return `<span class="price ${tooMuch ? 'too-much' : ''}">${emblem('coin', 'coin')}${n}</span>`;
}

// A creature portrait. Display height follows the art's own proportions.
export function creatureImg(id, scale = 0.8) {
  const [w, h] = CREATURE_SIZE[id] || [200, 240];
  return `<img class="sprite-img" src="assets/art/creatures/${id}.svg" alt="" draggable="false" style="--h:${Math.round(h * scale)}px;--w:${Math.round(w * scale)}px">`;
}

export function potionTip(id) {
  const p = POTIONS[id];
  return `<b>${esc(p.name)}</b><br>${esc(p.desc)}`;
}

export function renderStatuses(target) {
  return Object.entries(target.statuses)
    .filter(([, n]) => n !== 0)
    .map(([k, n]) => {
      const info = statusInfo(k);
      const tip = `<b>${esc(info.name)}</b><br>${esc(info.desc(n))}`;
      const cls = info.kind === 'debuff' || n < 0 ? 'debuff' : 'buff';
      const shown = k === 'rebirth' ? '' : n;
      return `<span class="status ${cls} st-${k}" data-tip="${esc(tip)}">${emblem(STATUS_EMBLEM[k] || 'rune')}<b>${shown}</b></span>`;
    })
    .join('');
}

export function hpBar(cur, max, block = 0) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  return `<div class="hpbar ${block > 0 ? 'has-block' : ''}">
    <div class="hpbar-fill" style="width:${pct}%"></div>
    <div class="hpbar-text">${block > 0 ? `<span class="blockbadge">${emblem('shield')}${block}</span>` : ''}${Math.max(0, cur)} / ${max}</div>
  </div>`;
}

export function cardName(id, up = false) {
  return CARDS[id].name + (up ? '+' : '');
}
