// HTML builders for out-of-combat screens. Pure functions of game state.
import { CARDS, cardStats, REWARD_POOL } from '../data/cards.js';
import { RELICS } from '../data/relics.js';
import { POTIONS } from '../data/potions.js';
import { ACT_NAMES, ENEMIES } from '../data/enemies.js';
import { MAP_ROWS, MAP_COLS } from '../engine/map.js';
import { esc, renderCard, renderRelic, relicTip, potionTip, relicIcon, potionIcon, priceTag, creatureImg } from './components.js';
import { emblem, NODE_EMBLEM } from './art/emblems.js';

const NODE_NAMES = { combat: 'Monster', elite: 'Elite', rest: 'Campfire', shop: 'Merchant', event: 'Unknown', treasure: 'Treasure', boss: 'Boss' };
const EVENT_EMBLEM = {
  forgotten_shrine: 'idol', wandering_smith: 'mace', pool_of_embers: 'flame', hooded_merchant: 'pouch', cracked_chest: 'chest',
  whispering_skull: 'skull', lost_pilgrim: 'lantern', mirror_pool: 'eye', fungal_feast: 'leaf', molten_altar: 'pyre', gambling_imp: 'coin',
};

export function titleScreen({ hasSave, profile, seed }) {
  return `<div class="title-screen">
    <div class="embers" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i * 0.53) % 7}s;--dx:${((i * 29) % 80) - 40}px"></i>`).join('')}</div>
    <div class="title-block">
      <h1 class="logo">Emberdeep</h1>
      <p class="tagline">The last flame descends into the dark</p>
      <nav class="title-menu">
        ${hasSave ? '<button class="menu-item" data-action="continue">Continue</button>' : ''}
        <button class="menu-item" data-action="new-run">New Journey</button>
        <button class="menu-item" data-action="open-help">How to Play</button>
        <button class="menu-item" data-action="open-library">Codex</button>
      </nav>
      <details class="seed-box">
        <summary>Custom seed</summary>
        <input id="seed-input" maxlength="16" placeholder="Random" value="${esc(seed || '')}" />
      </details>
      <div class="profile">Journeys ${profile.runs} &middot; Victories ${profile.wins} &middot; Deepest floor ${profile.bestFloor} &middot; Best score ${profile.bestScore}</div>
    </div>
  </div>`;
}

export function topBar(game, { inCombat = false, combat = null } = {}) {
  const r = game.run;
  const hp = combat ? combat.player.hp : r.hp;
  const maxHp = combat ? combat.player.maxHp : r.maxHp;
  const potions = r.potions
    .map((p, i) =>
      p
        ? `<button class="potion-slot filled" data-action="potion" data-slot="${i}" data-tip="${esc(potionTip(p))}">${potionIcon(p)}</button>`
        : `<span class="potion-slot empty" data-tip="Empty potion slot">${emblem('flask', 'potion-emblem empty')}</span>`,
    )
    .join('');
  return `<header class="topbar">
    <div class="tb-group">
      <span class="tb-hp" data-tip="Hit Points">${emblem('heart')} ${Math.max(0, hp)}/${maxHp}</span>
      <span class="tb-gold" data-tip="Gold">${emblem('coin')} ${r.gold}</span>
      <span class="tb-potions">${potions}</span>
    </div>
    <div class="tb-group tb-mid">
      <span class="tb-act">Act ${r.act}: ${ACT_NAMES[r.act]}</span>
      <span class="tb-floor">Floor ${r.floor}</span>
    </div>
    <div class="tb-group">
      <button class="tb-btn" data-action="open-deck" data-tip="View your deck (D)">${emblem('cards')} ${r.deck.length}</button>
      ${inCombat ? '' : `<button class="tb-btn" data-action="open-map-peek" data-tip="View map (M)">${emblem('map')}</button>`}
      <button class="tb-btn" data-action="open-settings" data-tip="Settings">${emblem('gear')}</button>
    </div>
  </header>
  <div class="relic-bar">${r.relics.map((id) => renderRelic(id)).join('')}</div>`;
}

function jitter(row, col) {
  const h = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
  return (h - Math.floor(h)) - 0.5;
}

export const MAP_ROW_H = 74;

export function mapView(game, { peek = false } = {}) {
  const { map, pos, path } = game.run;
  const available = peek ? [] : game.availableNodes();
  const isAvail = (n) => available.some((a) => a.row === n.row && a.col === n.col);
  const visited = new Set(path.map((p) => `${p.row}-${p.col}`));
  const H = (MAP_ROWS + 1) * MAP_ROW_H + 80;
  const xy = (n) => {
    if (n.type === 'boss') return { x: 50, y: 50 };
    const x = ((n.col + 0.5) / MAP_COLS) * 100 + jitter(n.row, n.col) * 5;
    const y = H - 50 - n.row * MAP_ROW_H + jitter(n.col, n.row) * 14;
    return { x, y };
  };

  let lines = '';
  map.rows.forEach((row) =>
    row.forEach((n) => {
      const a = xy(n);
      const targets = n.row === MAP_ROWS - 1 ? [map.boss] : n.next.map((c) => map.rows[n.row + 1].find((m) => m.col === c));
      for (const t of targets) {
        const b = xy(t);
        const walked = visited.has(`${n.row}-${n.col}`) && (t.type === 'boss' ? visited.has(`${MAP_ROWS}-${t.col}`) : visited.has(`${t.row}-${t.col}`));
        lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${walked ? 'walked' : ''}" vector-effect="non-scaling-stroke"/>`;
      }
    }),
  );

  const nodeHtml = (n) => {
    const p = xy(n);
    const key = `${n.row}-${n.col}`;
    const cls = ['map-node', `node-${n.type}`];
    if (isAvail(n)) cls.push('available');
    if (visited.has(key)) cls.push('visited');
    if (pos && pos.row === n.row && pos.col === n.col) cls.push('current');
    const icon = emblem(NODE_EMBLEM[n.type]);
    const label = NODE_NAMES[n.type];
    const attrs = isAvail(n) ? `data-action="enter-node" data-row="${n.row}" data-col="${n.col}"` : '';
    return `<button class="${cls.join(' ')}" style="left:${p.x}%;top:${p.y}px" ${attrs} data-tip="${label}" ${isAvail(n) ? '' : 'tabindex="-1"'}>${icon}</button>`;
  };

  const nodes = map.rows.flat().map(nodeHtml).join('') + nodeHtml(map.boss);
  const legend = Object.entries(NODE_EMBLEM)
    .filter(([k]) => k !== 'boss')
    .map(([k, i]) => `<span>${emblem(i)} ${NODE_NAMES[k]}</span>`)
    .join('');

  return `<div class="map-screen ${peek ? 'peek' : ''}">
    <div class="map-legend">${legend}</div>
    <div class="map-scroll" id="map-scroll">
      <div class="map-canvas" style="height:${H}px">
        <svg class="map-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none">${lines}</svg>
        ${nodes}
      </div>
    </div>
    ${peek ? '' : `<div class="map-hint">${available.length ? `Choose your path. ${esc(bossName(game))} awaits at its end.` : ''}</div>`}
  </div>`;
}

export function bossName(game) {
  const ids = { 1: 'drowned_king', 2: 'rot_colossus', 3: 'ember_tyrant' };
  return ENEMIES[ids[game.run.act]].name;
}

export function rewardScreen(game) {
  const room = game.run.room;
  const title = room.kind === 'boss' ? 'Spoils of a Great Foe' : room.kind === 'elite' ? 'Spoils of the Hunt' : 'Spoils';
  const items = room.rewards
    .map((r, i) => {
      if (r.claimed) return '';
      switch (r.type) {
        case 'gold':
          return `<button class="reward-item" data-action="claim" data-index="${i}">${emblem('coin', 'ri-gold')} <span>${r.amount} Gold</span></button>`;
        case 'potion': {
          const full = !game.run.potions.includes(null);
          return `<button class="reward-item ${full ? 'disabled' : ''}" data-action="claim" data-index="${i}" data-tip="${esc(potionTip(r.id))}">${potionIcon(r.id)} <span>${POTIONS[r.id].name}${full ? ' (slots full)' : ''}</span></button>`;
        }
        case 'relic':
          return `<button class="reward-item" data-action="claim" data-index="${i}" data-tip="${esc(relicTip(r.id))}">${relicIcon(r.id)} <span>${RELICS[r.id].name}</span></button>`;
        case 'bossRelic':
          return `<button class="reward-item special" data-action="open-boss-relic" data-index="${i}">${emblem('crown', 'ri-gold')} <span>Choose a Boss Relic</span></button>`;
        case 'cards':
          return `<button class="reward-item" data-action="open-card-reward" data-index="${i}">${emblem('cards', 'ri-card')} <span>Add a card to your deck</span></button>`;
        default:
          return '';
      }
    })
    .join('');
  const leaveLabel = room.kind === 'boss' ? (game.run.act >= 3 ? 'Claim Victory' : 'Descend Deeper') : 'Proceed';
  return `<div class="panel-screen reward-screen">
    <div class="panel">
      <h2>${title}</h2>
      <div class="reward-list">${items || '<p class="muted">Nothing left to collect.</p>'}</div>
      <button class="btn primary" data-action="leave-rewards">${leaveLabel}</button>
    </div>
  </div>`;
}

export function cardRewardOverlay(game, index) {
  const r = game.run.room.rewards[index];
  return `<div class="overlay-inner">
    <h2>Choose a Card</h2>
    <div class="card-row">${r.choices.map((c, i) => renderCard(c, { action: 'take-card', index: i, extraClass: 'pickable' })).join('')}</div>
    <div class="overlay-actions">
      <button class="btn" data-action="close-overlay">Skip</button>
    </div>
  </div>`;
}

export function bossRelicOverlay(game, index) {
  const r = game.run.room.rewards[index];
  return `<div class="overlay-inner">
    <h2>Choose a Boss Relic</h2>
    <div class="boss-relics">${r.ids
      .map(
        (id) => `<button class="boss-relic" data-action="take-boss-relic" data-id="${id}">
          <div class="relic big">${relicIcon(id)}</div>
          <div class="br-name">${esc(RELICS[id].name)}</div>
          <div class="br-desc">${esc(RELICS[id].desc)}</div>
        </button>`,
      )
      .join('')}</div>
    <div class="overlay-actions"><button class="btn" data-action="close-overlay">Back</button></div>
  </div>`;
}

export function shopScreen(game) {
  const { stock } = game.run.room;
  const gold = game.run.gold;
  const cards = stock.cards
    .map((c, i) =>
      c.sold
        ? '<div class="card-slot sold">Sold</div>'
        : `<div class="shop-item ${c.sale ? 'on-sale' : ''}">${renderCard({ id: c.id }, { action: 'buy-card', index: i, price: game.price(c.price), cantAfford: gold < game.price(c.price), extraClass: 'pickable' })}${c.sale ? '<div class="sale-tag">SALE</div>' : ''}</div>`,
    )
    .join('');
  const relics = stock.relics
    .map((r, i) =>
      r.sold
        ? '<div class="shop-relic sold">Sold</div>'
        : `<button class="shop-relic" data-action="buy-relic" data-index="${i}" data-tip="${esc(relicTip(r.id))}">
            <span class="relic big">${relicIcon(r.id)}</span>${priceTag(game.price(r.price), gold < game.price(r.price))}</button>`,
    )
    .join('');
  const potions = stock.potions
    .map((p, i) =>
      p.sold
        ? '<div class="shop-relic sold">Sold</div>'
        : `<button class="shop-relic" data-action="buy-potion" data-index="${i}" data-tip="${esc(potionTip(p.id))}">
            <span class="relic big">${potionIcon(p.id)}</span>${priceTag(game.price(p.price), gold < game.price(p.price))}</button>`,
    )
    .join('');
  const rp = game.removePrice();
  const removal = stock.removeUsed
    ? '<div class="shop-relic sold">Used</div>'
    : `<button class="shop-relic removal" data-action="shop-remove" data-tip="Remove a card from your deck.">
        <span class="relic big">${emblem('flame', 'relic-emblem', 'color:#c8602a')}</span>${priceTag(rp, gold < rp)}</button>`;
  return `<div class="shop-screen">
    <div class="merchant"><div class="merchant-portrait">${creatureImg('merchant', 0.62)}</div><p>"Heh heh... Light's scarce down here, friend. Everything else has a price."</p></div>
    <section><h3>Cards</h3><div class="card-row shop-cards">${cards}</div></section>
    <div class="shop-lower">
      <section><h3>Relics</h3><div class="shop-row">${relics}</div></section>
      <section><h3>Potions</h3><div class="shop-row">${potions}</div></section>
      <section><h3>Card Removal</h3><div class="shop-row">${removal}</div></section>
    </div>
    <button class="btn primary leave" data-action="leave-room">Leave Shop</button>
  </div>`;
}

export function restScreen(game) {
  const room = game.run.room;
  if (room.done) {
    const msg = room.result === 'rested' ? 'You rest by the fire. Your wounds close.' : 'You temper a card in the flames.';
    return `<div class="panel-screen"><div class="panel campfire">
      <p class="event-text">${msg}</p>
      <button class="btn primary" data-action="leave-room">Continue</button></div></div>`;
  }
  const canRest = game.canRest();
  const canSmith = game.hasUpgradable();
  return `<div class="panel-screen"><div class="panel campfire">
    <h2>Campfire</h2>
    <p class="muted">Ash and old bones ring the fire. For a moment, the dark keeps its distance.</p>
    <div class="choice-row">
      <button class="choice ${canRest ? '' : 'disabled'}" data-action="rest" ${canRest ? '' : 'disabled'}>
        <span class="choice-icon">${emblem('heart')}</span><b>Rest</b><span>${canRest ? `Heal ${game.restHealAmount()} HP.` : 'The Hungry Lantern forbids it.'}</span></button>
      <button class="choice ${canSmith ? '' : 'disabled'}" data-action="smith" ${canSmith ? '' : 'disabled'}>
        <span class="choice-icon">${emblem('mace')}</span><b>Smith</b><span>Upgrade a card.</span></button>
    </div>
  </div></div>`;
}

export function treasureScreen(game) {
  const room = game.run.room;
  if (!room.opened) {
    return `<div class="panel-screen"><div class="panel">
      <h2>Treasure</h2>
      <button class="chest" data-action="open-chest">${emblem('chest')}</button>
      <p class="muted">Click the chest to open it.</p></div></div>`;
  }
  const relic = room.relic ? `<div class="treasure-relic">${renderRelic(room.relic, { big: true })}<div><b>${esc(RELICS[room.relic].name)}</b><br><span class="muted">${esc(RELICS[room.relic].desc)}</span></div></div>` : '';
  return `<div class="panel-screen"><div class="panel">
    <h2>Treasure</h2>
    <div class="chest open">${emblem('chest')}</div>
    ${relic}
    <p>${priceTag(room.gold)} Gold</p>
    <button class="btn primary" data-action="leave-room">Continue</button></div></div>`;
}

export function eventScreen(game) {
  const room = game.run.room;
  const def = game.eventDef();
  let body;
  if (!room.result) {
    body = `<div class="event-options">${game
      .eventOptions()
      .map(
        (o, i) =>
          `<button class="event-option ${o.disabled ? 'disabled' : ''}" data-action="event-option" data-index="${i}" ${o.disabled ? 'disabled' : ''}>
            <b>[${esc(o.label)}]</b> <span>${esc(o.desc)}</span></button>`,
      )
      .join('')}</div>`;
  } else {
    const transformed = room.result.select && room.result.select.resultCard ? `<p>It became <b>${esc(CARDS[room.result.select.resultCard].name)}</b>.</p>` : '';
    body = `<p class="event-result">${esc(room.result.text)}</p>${transformed}
      <button class="btn primary" data-action="leave-room">Continue</button>`;
  }
  return `<div class="panel-screen"><div class="panel event">
    <div class="event-icon">${emblem(EVENT_EMBLEM[def.id] || 'rune')}</div>
    <h2>${esc(def.name)}</h2>
    <p class="event-text">${esc(def.text)}</p>
    ${body}
  </div></div>`;
}

export function blessingScreen(game) {
  const room = game.run.room;
  return `<div class="panel-screen"><div class="panel event">
    <div class="event-icon">${emblem('candle')}</div>
    <h2>The Ember Spirit</h2>
    <p class="event-text">At the mouth of the Deep, a warm voice rises from your lantern.
      "Keeper. The dark below has swallowed every flame but yours. Take a gift before you descend."</p>
    <div class="event-options">${room.options
      .map((o) => `<button class="event-option" data-action="blessing" data-id="${o.id}"><span>${esc(o.label)}</span></button>`)
      .join('')}</div>
  </div></div>`;
}

export function actIntroScreen(game) {
  const n = game.run.act;
  const flavor = {
    2: 'The crypt gives way to a cavern choked with luminous rot. Spores drift like snow.',
    3: 'Heat rises from below. At the bottom of the world, something sits upon a throne of embers.',
  }[n] || '';
  return `<div class="panel-screen act-intro"><div class="panel">
    <div class="act-num">Act ${['', 'I', 'II', 'III'][n]}</div>
    <h1>${ACT_NAMES[n]}</h1>
    <p class="event-text">${flavor}</p>
    <p class="muted">You recover some of your strength.</p>
    <button class="btn primary" data-action="leave-room">Descend</button>
  </div></div>`;
}

export function gameOverScreen(game) {
  const r = game.run;
  const s = r.stats;
  const won = r.won;
  return `<div class="panel-screen"><div class="panel gameover ${won ? 'won' : 'lost'}">
    <div class="event-icon">${emblem(won ? 'crown' : 'skull')}</div>
    <h1>${won ? 'The Flame Endures' : 'Extinguished'}</h1>
    <p class="event-text">${won ? 'The Ember Tyrant falls, and its stolen fire returns to the world above. Your lantern burns brighter than ever.' : `You fell on floor ${r.floor} of ${ACT_NAMES[r.act]}.`}</p>
    <table class="stats">
      <tr><td>Score</td><td><b>${game.score()}</b></td></tr>
      <tr><td>Floors climbed</td><td>${s.floors}</td></tr>
      <tr><td>Enemies slain</td><td>${s.kills}</td></tr>
      <tr><td>Elites slain</td><td>${s.elites}</td></tr>
      <tr><td>Bosses slain</td><td>${s.bosses}</td></tr>
      <tr><td>Damage dealt</td><td>${s.damageDealt}</td></tr>
      <tr><td>Cards played</td><td>${s.cardsPlayed}</td></tr>
      <tr><td>Gold earned</td><td>${s.goldEarned}</td></tr>
      <tr><td>Seed</td><td><code>${esc(r.seed)}</code></td></tr>
    </table>
    <div class="overlay-actions">
      <button class="btn" data-action="open-deck">View Deck</button>
      <button class="btn primary" data-action="to-title">Main Menu</button>
    </div>
  </div></div>`;
}

export function deckOverlay(cards, title, { action = null, upgradePreview = false, empty = 'No cards.', cancel = 'Close' } = {}) {
  const order = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
  const sorted = cards.slice().sort((a, b) => {
    const sa = cardStats(a);
    const sb = cardStats(b);
    return order[sa.type] - order[sb.type] || sa.name.localeCompare(sb.name);
  });
  const body = sorted.length
    ? sorted.map((c) => renderCard(upgradePreview ? { ...c, up: true } : c, { action, extraClass: action ? 'pickable' : '' })).join('')
    : `<p class="muted">${empty}</p>`;
  return `<div class="overlay-inner">
    <h2>${esc(title)}</h2>
    <div class="card-grid">${body}</div>
    <div class="overlay-actions"><button class="btn" data-action="close-overlay">${cancel}</button></div>
  </div>`;
}

export function libraryOverlay() {
  const groups = ['starter', 'common', 'uncommon', 'rare'];
  const all = Object.values(CARDS);
  return `<div class="overlay-inner">
    <h2>Card Library</h2>
    ${groups
      .map(
        (g) => `<h3 class="lib-h">${g[0].toUpperCase() + g.slice(1)}</h3>
      <div class="card-grid">${all.filter((c) => c.rarity === g).map((c) => renderCard({ id: c.id })).join('')}</div>`,
      )
      .join('')}
    <h3 class="lib-h">Relics</h3>
    <div class="relic-grid">${Object.values(RELICS).map((r) => `<div class="lib-relic">${renderRelic(r.id, { big: true })}<div><b>${esc(r.name)}</b> <i class="rarity-tag">${r.rarity}</i><br><span class="muted">${esc(r.desc)}</span></div></div>`).join('')}</div>
    <div class="overlay-actions"><button class="btn" data-action="close-overlay">Close</button></div>
  </div>`;
}

export function helpOverlay() {
  return `<div class="overlay-inner help">
    <h2>How to Play</h2>
    <p>You are the <b>Lanternkeeper</b>, descending through three acts of the Deep. Each act ends with a boss. Defeat the Ember Tyrant at the bottom to win.</p>
    <h3>The Map</h3>
    <p>Choose your path down through each act. <b>Monsters</b> give gold and cards. <b>Elites</b> are deadly but carry relics. <b>Campfires</b> let you heal or upgrade a card. <b>Merchants</b> sell cards, relics, potions and card removal. <b>Unknown</b> rooms hold strange encounters. <b>Treasure</b> holds a relic.</p>
    <h3>Combat</h3>
    <p>Each turn you get <b>3 Energy</b> and draw <b>5 cards</b>. Click a card to play it; attacks that need a target are then aimed by clicking an enemy. Enemies show their <b>intent</b> above their heads, so you know what's coming. <b>Block</b> absorbs damage and expires at the start of your next turn.</p>
    <h3>Light</h3>
    <p>Your unique resource. Many cards and relics generate <b>Light</b>; others grow stronger with it or spend it for big effects. Light persists between turns (max 10), but <b>1 Light wanes</b> at the end of each turn.</p>
    <h3>Burn</h3>
    <p>Burn makes an enemy lose HP at the start of its turn, then decreases by 1. It ignores Block.</p>
    <h3>Controls</h3>
    <p><kbd>1</kbd>–<kbd>9</kbd> select a card (then a number picks a target) · <kbd>E</kbd> end turn · <kbd>Esc</kbd> cancel · <kbd>D</kbd> deck · <kbd>M</kbd> map.</p>
    <p class="muted">The game saves automatically between rooms.</p>
    <div class="overlay-actions"><button class="btn primary" data-action="close-overlay">Got it</button></div>
  </div>`;
}

export function settingsOverlay({ muted, inRun }) {
  return `<div class="overlay-inner small">
    <h2>Settings</h2>
    <div class="settings-list">
      <button class="btn" data-action="toggle-sound">${muted ? 'Sound: Off' : 'Sound: On'}</button>
      <button class="btn" data-action="open-help">How to Play</button>
      ${inRun ? '<button class="btn" data-action="to-title">Save &amp; Quit to Menu</button><button class="btn danger" data-action="abandon">Abandon Run</button>' : ''}
    </div>
    <div class="overlay-actions"><button class="btn" data-action="close-overlay">Close</button></div>
  </div>`;
}

export function potionOverlay(game, slot, { inCombat, canUseNow }) {
  const id = game.run.potions[slot];
  const p = POTIONS[id];
  const usable = inCombat ? canUseNow : !!p.useOutside;
  return `<div class="overlay-inner small">
    <div class="event-icon">${potionIcon(id)}</div>
    <h2>${esc(p.name)}</h2>
    <p>${esc(p.desc)}</p>
    <div class="overlay-actions">
      ${usable ? `<button class="btn primary" data-action="use-potion" data-slot="${slot}">Drink</button>` : '<span class="muted">Can only be used in combat.</span>'}
      <button class="btn danger" data-action="discard-potion" data-slot="${slot}">Discard</button>
      <button class="btn" data-action="close-overlay">Cancel</button>
    </div>
  </div>`;
}

export function confirmOverlay(text, action) {
  return `<div class="overlay-inner small">
    <h2>Are you sure?</h2><p>${esc(text)}</p>
    <div class="overlay-actions">
      <button class="btn danger" data-action="${action}">Yes</button>
      <button class="btn" data-action="close-overlay">No</button>
    </div></div>`;
}

export { REWARD_POOL };
