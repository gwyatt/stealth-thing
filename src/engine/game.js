import { Rng, hashSeed } from '../core/rng.js';
import { CARDS, STARTER_DECK, cardStats, canUpgrade, poolByRarity, REWARD_POOL } from '../data/cards.js';
import { RELICS, relicsByRarity } from '../data/relics.js';
import { POTIONS } from '../data/potions.js';
import { ENCOUNTERS } from '../data/enemies.js';
import { EVENTS } from '../data/events.js';
import { Combat } from './combat.js';
import { generateMap, findNode, MAP_ROWS } from './map.js';

export const SAVE_VERSION = 1;
export const FINAL_ACT = 3;
const WEAK_FIGHTS_PER_ACT = 3;

// Owns the persistent run state (`this.run`, plain JSON) and every out-of-combat rule.
// The current room lives in run.room so a saved game resumes exactly where it was.
export class Game {
  constructor(run) {
    this.run = run;
    this.rng = new Rng(1);
    this.rng.state = run.rngState;
    this.combat = null;
  }

  static newRun(seed) {
    const run = {
      version: SAVE_VERSION,
      seed: String(seed),
      rngState: hashSeed(seed) || 1,
      act: 1,
      floor: 0,
      hp: 70,
      maxHp: 70,
      gold: 99,
      deck: [],
      relics: [],
      relicState: {},
      potions: [null, null, null],
      map: null,
      pos: null,
      path: [],
      nextUid: 1,
      removeCost: 75,
      actFights: 0,
      potionChance: 40,
      rareOffset: -5,
      seenEvents: [],
      lastEncounters: [],
      stats: { kills: 0, damageDealt: 0, cardsPlayed: 0, elites: 0, bosses: 0, goldEarned: 0, floors: 0 },
      room: null,
      over: false,
      won: false,
      startedAt: Date.now(),
    };
    const g = new Game(run);
    for (const id of STARTER_DECK) g.addCardToDeck(id);
    g.addRelic('brass_lantern');
    g.run.map = generateMap(g.rng);
    g.run.room = { type: 'blessing', options: g.rollBlessings(), done: false };
    g.sync();
    return g;
  }

  static fromSave(json) {
    const run = typeof json === 'string' ? JSON.parse(json) : json;
    if (!run || run.version !== SAVE_VERSION) return null;
    return new Game(run);
  }

  sync() {
    this.run.rngState = this.rng.state;
  }

  serialize() {
    this.sync();
    return JSON.stringify(this.run);
  }

  // ───────────── Deck & inventory API (also used by events and relics) ─────────────
  addCardToDeck(id, up = false) {
    const inst = { uid: `d${this.run.nextUid++}`, id, up };
    this.run.deck.push(inst);
    return CARDS[id];
  }

  removeCardFromDeck(uid) {
    const i = this.run.deck.findIndex((c) => c.uid === uid);
    if (i >= 0) this.run.deck.splice(i, 1);
  }

  upgradeCard(uid) {
    const c = this.run.deck.find((x) => x.uid === uid);
    if (c && canUpgrade(c)) c.up = true;
  }

  upgradeRandom(n) {
    const options = this.rng.shuffle(this.run.deck.filter(canUpgrade));
    const picked = options.slice(0, n);
    for (const c of picked) c.up = true;
    return picked.length;
  }

  hasUpgradable() {
    return this.run.deck.some(canUpgrade);
  }

  addRelic(id) {
    if (this.run.relics.includes(id)) return;
    this.run.relics.push(id);
    const r = RELICS[id];
    if (r.onPickup) r.onPickup(this.run, this);
  }

  hasRelic(id) {
    return this.run.relics.includes(id);
  }

  relicFlag(key) {
    return this.run.relics.some((id) => RELICS[id] && RELICS[id][key]);
  }

  relicSum(key) {
    return this.run.relics.reduce((s, id) => s + ((RELICS[id] && RELICS[id][key]) || 0), 0);
  }

  addPotion(id) {
    const slot = this.run.potions.indexOf(null);
    if (slot < 0) return false;
    this.run.potions[slot] = id;
    return true;
  }

  discardPotion(slot) {
    this.run.potions[slot] = null;
  }

  usePotionOutside(slot) {
    const id = this.run.potions[slot];
    const def = id && POTIONS[id];
    if (!def || !def.useOutside) return false;
    def.useOutside(this.run);
    this.run.potions[slot] = null;
    return true;
  }

  gainGold(n) {
    this.run.gold = Math.max(0, this.run.gold + n);
    if (n > 0) this.run.stats.goldEarned += n;
  }

  heal(n) {
    this.run.hp = Math.min(this.run.maxHp, this.run.hp + n);
  }

  loseHp(n) {
    this.run.hp -= n;
    if (this.run.hp <= 0) {
      this.run.hp = 0;
      this.endRun(false);
    }
  }

  gainMaxHp(n) {
    this.run.maxHp += n;
    this.run.hp += n;
  }

  loseMaxHp(n) {
    this.run.maxHp = Math.max(1, this.run.maxHp - n);
    this.run.hp = Math.min(this.run.hp, this.run.maxHp);
  }

  // ───────────── Random generation ─────────────
  randomCard(rarity, exclude = []) {
    const pool = poolByRarity(rarity).filter((c) => !exclude.includes(c.id));
    return this.rng.pick(pool.length ? pool : poolByRarity(rarity));
  }

  gainRandomCard(rarity) {
    const c = this.randomCard(rarity);
    this.addCardToDeck(c.id);
    return c;
  }

  rollRarity(kind) {
    if (kind === 'boss') return 'rare';
    const base = kind === 'elite' ? { rare: 10, uncommon: 40 } : { rare: 3, uncommon: 37 };
    const roll = this.rng.int(0, 99) + this.run.rareOffset;
    if (roll >= 100 - base.rare) {
      this.run.rareOffset = -5;
      return 'rare';
    }
    if (roll >= 100 - base.rare - base.uncommon) return 'uncommon';
    this.run.rareOffset = Math.min(40, this.run.rareOffset + 1);
    return 'common';
  }

  rollCardChoices(kind) {
    const n = 3 + this.relicSum('extraCardChoice');
    const picked = [];
    const upChance = this.run.act === 1 ? 0 : this.run.act === 2 ? 0.12 : 0.25;
    for (let i = 0; i < n; i++) {
      const rarity = this.rollRarity(kind);
      const c = this.randomCard(rarity, picked.map((p) => p.id));
      const up = rarity !== 'rare' && this.rng.chance(upChance) && !!c.up;
      picked.push({ id: c.id, up });
    }
    return picked;
  }

  randomRelicId(exclude = []) {
    const owned = new Set([...this.run.relics, ...exclude]);
    const tiers = [['common', 50], ['uncommon', 33], ['rare', 17]];
    for (let attempt = 0; attempt < 6; attempt++) {
      const tier = this.rng.weighted(tiers);
      const pool = relicsByRarity(tier).filter((r) => !owned.has(r.id));
      if (pool.length) return this.rng.pick(pool).id;
    }
    const any = ['common', 'uncommon', 'rare', 'shop'].flatMap(relicsByRarity).filter((r) => !owned.has(r.id));
    return any.length ? this.rng.pick(any).id : null;
  }

  gainRandomRelic() {
    const id = this.randomRelicId();
    if (!id) {
      this.gainGold(100);
      return { name: '100 Gold' };
    }
    this.addRelic(id);
    return RELICS[id];
  }

  randomPotionId() {
    const tier = this.rng.weighted([['common', 65], ['uncommon', 25], ['rare', 10]]);
    const pool = Object.values(POTIONS).filter((p) => p.rarity === tier);
    return this.rng.pick(pool).id;
  }

  gainRandomPotion() {
    const id = this.randomPotionId();
    return this.addPotion(id) ? POTIONS[id] : null;
  }

  // ───────────── Blessing (run start) ─────────────
  rollBlessings() {
    const all = [
      { id: 'maxhp', label: 'Gain 10 Max HP.' },
      { id: 'gold', label: 'Gain 100 Gold.' },
      { id: 'relic', label: 'Obtain a random Common relic.' },
      { id: 'remove', label: 'Remove a card from your deck.' },
      { id: 'upgrade', label: 'Upgrade 2 random cards.' },
      { id: 'rare', label: 'Lose 8 Max HP. Obtain a random Rare card.' },
      { id: 'potions', label: 'Obtain 3 random potions.' },
    ];
    return this.rng.sample(all, 3);
  }

  chooseBlessing(id) {
    const room = this.run.room;
    if (!room || room.type !== 'blessing' || room.done) return null;
    room.done = true;
    let select = null;
    switch (id) {
      case 'maxhp': this.gainMaxHp(10); break;
      case 'gold': this.gainGold(100); break;
      case 'relic': {
        const pool = relicsByRarity('common').filter((r) => !this.hasRelic(r.id));
        this.addRelic(this.rng.pick(pool).id);
        break;
      }
      case 'remove': select = { purpose: 'remove' }; break;
      case 'upgrade': this.upgradeRandom(2); break;
      case 'rare': this.loseMaxHp(8); this.gainRandomCard('rare'); break;
      case 'potions': for (let i = 0; i < 3; i++) this.gainRandomPotion(); break;
      default: break;
    }
    if (select) room.select = select;
    else this.run.room = null;
    this.sync();
    return select;
  }

  // ───────────── Map ─────────────
  availableNodes() {
    const { map, pos } = this.run;
    if (this.run.room) return [];
    if (!pos) return map.rows[0];
    if (pos.row === MAP_ROWS - 1) return [map.boss];
    if (pos.row >= MAP_ROWS) return [];
    const cur = findNode(map, pos.row, pos.col);
    return cur.next.map((c) => findNode(map, pos.row + 1, c));
  }

  enterNode(row, col) {
    const node = this.availableNodes().find((n) => n.row === row && n.col === col);
    if (!node) return null;
    this.run.pos = { row, col };
    this.run.path.push({ row, col });
    this.run.floor++;
    this.run.stats.floors++;
    this.run.room = this.createRoom(node.type);
    this.sync();
    return this.run.room;
  }

  createRoom(type) {
    switch (type) {
      case 'combat': {
        const pool = this.run.actFights < WEAK_FIGHTS_PER_ACT ? 'weak' : 'strong';
        this.run.actFights++;
        return { type: 'combat', kind: 'normal', enemies: this.pickEncounter(pool) };
      }
      case 'elite':
        return { type: 'combat', kind: 'elite', enemies: this.pickEncounter('elite') };
      case 'boss':
        return { type: 'combat', kind: 'boss', enemies: this.pickEncounter('boss') };
      case 'event':
        return this.createEventRoom();
      case 'shop':
        return { type: 'shop', stock: this.rollShop() };
      case 'rest':
        return { type: 'rest', done: false };
      case 'treasure':
        return { type: 'treasure', opened: false, relic: this.randomRelicId(), gold: this.rng.int(25, 45) };
      default:
        throw new Error(`Unknown room type ${type}`);
    }
  }

  pickEncounter(pool) {
    const list = ENCOUNTERS[this.run.act][pool];
    const recent = this.run.lastEncounters.slice(-2);
    const fresh = list.filter((e) => !recent.includes(e.join(',')));
    const enc = this.rng.pick(fresh.length ? fresh : list);
    this.run.lastEncounters.push(enc.join(','));
    return enc.slice();
  }

  createEventRoom() {
    // "?" rooms: mostly events, sometimes a fight, shop or treasure.
    const roll = this.rng.int(1, 100);
    if (roll <= 12) {
      const r = this.createRoom('combat');
      r.fromEvent = true;
      return r;
    }
    if (roll <= 17) return { ...this.createRoom('shop'), fromEvent: true };
    if (roll <= 21) return { ...this.createRoom('treasure'), fromEvent: true };
    const pool = Object.values(EVENTS).filter((e) => e.acts.includes(this.run.act));
    let fresh = pool.filter((e) => !this.run.seenEvents.includes(e.id));
    if (!fresh.length) fresh = pool;
    const ev = this.rng.pick(fresh);
    this.run.seenEvents.push(ev.id);
    return { type: 'event', id: ev.id, result: null };
  }

  // ───────────── Combat ─────────────
  startCombat() {
    const room = this.run.room;
    if (!room || room.type !== 'combat') return null;
    const seed = hashSeed(`${this.run.seed}:${this.run.act}:${this.run.floor}`);
    this.combat = new Combat(this.run, room.enemies, { seed, isBoss: room.kind === 'boss', isElite: room.kind === 'elite' });
    this.combat.start();
    return this.combat;
  }

  finishCombat() {
    const c = this.combat;
    if (!c || !c.over) return;
    c.finalize();
    const s = this.run.stats;
    s.kills += c.stats.kills;
    s.damageDealt += c.stats.damageDealt;
    s.cardsPlayed += c.stats.cardsPlayed;
    this.combat = null;
    if (!c.won && !c.escaped) {
      this.endRun(false);
      return;
    }
    if (c.escaped) {
      this.run.room = null;
      this.sync();
      return;
    }
    for (const id of this.run.relics) {
      const r = RELICS[id];
      if (r.onCombatWon) r.onCombatWon(this.run, this);
    }
    const kind = this.run.room.kind;
    if (kind === 'elite') s.elites++;
    if (kind === 'boss') s.bosses++;
    this.run.room = { type: 'reward', kind, rewards: this.rollRewards(kind) };
    this.sync();
  }

  rollRewards(kind) {
    const rewards = [];
    const bonus = this.relicSum('bonusGold');
    const gold = kind === 'boss' ? this.rng.int(95, 105) : kind === 'elite' ? this.rng.int(25, 35) : this.rng.int(10, 20);
    rewards.push({ type: 'gold', amount: gold + bonus });
    if (this.rng.int(0, 99) < this.run.potionChance || kind === 'elite') {
      this.run.potionChance = Math.max(0, this.run.potionChance - 10);
      rewards.push({ type: 'potion', id: this.randomPotionId() });
    } else {
      this.run.potionChance = Math.min(100, this.run.potionChance + 10);
    }
    if (kind === 'elite') {
      const id = this.randomRelicId();
      if (id) rewards.push({ type: 'relic', id });
    }
    if (kind === 'boss' && this.run.act < FINAL_ACT) {
      const pool = relicsByRarity('boss').filter((r) => !this.hasRelic(r.id));
      rewards.push({ type: 'bossRelic', ids: this.rng.sample(pool, 3).map((r) => r.id) });
    }
    rewards.push({ type: 'cards', choices: this.rollCardChoices(kind) });
    return rewards;
  }

  claimReward(index, choice = null) {
    const room = this.run.room;
    if (!room || room.type !== 'reward') return false;
    const r = room.rewards[index];
    if (!r || r.claimed) return false;
    switch (r.type) {
      case 'gold': this.gainGold(r.amount); break;
      case 'potion': if (!this.addPotion(r.id)) return false; break;
      case 'relic': this.addRelic(r.id); break;
      case 'bossRelic': if (!r.ids.includes(choice)) return false; this.addRelic(choice); break;
      case 'cards': {
        const c = r.choices[choice];
        if (!c) return false;
        this.addCardToDeck(c.id, c.up);
        break;
      }
      default: return false;
    }
    r.claimed = true;
    this.sync();
    return true;
  }

  // Leave the reward screen (unclaimed rewards are forfeited).
  leaveRewards() {
    const room = this.run.room;
    if (!room || room.type !== 'reward') return;
    if (room.kind === 'boss') {
      if (this.run.act >= FINAL_ACT) {
        this.endRun(true);
        return;
      }
      this.nextAct();
      return;
    }
    this.run.room = null;
    this.sync();
  }

  nextAct() {
    this.run.act++;
    this.run.pos = null;
    this.run.path = [];
    this.run.actFights = 0;
    this.run.lastEncounters = [];
    this.run.map = generateMap(this.rng);
    const missing = this.run.maxHp - this.run.hp;
    this.heal(Math.ceil(missing * 0.75));
    this.run.room = { type: 'actIntro' };
    this.sync();
  }

  dismissRoom() {
    this.run.room = null;
    this.sync();
  }

  // ───────────── Rest ─────────────
  canRest() {
    return !this.relicFlag('noRest');
  }

  restHealAmount() {
    return Math.ceil(this.run.maxHp * 0.3);
  }

  rest() {
    const room = this.run.room;
    if (!room || room.type !== 'rest' || room.done || !this.canRest()) return false;
    this.heal(this.restHealAmount());
    room.done = true;
    room.result = 'rested';
    this.sync();
    return true;
  }

  smith(uid) {
    const room = this.run.room;
    if (!room || room.type !== 'rest' || room.done) return false;
    this.upgradeCard(uid);
    room.done = true;
    room.result = 'smithed';
    this.sync();
    return true;
  }

  // ───────────── Treasure ─────────────
  openTreasure() {
    const room = this.run.room;
    if (!room || room.type !== 'treasure' || room.opened) return null;
    room.opened = true;
    this.gainGold(room.gold);
    if (room.relic) this.addRelic(room.relic);
    else this.gainGold(75);
    this.sync();
    return room;
  }

  // ───────────── Shop ─────────────
  priceMult() {
    return 1 - this.relicSum('shopDiscount');
  }

  rollShop() {
    const cards = [];
    const types = ['attack', 'attack', 'skill', 'skill', 'power'];
    const taken = [];
    for (const type of types) {
      const rarity = this.rng.weighted([['common', 55], ['uncommon', 35], ['rare', 10]]);
      let pool = REWARD_POOL.filter((c) => c.type === type && c.rarity === rarity && !taken.includes(c.id));
      if (!pool.length) pool = REWARD_POOL.filter((c) => c.type === type && !taken.includes(c.id));
      const c = this.rng.pick(pool);
      taken.push(c.id);
      const base = { common: 50, uncommon: 75, rare: 150 }[c.rarity];
      cards.push({ id: c.id, price: Math.round(base * (0.9 + this.rng.next() * 0.2)), sold: false });
    }
    const sale = this.rng.int(0, cards.length - 1);
    cards[sale].price = Math.round(cards[sale].price / 2);
    cards[sale].sale = true;

    const relics = [];
    const ex = [];
    for (let i = 0; i < 2; i++) {
      const id = this.randomRelicId(ex);
      if (id) { ex.push(id); relics.push(id); }
    }
    const shopPool = relicsByRarity('shop').filter((r) => !this.hasRelic(r.id) && !ex.includes(r.id));
    if (shopPool.length) relics.push(this.rng.pick(shopPool).id);
    const relicPrice = { common: 150, uncommon: 240, rare: 300, shop: 160 };
    const relicStock = relics.map((id) => ({ id, price: Math.round(relicPrice[RELICS[id].rarity] * (0.92 + this.rng.next() * 0.16)), sold: false }));

    const potions = [];
    for (let i = 0; i < 3; i++) {
      const id = this.randomPotionId();
      const base = { common: 50, uncommon: 75, rare: 100 }[POTIONS[id].rarity];
      potions.push({ id, price: Math.round(base * (0.95 + this.rng.next() * 0.1)), sold: false });
    }
    return { cards, relics: relicStock, potions, removeUsed: false };
  }

  price(base) {
    return Math.round(base * this.priceMult());
  }

  removePrice() {
    return this.price(this.run.removeCost);
  }

  buy(kind, index) {
    const room = this.run.room;
    if (!room || room.type !== 'shop') return { ok: false };
    const item = room.stock[kind][index];
    if (!item || item.sold) return { ok: false };
    const cost = this.price(item.price);
    if (this.run.gold < cost) return { ok: false, reason: 'Not enough Gold' };
    if (kind === 'potions' && !this.run.potions.includes(null)) return { ok: false, reason: 'Potion slots full' };
    this.run.gold -= cost;
    item.sold = true;
    if (kind === 'cards') this.addCardToDeck(item.id);
    if (kind === 'relics') this.addRelic(item.id);
    if (kind === 'potions') this.addPotion(item.id);
    this.sync();
    return { ok: true };
  }

  buyRemoval(uid) {
    const room = this.run.room;
    if (!room || room.type !== 'shop' || room.stock.removeUsed) return { ok: false };
    const cost = this.removePrice();
    if (this.run.gold < cost) return { ok: false, reason: 'Not enough Gold' };
    this.run.gold -= cost;
    this.run.removeCost += 25;
    room.stock.removeUsed = true;
    this.removeCardFromDeck(uid);
    this.sync();
    return { ok: true };
  }

  // ───────────── Events ─────────────
  eventDef() {
    const room = this.run.room;
    return room && room.type === 'event' ? EVENTS[room.id] : null;
  }

  eventOptions() {
    const def = this.eventDef();
    return def ? def.options(this.run, this) : [];
  }

  chooseEventOption(i) {
    const room = this.run.room;
    const opt = this.eventOptions()[i];
    if (!opt || opt.disabled || room.result) return null;
    const result = opt.effect(this.run, this) || { text: '' };
    room.result = { text: result.text, select: result.select || null };
    this.sync();
    return room.result;
  }

  // ───────────── Card selection (remove / upgrade / duplicate / transform) ─────────────
  pendingSelect() {
    const room = this.run.room;
    if (!room) return null;
    if (room.type === 'event' && room.result && room.result.select && !room.result.selectDone) return room.result.select;
    if (room.type === 'blessing' && room.select && !room.selectDone) return room.select;
    return null;
  }

  selectableCards(purpose) {
    const deck = this.run.deck;
    if (purpose === 'upgrade') return deck.filter(canUpgrade);
    if (purpose === 'duplicate') return deck.filter((c) => CARDS[c.id].type !== 'curse');
    return deck.slice();
  }

  applySelect(uid) {
    const sel = this.pendingSelect();
    if (!sel) return false;
    const card = this.run.deck.find((c) => c.uid === uid);
    if (card) {
      if (sel.purpose === 'remove') this.removeCardFromDeck(uid);
      if (sel.purpose === 'upgrade') this.upgradeCard(uid);
      if (sel.purpose === 'duplicate') this.addCardToDeck(card.id, card.up);
      if (sel.purpose === 'transform') {
        this.removeCardFromDeck(uid);
        const rarity = this.rng.weighted([['common', 50], ['uncommon', 38], ['rare', 12]]);
        const c = this.randomCard(rarity, [card.id]);
        this.addCardToDeck(c.id);
        sel.resultCard = c.id;
      }
    }
    this.finishSelect();
    return true;
  }

  finishSelect() {
    const room = this.run.room;
    if (room.type === 'event') room.result.selectDone = true;
    if (room.type === 'blessing') this.run.room = null;
    this.sync();
  }

  // ───────────── End ─────────────
  endRun(won) {
    this.run.over = true;
    this.run.won = won;
    this.run.room = { type: 'gameOver', won };
    this.sync();
  }

  score() {
    const s = this.run.stats;
    return s.floors * 5 + s.kills * 2 + s.elites * 25 + s.bosses * 75 + (this.run.won ? 250 : 0) + Math.floor(s.goldEarned / 10);
  }

  deckSummary() {
    return this.run.deck.map((c) => cardStats(c));
  }
}
