// A simple greedy bot that plays full runs headlessly. Used by tests and the balance simulator.
import { cardStats } from '../src/data/cards.js';
import { POTIONS } from '../src/data/potions.js';
import { MAP_ROWS } from '../src/engine/map.js';

function incomingDamage(c) {
  let total = 0;
  for (const e of c.alive()) {
    const info = c.intentInfo(e);
    if (info && info.dmg) total += info.dmg * info.hits;
  }
  return total;
}

function scoreCard(c, inst, threat) {
  const s = cardStats(inst);
  const v = s.v || {};
  const target = c.alive().sort((a, b) => a.hp - b.hp)[0];
  let score = 0;
  if (s.type === 'power') score += c.turn <= 2 ? 28 : 10;
  if (v.d) {
    const per = c.previewAttack(v.d, s.target === 'enemy' ? target : null) * (v.h || 1);
    score += s.target === 'all' ? per * c.alive().length : Math.max(0, Math.min(per, target.hp + target.block) - target.block * 0.5);
  }
  if (s.id === 'inferno_fist') score += v.m * c.player.light;
  if (v.b) {
    const need = Math.max(0, threat - c.player.block);
    score += Math.min(c.previewBlock(v.b), need) * 1.2 + (c.status(c.player, 'thorns') ? 2 : 0);
  }
  if (s.id === 'flare') score += c.player.light * v.m * c.alive().length - 6;
  if (s.id === 'supernova') score += c.player.light * v.m - 10;
  if ((s.id === 'stoke' || s.id === 'ignition') && c.player.light < 8) score += 8;
  if (v.m && !v.d && !v.b && s.type !== 'power') score += v.m * 2;
  if (s.type === 'status' || s.type === 'curse') score = 0.5;
  return score / Math.max(0.6, s.cost);
}

export function playTurn(c) {
  let guard = 0;
  while (!c.over && c.phase === 'player' && guard++ < 40) {
    const threat = incomingDamage(c);
    if (c.player.hp < c.player.maxHp * 0.5 || c.isBoss) {
      const slot = c.run.potions.findIndex((p) => p && POTIONS[p].id !== 'smoke_bomb');
      if (slot >= 0) {
        const target = c.alive().sort((a, b) => a.hp - b.hp)[0];
        c.usePotion(slot, target && target.uid);
        continue;
      }
    }
    const playable = c.hand.filter((h) => c.canPlay(h).ok);
    if (!playable.length) break;
    playable.sort((a, b) => scoreCard(c, b, threat) - scoreCard(c, a, threat));
    const best = playable[0];
    const s = cardStats(best);
    const target = c.alive().sort((a, b) => a.hp - b.hp)[0];
    const res = c.playCard(best.uid, s.target === 'enemy' ? target.uid : null);
    if (!res.ok) break;
  }
  if (!c.over) c.endTurn();
}

export function fightCombat(game, maxTurns = 80) {
  const c = game.startCombat();
  while (!c.over && c.turn < maxTurns) playTurn(c);
  if (!c.over) {
    // Stalemate guard: treat as a loss.
    c.player.hp = 0;
    c.over = true;
  }
  game.finishCombat();
  return c;
}

const RARITY_SCORE = { common: 1, uncommon: 2, rare: 3 };
function pickCardReward(game, choices) {
  if (game.run.deck.length > 28) return -1;
  let best = -1;
  let bestScore = -1;
  choices.forEach((ch, i) => {
    const s = cardStats({ id: ch.id, up: ch.up });
    let score = RARITY_SCORE[s.rarity] + (s.type === 'power' ? 1 : 0) + (ch.up ? 0.5 : 0);
    const attacks = game.run.deck.filter((c) => cardStats(c).type === 'attack').length;
    if (s.type === 'attack' && attacks < game.run.deck.length * 0.4) score += 1;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

function pickNode(game, nodes) {
  const r = game.run;
  const pref = (n) => {
    if (n.type === 'rest') return r.hp < r.maxHp * 0.6 ? 10 : 3;
    if (n.type === 'elite') return r.hp > r.maxHp * 0.7 ? 6 : -5;
    if (n.type === 'shop') return r.gold > 150 ? 7 : 1;
    if (n.type === 'combat') return 4;
    if (n.type === 'event') return 4;
    return 5;
  };
  return nodes.slice().sort((a, b) => pref(b) - pref(a))[0];
}

// Plays a full run. Returns the game. Throws on engine errors.
export function playRun(game, { maxSteps = 2000 } = {}) {
  let steps = 0;
  while (!game.run.over && steps++ < maxSteps) {
    const room = game.run.room;
    if (!room) {
      const nodes = game.availableNodes();
      if (!nodes.length) throw new Error('No available nodes but no room');
      const n = pickNode(game, nodes);
      game.enterNode(n.row, n.col);
      continue;
    }
    const sel = game.pendingSelect();
    if (sel) {
      const opts = game.selectableCards(sel.purpose);
      if (opts.length) {
        const pick = sel.purpose === 'remove' ? (opts.find((c) => c.id === 'strike') || opts[0]) : opts[0];
        game.applySelect(pick.uid);
      } else game.finishSelect();
      continue;
    }
    switch (room.type) {
      case 'blessing': game.chooseBlessing(room.options[0].id); break;
      case 'actIntro': game.dismissRoom(); break;
      case 'combat': fightCombat(game); break;
      case 'reward': {
        room.rewards.forEach((rw, i) => {
          if (rw.type === 'cards') {
            const best = pickCardReward(game, rw.choices);
            if (best >= 0) game.claimReward(i, best);
          }
          else if (rw.type === 'bossRelic') game.claimReward(i, rw.ids[0]);
          else game.claimReward(i);
        });
        game.leaveRewards();
        break;
      }
      case 'rest':
        if (game.run.hp < game.run.maxHp * 0.55 && game.canRest()) game.rest();
        else {
          const up = game.selectableCards('upgrade');
          if (up.length) game.smith(up[0].uid);
          else if (game.canRest()) game.rest();
        }
        game.dismissRoom();
        break;
      case 'treasure': game.openTreasure(); game.dismissRoom(); break;
      case 'shop': {
        room.stock.cards.forEach((_, i) => game.buy('cards', i));
        room.stock.relics.forEach((_, i) => game.buy('relics', i));
        if (!room.stock.removeUsed) {
          const strike = game.run.deck.find((c) => c.id === 'strike');
          if (strike) game.buyRemoval(strike.uid);
        }
        game.dismissRoom();
        break;
      }
      case 'event': {
        if (!room.result) {
          const opts = game.eventOptions();
          const i = opts.findIndex((o) => !o.disabled);
          game.chooseEventOption(i);
        } else game.dismissRoom();
        break;
      }
      case 'gameOver': return game;
      default: throw new Error(`Bot cannot handle room ${room.type}`);
    }
    if (game.run.pos && game.run.pos.row > MAP_ROWS) throw new Error('Position past boss');
  }
  if (steps >= maxSteps) throw new Error('Run did not finish');
  return game;
}
