// Combat screen rendering.
import { cardStats } from '../data/cards.js';
import { esc, renderCard, renderStatuses, hpBar, creatureImg } from './components.js';
import { emblem, INTENT_EMBLEM } from './art/emblems.js';

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
  const [main, extra] = info.type.split('_');
  const dmg = info.dmg !== undefined ? `<b>${info.dmg}${info.hits > 1 ? `×${info.hits}` : ''}</b>` : '';
  const extraIcon = extra && INTENT_EMBLEM[extra] ? emblem(INTENT_EMBLEM[extra], `ie-${extra}`) : '';
  const tip = `<b>${esc(info.name)}</b><br>This enemy ${INTENT_DESC[info.type]}${info.dmg !== undefined ? ` for ${info.dmg}${info.hits > 1 ? ` × ${info.hits}` : ''} damage` : ''}.`;
  return `<div class="intent intent-${main}" data-tip="${esc(tip)}">${emblem(INTENT_EMBLEM[main] || 'rune', `ie-${main}`)}${dmg}${extraIcon}</div>`;
}

function bossBar(c) {
  const boss = c.enemies.find((e) => !e.dead && ['drowned_king', 'rot_colossus', 'ember_tyrant'].includes(e.id));
  if (!boss) return '';
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  return `<div class="boss-bar">
    <div class="boss-name">${esc(boss.name)}</div>
    <div class="boss-track"><div class="boss-fill" style="width:${pct}%"></div>${boss.block ? `<span class="boss-block">${emblem('shield')}${boss.block}</span>` : ''}</div>
  </div>`;
}

export function combatScreen(c, ui) {
  const p = c.player;
  const targeting = !!ui.targeting;
  const visible = c.enemies.filter((e) => !e.dead || ui.dying.has(e.uid));
  const enemies = visible
    .map((e, i) => {
      const isBoss = ['drowned_king', 'rot_colossus', 'ember_tyrant'].includes(e.id);
      return `<div class="creature enemy ${e.dead ? 'dead' : ''} ${isBoss ? 'is-boss' : ''} ${targeting && !e.dead ? 'targetable' : ''} ${ui.acting === e.uid ? 'acting' : ''}"
        data-cid="${e.uid}" data-action="target" data-uid="${e.uid}" style="--delay:${(i * 0.7).toFixed(1)}s">
        ${e.dead ? '' : intentHtml(c, e)}
        <div class="sprite">${creatureImg(e.id, isBoss ? 0.95 : 0.8)}</div>
        <div class="cname">${esc(e.name)}${targeting ? ` <kbd>${i + 1}</kbd>` : ''}</div>
        ${isBoss ? '' : hpBar(e.hp, e.maxHp, e.block)}
        <div class="statuses">${renderStatuses(e)}</div>
      </div>`;
    })
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
    <div class="scene-fx" aria-hidden="true"><div class="fog f1"></div><div class="fog f2"></div><div class="particles">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 47) % 100}%;animation-delay:${((i * 0.77) % 9).toFixed(2)}s;--dx:${((i * 31) % 90) - 45}px"></i>`).join('')}</div></div>
    ${bossBar(c)}
    <div class="battlefield">
      <div class="side player-side">
        <div class="creature player" data-cid="player" style="--glow:${(0.35 + (p.light / p.maxLight) * 0.65).toFixed(2)}">
          <div class="lantern-light"></div>
          <div class="sprite">${creatureImg('player', 0.85)}</div>
          <div class="cname">The Lanternkeeper</div>
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
          <div class="light-label">${emblem('lantern')} <b>${p.light}</b></div><div class="light-pips">${lightPips}</div>
        </div>
        <button class="pile" data-action="view-pile" data-pile="draw" data-tip="Draw pile">${emblem('cards')} ${c.drawPile.length}</button>
      </div>
      <div class="hand">${hand}</div>
      <div class="hud-right">
        <button class="btn end-turn" data-action="end-turn" ${c.phase !== 'player' || ui.busy ? 'disabled' : ''}>${c.phase === 'player' ? 'End Turn' : 'Enemy Turn'}</button>
        <div class="pile-row">
          <button class="pile" data-action="view-pile" data-pile="discard" data-tip="Discard pile">${emblem('cards', 'discard')} ${c.discardPile.length}</button>
          <button class="pile" data-action="view-pile" data-pile="exhaust" data-tip="Exhausted cards">${emblem('smoke')} ${c.exhaustPile.length}</button>
        </div>
      </div>
    </div>
    ${targeting ? '<div class="target-hint">Choose a target &middot; <kbd>Esc</kbd> or right-click to cancel</div>' : ''}
  </div>`;
}

export function needsTarget(c, inst) {
  const s = cardStats(inst);
  return s.target === 'enemy' && c.alive().length > 1;
}
