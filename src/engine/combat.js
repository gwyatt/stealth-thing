import { Rng } from '../core/rng.js';
import { CARDS, cardStats } from '../data/cards.js';
import { ENEMIES, moveIntent } from '../data/enemies.js';
import { RELICS } from '../data/relics.js';
import { POTIONS } from '../data/potions.js';
import { STATUSES } from '../data/statuses.js';

export const HAND_LIMIT = 10;
export const BASE_DRAW = 5;
export const BASE_ENERGY = 3;
export const BASE_MAX_LIGHT = 10;
const MAX_ENEMIES = 5;

// A single fight. Pure game logic: the UI reads state and drains `events` for animation.
// `run` is the persistent run state; the combat writes HP back to it when finished.
export class Combat {
  constructor(run, enemyIds, { seed = 1, isBoss = false, isElite = false } = {}) {
    this.run = run;
    this.rng = new Rng(seed);
    this.isBoss = isBoss;
    this.isElite = isElite;
    this.events = [];
    this.turn = 0;
    this.phase = 'start';
    this.over = false;
    this.won = false;
    this.escaped = false;
    this.nextUid = 1;
    this.firstAttackDouble = false;
    this.doubleActive = false;
    this.turnStats = { attacks: 0, skills: 0, cards: 0 };
    this.stats = { damageDealt: 0, cardsPlayed: 0, kills: 0 };

    this.player = {
      isPlayer: true,
      name: 'Lanternkeeper',
      hp: run.hp,
      maxHp: run.maxHp,
      block: 0,
      energy: 0,
      maxEnergy: BASE_ENERGY + this.relicSum('energy'),
      light: 0,
      maxLight: BASE_MAX_LIGHT + this.relicSum('maxLight'),
      statuses: {},
    };

    this.drawPile = this.rng.shuffle(run.deck.map((c) => ({ uid: c.uid, id: c.id, up: c.up })));
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];

    this.enemies = [];
    for (const id of enemyIds) this.spawnEnemy(id);
  }

  // ───────────── Relic helpers ─────────────
  relics() {
    return this.run.relics.map((id) => RELICS[id]).filter(Boolean);
  }

  hasRelic(id) {
    return this.run.relics.includes(id);
  }

  relicSum(key) {
    return this.relics().reduce((s, r) => s + (r[key] || 0), 0);
  }

  relicFlag(key) {
    return this.relics().some((r) => r[key]);
  }

  fireRelics(hook, ...args) {
    for (const r of this.relics()) {
      if (r[hook]) {
        r[hook](this, ...args);
        if (this.over && hook !== 'onEnemyDeath') return;
      }
    }
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  drainEvents() {
    const ev = this.events;
    this.events = [];
    return ev;
  }

  // ───────────── Setup ─────────────
  spawnEnemy(id) {
    const def = ENEMIES[id];
    if (!def) throw new Error(`Unknown enemy: ${id}`);
    const hp = this.rng.int(def.hp[0], def.hp[1]);
    const e = {
      uid: `e${this.nextUid++}`,
      id,
      name: def.name,
      icon: def.icon,
      hp,
      maxHp: hp,
      block: 0,
      statuses: { ...(def.init || {}) },
      history: [],
      intent: null,
      flags: {},
      dead: false,
    };
    this.enemies.push(e);
    return e;
  }

  start() {
    for (const e of this.enemies) this.chooseIntent(e);
    this.startPlayerTurn();
  }

  // ───────────── Queries ─────────────
  alive() {
    return this.enemies.filter((e) => !e.dead);
  }

  randomEnemy() {
    const a = this.alive();
    return a.length ? this.rng.pick(a) : null;
  }

  findEnemy(uid) {
    return this.enemies.find((e) => e.uid === uid && !e.dead) || null;
  }

  status(target, key) {
    return target.statuses[key] || 0;
  }

  canPlay(inst) {
    const s = cardStats(inst);
    if (this.phase !== 'player' || this.over) return { ok: false, reason: 'Not your turn' };
    if (s.unplayable) return { ok: false, reason: 'Unplayable' };
    if (s.cost > this.player.energy) return { ok: false, reason: 'Not enough Energy' };
    if (s.lightCost > this.player.light) return { ok: false, reason: 'Not enough Light' };
    return { ok: true };
  }

  // Damage the player would deal with `base` against `target` (or no target).
  previewAttack(base, target = null) {
    return this.calcDamage(this.player, target, base);
  }

  previewBlock(base) {
    return this.calcBlock(base);
  }

  intentInfo(e) {
    const def = ENEMIES[e.id];
    const move = def.moves[e.intent];
    if (!move) return null;
    const info = { key: e.intent, name: move.name, type: moveIntent(move) };
    if (move.dmg) {
      info.dmg = this.calcDamage(e, this.player, move.dmg);
      info.hits = move.hits || 1;
    }
    return info;
  }

  // ───────────── Math ─────────────
  calcDamage(attacker, defender, base) {
    let dmg = base + this.status(attacker, 'strength');
    if (this.status(attacker, 'weak') > 0) dmg *= 0.75;
    if (defender && this.status(defender, 'vulnerable') > 0) dmg *= 1.5;
    if (attacker.isPlayer && this.doubleActive) dmg *= 2;
    return Math.max(0, Math.floor(dmg));
  }

  calcBlock(base) {
    let b = base + this.status(this.player, 'dexterity');
    if (this.status(this.player, 'frail') > 0) b *= 0.75;
    return Math.max(0, Math.floor(b));
  }

  // ───────────── Combat API used by cards, relics, potions ─────────────
  attack(target, base) {
    if (!target || target.dead || this.over) return 0;
    const dmg = this.calcDamage(this.player, target, base);
    const lost = this.dealDamage(target, dmg, { attack: true });
    const thorns = this.status(target, 'thorns');
    if (thorns > 0 && !target.dead) this.dealDamage(this.player, thorns, { attack: false });
    return lost;
  }

  attackAll(base) {
    for (const e of this.alive()) this.attack(e, base);
  }

  enemyAttack(e, base, hits = 1) {
    for (let i = 0; i < hits; i++) {
      if (this.over || e.dead) return;
      const dmg = this.calcDamage(e, this.player, base);
      this.dealDamage(this.player, dmg, { attack: true, source: e });
      const thorns = this.status(this.player, 'thorns');
      if (thorns > 0 && !this.over) this.dealDamage(e, thorns, { attack: false });
    }
  }

  dealDamage(target, amount, { attack = false } = {}) {
    if (target.dead || this.over) return 0;
    const blocked = Math.min(target.block, amount);
    target.block -= blocked;
    const lost = Math.min(target.hp, amount - blocked);
    target.hp -= amount - blocked;
    if (!target.isPlayer) this.stats.damageDealt += lost;
    this.emit('damage', { target: this.idOf(target), amount: amount - blocked, blocked, attack });
    if (attack && amount - blocked > 0 && this.status(target, 'platedArmor') > 0) {
      this.addStatus(target, 'platedArmor', -1);
    }
    this.checkDeath(target);
    return lost;
  }

  // HP loss that ignores Block (unless opts.block).
  loseHpEnemy(e, n, { block = false } = {}) {
    if (!e || e.dead) return;
    if (block) return this.dealDamage(e, n);
    e.hp -= n;
    this.stats.damageDealt += n;
    this.emit('damage', { target: e.uid, amount: n, blocked: 0, attack: false });
    this.checkDeath(e);
  }

  loseHp(n) {
    if (this.over) return;
    this.player.hp -= n;
    this.emit('damage', { target: 'player', amount: n, blocked: 0, attack: false });
    this.checkDeath(this.player);
  }

  damagePlayer(n) {
    this.dealDamage(this.player, n);
  }

  block(n, { raw = false } = {}) {
    const amt = raw ? n : this.calcBlock(n);
    if (amt <= 0) return;
    this.player.block += amt;
    this.emit('block', { target: 'player', amount: amt });
  }

  enemyBlock(e, n) {
    if (e.dead) return;
    e.block += n;
    this.emit('block', { target: e.uid, amount: n });
  }

  heal(n) {
    const before = this.player.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + n);
    if (this.player.hp > before) this.emit('heal', { target: 'player', amount: this.player.hp - before });
  }

  apply(target, key, n, { raw = false } = {}) {
    if (!target || target.dead || this.over || !n) return;
    if (key === 'burn' && !target.isPlayer && !raw) {
      n += this.status(this.player, 'pyroclasm') + this.relicSum('burnBonus');
    }
    this.addStatus(target, key, n);
  }

  applyAll(key, n) {
    for (const e of this.alive()) this.apply(e, key, n);
  }

  addStatus(target, key, n) {
    const next = (target.statuses[key] || 0) + n;
    if (next === 0) delete target.statuses[key];
    else target.statuses[key] = next;
    if (key === 'ritual' && n > 0) target.flags && (target.flags.ritualFresh = true);
    this.emit('status', { target: this.idOf(target), key, amount: n });
  }

  gainLight(n) {
    if (n <= 0 || this.over) return;
    n += this.relicSum('lightBonus');
    const before = this.player.light;
    this.player.light = Math.min(this.player.maxLight, before + n);
    this.emit('light', { amount: this.player.light - before });
    const armor = this.status(this.player, 'ashenArmor');
    if (armor > 0) this.block(armor, { raw: true });
  }

  spendLight(n) {
    const spent = Math.min(n, this.player.light);
    this.player.light -= spent;
    if (spent) this.emit('light', { amount: -spent });
    return spent;
  }

  spendAllLight() {
    return this.spendLight(this.player.light);
  }

  gainEnergy(n) {
    this.player.energy += n;
    this.emit('energy', { amount: n });
  }

  draw(n) {
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= HAND_LIMIT) return;
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) return;
        this.drawPile = this.rng.shuffle(this.discardPile);
        this.discardPile = [];
        this.emit('shuffle');
      }
      this.hand.push(this.drawPile.pop());
    }
  }

  addCards(id, pile, n = 1) {
    for (let i = 0; i < n; i++) {
      const inst = { uid: `t${this.nextUid++}`, id, up: false, temp: true };
      if (pile === 'draw') {
        const pos = this.rng.int(0, this.drawPile.length);
        this.drawPile.splice(pos, 0, inst);
      } else if (pile === 'hand' && this.hand.length < HAND_LIMIT) {
        this.hand.push(inst);
      } else {
        this.discardPile.push(inst);
      }
    }
    this.emit('cardsAdded', { id, pile, n });
  }

  escape() {
    this.over = true;
    this.escaped = true;
    this.phase = 'over';
  }

  idOf(target) {
    return target.isPlayer ? 'player' : target.uid;
  }

  // ───────────── Death ─────────────
  checkDeath(target) {
    if (target.hp > 0) return;
    if (target.isPlayer) {
      const phoenix = this.status(this.player, 'phoenix');
      if (phoenix > 0) {
        delete this.player.statuses.phoenix;
        this.player.hp = Math.ceil(this.player.maxHp * phoenix / 100);
        this.emit('revive', { target: 'player' });
        return;
      }
      if (this.hasRelic('phoenix_plume') && !this.run.relicState.phoenix_plume_used) {
        this.run.relicState.phoenix_plume_used = true;
        this.player.hp = Math.ceil(this.player.maxHp * 0.5);
        this.emit('revive', { target: 'player', relic: 'phoenix_plume' });
        return;
      }
      this.player.hp = 0;
      this.over = true;
      this.won = false;
      this.phase = 'over';
      this.emit('defeat');
      return;
    }
    if (this.status(target, 'rebirth') > 0) {
      target.statuses = {};
      target.hp = Math.floor(target.maxHp / 2);
      target.block = 0;
      this.emit('revive', { target: target.uid });
      return;
    }
    target.hp = 0;
    target.dead = true;
    target.block = 0;
    this.stats.kills++;
    this.emit('death', { target: target.uid });
    if (this.alive().length === 0) {
      this.over = true;
      this.won = true;
      this.phase = 'over';
      this.emit('victory');
    }
    this.fireRelics('onEnemyDeath', target);
  }

  // ───────────── Turn flow ─────────────
  startPlayerTurn() {
    if (this.over) return;
    this.turn++;
    this.turnStats = { attacks: 0, skills: 0, cards: 0 };
    const p = this.player;
    p.block = 0;
    p.energy = p.maxEnergy + this.status(p, 'energyNext');
    delete p.statuses.energyNext;

    this.tickBurn(p);
    if (this.over) return;

    if (this.turn === 1) {
      this.fireRelics('onCombatStart');
      if (this.over) return;
    }
    const pyre = this.status(p, 'kindlingPyre');
    if (pyre) this.gainLight(pyre);
    this.fireRelics('onTurnStart');
    if (this.over) return;

    const extra = this.status(p, 'drawNext');
    delete p.statuses.drawNext;
    this.draw(BASE_DRAW + this.relicSum('extraDraw') + extra);
    this.phase = 'player';
    this.emit('turnStart', { turn: this.turn });
  }

  tickBurn(target) {
    const burn = this.status(target, 'burn');
    if (burn <= 0) return;
    if (target.isPlayer) this.loseHp(burn);
    else this.loseHpEnemy(target, burn);
    if (!target.dead) this.addStatus(target, 'burn', -1);
  }

  playCard(uid, targetUid = null) {
    const idx = this.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return { ok: false, reason: 'Card not in hand' };
    const inst = this.hand[idx];
    const check = this.canPlay(inst);
    if (!check.ok) return check;
    const s = cardStats(inst);
    let target = null;
    if (s.target === 'enemy') {
      target = targetUid ? this.findEnemy(targetUid) : (this.alive().length === 1 ? this.alive()[0] : null);
      if (!target) return { ok: false, reason: 'Choose a target' };
    }

    this.hand.splice(idx, 1);
    this.player.energy -= s.cost;
    if (s.lightCost) this.spendLight(s.lightCost);
    this.turnStats.cards++;
    this.stats.cardsPlayed++;
    if (s.type === 'attack') this.turnStats.attacks++;
    if (s.type === 'skill') {
      this.turnStats.skills++;
      for (const e of this.alive()) {
        const enrage = this.status(e, 'enrage');
        if (enrage) this.addStatus(e, 'strength', enrage);
      }
    }
    if (s.type === 'attack' && this.firstAttackDouble) {
      this.firstAttackDouble = false;
      this.doubleActive = true;
    }
    this.emit('cardPlayed', { uid: inst.uid, id: inst.id, target: target ? target.uid : null });

    if (s.play) s.play(this, s.v, target, !!inst.up);
    this.doubleActive = false;

    if (!this.over && s.type === 'attack') {
      const blade = this.status(this.player, 'stokedBlade');
      if (blade) this.gainLight(blade);
    }
    if (!this.over) this.fireRelics('onCardPlayed', s);

    if (s.type === 'power') {
      // Powers are consumed.
    } else if (s.exhaust) {
      this.exhaustPile.push(inst);
    } else {
      this.discardPile.push(inst);
    }
    return { ok: true };
  }

  usePotion(slot, targetUid = null) {
    const id = this.run.potions[slot];
    if (!id || this.over || this.phase !== 'player') return { ok: false, reason: 'Cannot use now' };
    const def = POTIONS[id];
    if (def.canUse && !def.canUse(this)) return { ok: false, reason: 'Cannot use here' };
    let target = null;
    if (def.target === 'enemy') {
      target = targetUid ? this.findEnemy(targetUid) : (this.alive().length === 1 ? this.alive()[0] : null);
      if (!target) return { ok: false, reason: 'Choose a target' };
    }
    this.run.potions[slot] = null;
    this.emit('potion', { id });
    def.use(this, target);
    return { ok: true };
  }

  endPlayerTurn() {
    if (this.phase !== 'player' || this.over) return;
    const p = this.player;
    for (const inst of this.hand.slice()) {
      const s = cardStats(inst);
      if (s.endOfTurnInHand) s.endOfTurnInHand(this, s.v);
      if (this.over) return;
    }
    const ward = this.status(p, 'emberWard');
    if (ward) this.block(ward, { raw: true });
    this.fireRelics('onTurnEnd');
    if (this.over) return;

    const flame = this.status(p, 'eternalFlame');
    if (flame) {
      this.gainLight(flame);
    } else if (!this.relicFlag('noWane') && p.light > 0) {
      const wane = Math.min(p.light, 1 + this.relicSum('extraWane'));
      p.light -= wane;
      this.emit('light', { amount: -wane, wane: true });
    }

    for (const inst of this.hand) {
      if (cardStats(inst).ethereal) this.exhaustPile.push(inst);
      else this.discardPile.push(inst);
    }
    this.hand = [];
    this.decayStatuses(p);
    this.phase = 'enemy';
  }

  beginEnemyPhase() {
    for (const e of this.alive()) e.block = 0;
  }

  // Run one enemy's turn: burn, its move, end-of-turn effects.
  enemyAct(e) {
    if (e.dead || this.over) return;
    this.tickBurn(e);
    if (e.dead || this.over) return;
    const def = ENEMIES[e.id];
    const move = def.moves[e.intent];
    this.emit('enemyMove', { uid: e.uid, name: move.name });
    this.executeMove(e, move);
    if (this.over || e.dead) return;

    const ritual = this.status(e, 'ritual');
    if (ritual) {
      if (e.flags.ritualFresh) e.flags.ritualFresh = false;
      else this.addStatus(e, 'strength', ritual);
    }
    const plated = this.status(e, 'platedArmor');
    if (plated) this.enemyBlock(e, plated);
    const regen = this.status(e, 'regen');
    if (regen) e.hp = Math.min(e.maxHp, e.hp + regen);
    this.decayStatuses(e);
  }

  executeMove(e, move) {
    if (move.block) this.enemyBlock(e, move.block);
    if (move.dmg) this.enemyAttack(e, move.dmg, move.hits || 1);
    if (this.over) return;
    if (move.self) for (const [k, n] of Object.entries(move.self)) this.addStatus(e, k, n);
    if (move.allies) {
      for (const a of this.alive()) {
        if (move.allies.block) this.enemyBlock(a, move.allies.block);
        if (move.allies.strength) this.addStatus(a, 'strength', move.allies.strength);
      }
    }
    if (move.player) for (const [k, n] of Object.entries(move.player)) this.addStatus(this.player, k, n);
    if (move.cards) for (const { id, n, pile } of move.cards) this.addCards(id, pile, n);
    if (move.heal) {
      e.hp = Math.min(e.maxHp, e.hp + move.heal);
      this.emit('heal', { target: e.uid, amount: move.heal });
    }
    if (move.summon) {
      for (const id of move.summon) {
        if (this.alive().length >= MAX_ENEMIES) break;
        const s = this.spawnEnemy(id);
        this.chooseIntent(s);
        this.emit('summon', { uid: s.uid });
      }
    }
  }

  finishEnemyPhase() {
    if (this.over) return;
    for (const e of this.alive()) this.chooseIntent(e);
    this.startPlayerTurn();
  }

  // Convenience for headless play: resolve the whole round.
  endTurn() {
    this.endPlayerTurn();
    if (this.over) return;
    this.beginEnemyPhase();
    for (const e of this.alive().slice()) {
      this.enemyAct(e);
      if (this.over) return;
    }
    this.finishEnemyPhase();
  }

  chooseIntent(e) {
    const def = ENEMIES[e.id];
    const key = def.ai(e, this);
    e.intent = key;
    e.history.push(key);
  }

  decayStatuses(target) {
    for (const key of Object.keys(target.statuses)) {
      if (STATUSES[key] && STATUSES[key].decays) this.addStatus(target, key, -1);
    }
  }

  // Write results back into the run.
  finalize() {
    this.run.hp = Math.max(0, this.player.hp);
    this.run.maxHp = this.player.maxHp;
  }
}

export { CARDS };
