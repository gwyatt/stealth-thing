// Combat screen rendering.
import { cardStats } from '../data/cards.js';
import { esc, renderCard, renderStatuses, hpBar } from './components.js';

const INTENT_ICON = {
  attack: '🗡️', attack_debuff: '🗡️', attack_defend: '🗡️', attack_buff: '🗡️',
  defend: '🛡️', defend_buff: '🛡️', buff: '⬆️', debuff: '🌀', buff_debuff: '🌀', summon: '📯', unknown: '❔',
};
const INTENT_DESC = {
  attack: 'intends to attack', attack_debuff: 'intends to attack and inflict a negative effect',
  attack_defend: 'intends to attack and defend', attack_buff: 'intends to attack and empower itself',
  defend: 'intends to Block', defend_buff: 'intends to Block and empower itself', buff: 'intends to empower itself',
  debuff: 'intends to inflict a negative effect', buff_debuff: 'intends to empower itself and curse you',
  summon: 'intends to summon allies', unknown: 'has unknown intentions',
};

function intentHtml(c, e) {
  const info = c.intentInfo(e);
  if (!info) return '';
  const icon = INTENT_ICON[info.type] || '❔';
  const dmg = info.dmg !== undefined ? `<b>${info.dmg}${info.hits > 1 ? `×${info.hits}` : ''}</b>` : '';
  const extra = info.type.includes('_') && info.dmg !== undefined ? `<span class="intent-extra">${INTENT_ICON[info.type.split('_')[1]] || ''}</span>` : '';
  const tip = `<b>${esc(info.name)}</b><br>This enemy ${INTENT_DESC[info.type]}${info.dmg !== undefined ? ` for ${info.dmg}${info.hits > 1 ? ` × ${info.hits}` : ''} damage` : ''}.`;
  return `<div class="intent intent-${info.type.split('_')[0]}" data-tip="${esc(tip)}">${icon}${dmg}${extra}</div>`;
}

export function combatScreen(c, ui) {
  const p = c.player;
  const targeting = !!ui.targeting;
  const enemies = c.enemies
    .filter((e) => !e.dead || ui.dying.has(e.uid))
    .map(
      (e, i) => `<div class="creature enemy ${e.dead ? 'dead' : ''} ${targeting && !e.dead ? 'targetable' : ''} ${ui.acting === e.uid ? 'acting' : ''} ${c.findEnemy(e.uid) && ENEMY_SIZE[e.id] ? ENEMY_SIZE[e.id] : ''}"
        data-cid="${e.uid}" data-action="target" data-uid="${e.uid}">
        ${e.dead ? '' : intentHtml(c, e)}
        <div class="sprite">${e.icon}</div>
        <div class="cname">${esc(e.name)}${targeting ? ` <kbd>${i + 1}</kbd>` : ''}</div>
        ${hpBar(e.hp, e.maxHp, e.block)}
        <div class="statuses">${renderStatuses(e)}</div>
      </div>`,
    )
    .join('');

  const lightPips = Array.from({ length: p.maxLight }, (_, i) => `<i class="${i < p.light ? 'lit' : ''}"></i>`).join('');
  const n = c.hand.length;
  const hand = c.hand
    .map((inst, i) => {
      const playable = c.canPlay(inst).ok && !ui.busy;
      const mid = (n - 1) / 2;
      const rot = (i - mid) * Math.min(5, 28 / Math.max(1, n));
      const lift = Math.abs(i - mid) ** 1.5 * 2.5;
      const isNew = !ui.seenHand.has(inst.uid);
      return renderCard(inst, {
        combat: c,
        playable,
        selected: ui.targeting && ui.targeting.uid === inst.uid,
        action: 'play-card',
        extraClass: `in-hand ${isNew ? 'drawn' : ''}`,
        style: `--rot:${rot}deg;--lift:${lift}px;--i:${i};z-index:${10 + i}`,
      });
    })
    .join('');

  return `<div class="combat ${c.isBoss ? 'boss-fight' : ''} ${targeting ? 'is-targeting' : ''}">
    <div class="battlefield">
      <div class="side player-side">
        <div class="creature player" data-cid="player">
          <div class="sprite">🧙‍♂️<span class="lantern-glow" style="--glow:${p.light / p.maxLight}">🏮</span></div>
          <div class="cname">Lanternkeeper</div>
          ${hpBar(p.hp, p.maxHp, p.block)}
          <div class="statuses">${renderStatuses(p)}</div>
        </div>
      </div>
      <div class="side enemy-side">${enemies}</div>
    </div>
    <div class="hud">
      <div class="hud-left">
        <div class="energy-orb" data-tip="<b>Energy</b><br>Spent to play cards. Refills each turn."><span>${p.energy}</span><small>/${p.maxEnergy}</small></div>
        <div class="light-meter" data-tip="<b>Light</b><br>Persists between turns. 1 Light wanes at the end of each turn. Max ${p.maxLight}.">
          <div class="light-label">🏮 <b>${p.light}</b></div><div class="light-pips">${lightPips}</div>
        </div>
        <button class="pile" data-action="view-pile" data-pile="draw" data-tip="Draw pile">📚 ${c.drawPile.length}</button>
      </div>
      <div class="hand">${hand}</div>
      <div class="hud-right">
        <button class="btn end-turn" data-action="end-turn" ${c.phase !== 'player' || ui.busy ? 'disabled' : ''}>${c.phase === 'player' ? 'End Turn' : 'Enemy Turn…'}</button>
        <div class="pile-row">
          <button class="pile" data-action="view-pile" data-pile="discard" data-tip="Discard pile">🗂️ ${c.discardPile.length}</button>
          <button class="pile" data-action="view-pile" data-pile="exhaust" data-tip="Exhausted cards">💨 ${c.exhaustPile.length}</button>
        </div>
      </div>
    </div>
    ${targeting ? '<div class="target-hint">Choose a target · <kbd>Esc</kbd> / right-click to cancel</div>' : ''}
  </div>`;
}

const ENEMY_SIZE = {
  drowned_king: 'huge', rot_colossus: 'huge', ember_tyrant: 'huge',
  gravewarden: 'large', bog_hag: 'large', spore_mother: 'large', rootbound_knight: 'large', carrion_lord: 'large',
  phoenix_knight: 'large', magma_behemoth: 'large',
  crypt_rat: 'small', sporeling: 'small', ember_imp: 'small',
};

export function needsTarget(c, inst) {
  const s = cardStats(inst);
  return s.target === 'enemy' && c.alive().length > 1;
}
