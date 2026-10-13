import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rng } from '../src/core/rng.js';
import { Game } from '../src/engine/game.js';
import { Combat } from '../src/engine/combat.js';
import { generateMap, MAP_ROWS, TREASURE_ROW } from '../src/engine/map.js';
import { CARDS, cardStats, REWARD_POOL } from '../src/data/cards.js';
import { ENEMIES, ENCOUNTERS } from '../src/data/enemies.js';
import { RELICS } from '../src/data/relics.js';
import { EVENTS } from '../src/data/events.js';
import { playRun } from '../tools/bot.js';

function freshCombat(enemies = ['ghoul'], deck = null) {
  const g = Game.newRun('TEST');
  g.run.room = null;
  if (deck) {
    g.run.deck = [];
    for (const id of deck) g.addCardToDeck(id);
  }
  g.run.relics = [];
  const c = new Combat(g.run, enemies, { seed: 42 });
  c.start();
  return { g, c };
}

test('rng is deterministic', () => {
  const a = new Rng(123);
  const b = new Rng(123);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
});

test('every card, enemy move and relic is well-formed', () => {
  for (const c of Object.values(CARDS)) {
    assert.ok(c.name && c.type && c.rarity, c.id);
    assert.ok(typeof c.text === 'string', c.id);
    if (!c.unplayable) assert.equal(typeof c.play, 'function', c.id);
  }
  for (const e of Object.values(ENEMIES)) {
    assert.ok(Object.keys(e.moves).length > 0, e.id);
  }
  for (const act of Object.values(ENCOUNTERS)) {
    for (const pool of Object.values(act)) for (const enc of pool) for (const id of enc) assert.ok(ENEMIES[id], id);
  }
  for (const r of Object.values(RELICS)) assert.ok(r.name && r.desc && r.icon, r.id);
  assert.ok(REWARD_POOL.length >= 30);
});

test('map: rows connect upward, special rows are fixed', () => {
  for (let s = 1; s < 30; s++) {
    const map = generateMap(new Rng(s));
    assert.equal(map.rows.length, MAP_ROWS);
    for (const n of map.rows[0]) assert.equal(n.type, 'combat');
    for (const n of map.rows[TREASURE_ROW]) assert.equal(n.type, 'treasure');
    for (const n of map.rows[MAP_ROWS - 1]) assert.equal(n.type, 'rest');
    for (let r = 0; r < MAP_ROWS - 1; r++) {
      for (const n of map.rows[r]) {
        assert.ok(n.next.length > 0, `dead end at ${r}`);
        for (const c of n.next) assert.ok(map.rows[r + 1].some((m) => m.col === c));
      }
    }
    for (let r = 0; r < 4; r++) for (const n of map.rows[r]) assert.ok(!['elite', 'rest'].includes(n.type));
  }
});

test('strike deals damage, vulnerable multiplies, block absorbs', () => {
  const { c } = freshCombat(['ghoul'], Array(10).fill('strike'));
  const e = c.alive()[0];
  const hp = e.hp;
  c.playCard(c.hand[0].uid, e.uid);
  assert.equal(e.hp, hp - 6);
  c.apply(e, 'vulnerable', 1);
  c.playCard(c.hand[0].uid, e.uid);
  assert.equal(e.hp, hp - 6 - 9);
  e.block = 5;
  c.playCard(c.hand[0].uid, e.uid);
  assert.equal(e.block, 0);
  assert.equal(e.hp, hp - 15 - 4);
  assert.equal(c.player.energy, 0);
});

test('light: gains, caps and wanes at end of turn', () => {
  const { c } = freshCombat(['ghoul'], Array(10).fill('stoke'));
  c.gainLight(20);
  assert.equal(c.player.light, 10);
  c.endTurn();
  assert.equal(c.player.light, 9);
});

test('burn ticks at the start of the enemy turn and decays', () => {
  const { c } = freshCombat(['ghoul'], Array(10).fill('guard'));
  const e = c.alive()[0];
  c.apply(e, 'burn', 4);
  const hp = e.hp;
  c.endTurn();
  assert.equal(e.hp, hp - 4);
  assert.equal(e.statuses.burn, 3);
});

test('enrage punishes skills', () => {
  const { c } = freshCombat(['gravewarden'], Array(10).fill('guard'));
  c.endTurn(); // gravewarden bellows
  const e = c.alive()[0];
  assert.equal(e.statuses.enrage, 2);
  c.playCard(c.hand[0].uid);
  assert.equal(e.statuses.strength, 2);
});

test('killing every enemy wins the combat', () => {
  const { c } = freshCombat(['crypt_rat'], Array(10).fill('strike'));
  const e = c.alive()[0];
  e.hp = 3;
  c.playCard(c.hand[0].uid, e.uid);
  assert.ok(c.over && c.won);
});

test('upgraded cards resolve their upgraded numbers', () => {
  const s = cardStats({ id: 'strike', up: true });
  assert.equal(s.v.d, 9);
  assert.equal(s.name, 'Strike+');
});

test('every event option can be chosen without errors', () => {
  for (const ev of Object.values(EVENTS)) {
    const probe = Game.newRun('EV');
    const count = ev.options(probe.run, probe).length;
    for (let i = 0; i < count; i++) {
      const g = Game.newRun('EV' + i);
      g.run.room = { type: 'event', id: ev.id, result: null };
      g.run.gold = 500;
      const opt = g.eventOptions()[i];
      if (opt.disabled) continue;
      const res = g.chooseEventOption(i);
      assert.ok(res && typeof res.text === 'string', `${ev.id}#${i}`);
      const sel = g.pendingSelect();
      if (sel) {
        const cards = g.selectableCards(sel.purpose);
        g.applySelect(cards[0].uid);
      }
    }
  }
});

test('save and load round-trips the run', () => {
  const g = Game.newRun('SAVE');
  g.chooseBlessing(g.run.room.options[0].id);
  if (g.pendingSelect()) g.applySelect(g.run.deck[0].uid);
  const n = g.availableNodes()[0];
  g.enterNode(n.row, n.col);
  const copy = Game.fromSave(g.serialize());
  assert.deepEqual(copy.run, g.run);
  assert.equal(copy.rng.state, g.rng.state);
});

test('combats are reproducible from a save', () => {
  const g = Game.newRun('REPRO');
  g.chooseBlessing('gold');
  const n = g.availableNodes()[0];
  g.enterNode(n.row, n.col);
  const saved = g.serialize();
  const a = Game.fromSave(saved).startCombat();
  const b = Game.fromSave(saved).startCombat();
  assert.deepEqual(a.hand.map((x) => x.uid), b.hand.map((x) => x.uid));
  assert.deepEqual(a.enemies.map((x) => x.hp), b.enemies.map((x) => x.hp));
});

test('bot completes many full runs without engine errors', () => {
  let wins = 0;
  for (let i = 0; i < 60; i++) {
    const g = playRun(Game.newRun(`BOT${i}`));
    assert.ok(g.run.over);
    if (g.run.won) {
      wins++;
      assert.equal(g.run.act, 3);
    }
  }
  assert.ok(wins >= 0);
});
