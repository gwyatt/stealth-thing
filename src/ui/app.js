import { Game } from '../engine/game.js';
import { randomSeedString } from '../core/rng.js';
import { POTIONS } from '../data/potions.js';
import { CARDS } from '../data/cards.js';
import { sfx, isMuted, setMuted } from './audio.js';
import { combatScreen, needsTarget } from './combatView.js';
import * as S from './screens.js';

const SAVE_KEY = 'emberdeep.save';
const PROFILE_KEY = 'emberdeep.profile';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* storage unavailable */ }
}
function storageDel(key) {
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}

export class App {
  constructor(root) {
    this.root = root;
    this.game = null;
    this.overlay = null;
    this.ui = { targeting: null, busy: false, acting: null, dying: new Set(), seenHand: new Set() };
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'toast';
    document.body.appendChild(this.toastEl);

    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('contextmenu', (e) => {
      if (this.ui.targeting) {
        e.preventDefault();
        this.cancelTargeting();
      }
    });
    document.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('mouseover', (e) => this.onHover(e));
    document.addEventListener('mousemove', (e) => this.moveTooltip(e));
    this.render();
  }

  // ───────────── Persistence ─────────────
  hasSave() {
    return !!storageGet(SAVE_KEY);
  }

  save() {
    if (!this.game) return;
    if (this.game.run.over) storageDel(SAVE_KEY);
    else storageSet(SAVE_KEY, this.game.serialize());
  }

  profile() {
    try {
      return { runs: 0, wins: 0, bestFloor: 0, bestScore: 0, ...JSON.parse(storageGet(PROFILE_KEY) || '{}') };
    } catch {
      return { runs: 0, wins: 0, bestFloor: 0, bestScore: 0 };
    }
  }

  recordRun() {
    const run = this.game.run;
    if (run.recorded) return;
    run.recorded = true;
    const p = this.profile();
    p.runs++;
    if (run.won) p.wins++;
    p.bestFloor = Math.max(p.bestFloor, run.stats.floors);
    p.bestScore = Math.max(p.bestScore, this.game.score());
    storageSet(PROFILE_KEY, JSON.stringify(p));
    storageDel(SAVE_KEY);
  }

  // ───────────── Rendering ─────────────
  render() {
    const g = this.game;
    let html;
    if (!g) {
      html = S.titleScreen({ hasSave: this.hasSave(), profile: this.profile(), seed: this.pendingSeed });
    } else {
      const room = g.run.room;
      if (room && room.type === 'combat' && !g.combat) this.beginCombat();
      const inCombat = !!g.combat;
      let body;
      if (inCombat) body = combatScreen(g.combat, this.ui);
      else if (!room) body = S.mapView(g);
      else {
        switch (room.type) {
          case 'reward': body = S.rewardScreen(g); break;
          case 'shop': body = S.shopScreen(g); break;
          case 'rest': body = S.restScreen(g); break;
          case 'treasure': body = S.treasureScreen(g); break;
          case 'event': body = S.eventScreen(g); break;
          case 'blessing': body = S.blessingScreen(g); break;
          case 'actIntro': body = S.actIntroScreen(g); break;
          case 'gameOver': this.recordRun(); body = S.gameOverScreen(g); break;
          default: body = S.mapView(g);
        }
      }
      const scene = inCombat ? 'combat' : !room ? 'map' : room.type;
      html = `<div class="run act-${g.run.act} scene-${scene}">${S.topBar(g, { inCombat, combat: g.combat })}<main class="stage">${body}</main></div>`;
    }
    const pending = g && !g.combat ? g.pendingSelect() : null;
    const overlay = this.overlayHtml(pending);
    this.root.innerHTML = html + (overlay ? `<div class="overlay" data-action="overlay-bg">${overlay}</div>` : '');
    this.hideTooltip();

    if (g && g.combat) for (const c of g.combat.hand) this.ui.seenHand.add(c.uid);
    const scroller = this.root.querySelector('#map-scroll');
    if (scroller) this.scrollMap(scroller);
  }

  scrollMap(scroller) {
    const target = scroller.querySelector('.map-node.available') || scroller.querySelector('.map-node.current');
    if (target) scroller.scrollTop = target.offsetTop - scroller.clientHeight * 0.6;
    else scroller.scrollTop = scroller.scrollHeight;
  }

  overlayHtml(pending) {
    const g = this.game;
    if (pending) {
      const titles = { remove: 'Remove a Card', upgrade: 'Upgrade a Card', duplicate: 'Duplicate a Card', transform: 'Transform a Card' };
      return S.deckOverlay(g.selectableCards(pending.purpose), titles[pending.purpose], {
        action: 'select-card', upgradePreview: pending.purpose === 'upgrade', cancel: 'Skip',
      });
    }
    const o = this.overlay;
    if (!o) return '';
    switch (o.type) {
      case 'deck': return S.deckOverlay(g.run.deck, `Deck (${g.run.deck.length})`);
      case 'pile': {
        const c = g.combat;
        const cards = { draw: c.drawPile, discard: c.discardPile, exhaust: c.exhaustPile }[o.pile];
        const names = { draw: 'Draw Pile (random order)', discard: 'Discard Pile', exhaust: 'Exhausted' };
        return S.deckOverlay(o.pile === 'draw' ? cards.slice().sort((a, b) => a.id.localeCompare(b.id)) : cards, names[o.pile]);
      }
      case 'cardReward': return S.cardRewardOverlay(g, o.index);
      case 'bossRelic': return S.bossRelicOverlay(g, o.index);
      case 'shopRemove': return S.deckOverlay(g.run.deck, `Remove a Card (${g.removePrice()} Gold)`, { action: 'select-card', cancel: 'Cancel' });
      case 'smith': return S.deckOverlay(g.selectableCards('upgrade'), 'Upgrade a Card', { action: 'select-card', upgradePreview: true, cancel: 'Cancel' });
      case 'help': return S.helpOverlay();
      case 'library': return S.libraryOverlay();
      case 'settings': return S.settingsOverlay({ muted: isMuted(), inRun: !!g && !g.run.over });
      case 'potion': {
        const c = g.combat;
        const def = POTIONS[g.run.potions[o.slot]];
        const canUseNow = !!c && c.phase === 'player' && !this.ui.busy && (!def.canUse || def.canUse(c));
        return S.potionOverlay(g, o.slot, { inCombat: !!c, canUseNow });
      }
      case 'mapPeek': return `<div class="overlay-inner wide">${S.mapView(g, { peek: true })}<div class="overlay-actions"><button class="btn" data-action="close-overlay">Close</button></div></div>`;
      case 'abandon': return S.confirmOverlay('Abandon this run? It will count as a defeat.', 'confirm-abandon');
      default: return '';
    }
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('show');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
  }

  // ───────────── Tooltips ─────────────
  onHover(e) {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el || !el.dataset.tip) return this.hideTooltip();
    this.tooltip.innerHTML = el.dataset.tip;
    this.tooltip.classList.add('show');
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    if (!this.tooltip.classList.contains('show')) return;
    const pad = 16;
    const w = this.tooltip.offsetWidth;
    const h = this.tooltip.offsetHeight;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - pad;
    this.tooltip.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`;
  }

  hideTooltip() {
    this.tooltip.classList.remove('show');
  }

  // ───────────── Input ─────────────
  onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    const g = this.game;
    if (e.key === 'Escape') {
      if (this.ui.targeting) return this.cancelTargeting();
      if (this.overlay) { this.overlay = null; return this.render(); }
      return;
    }
    if (!g || this.overlay) return;
    if (e.key === 'd' || e.key === 'D') { this.overlay = { type: 'deck' }; return this.render(); }
    if ((e.key === 'm' || e.key === 'M') && !g.combat && g.run.room) { this.overlay = { type: 'mapPeek' }; return this.render(); }
    const c = g.combat;
    if (!c) return;
    if (e.key === 'e' || e.key === 'E') return this.endTurn();
    const n = Number(e.key);
    if (n >= 1 && n <= 9) {
      if (this.ui.targeting) {
        const target = c.enemies.filter((x) => !x.dead || this.ui.dying.has(x.uid))[n - 1];
        if (target && !target.dead) this.completeTarget(target.uid);
      } else if (c.hand[n - 1]) {
        this.clickCard(c.hand[n - 1].uid);
      }
    }
  }

  onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) {
      if (this.ui.targeting) this.cancelTargeting();
      return;
    }
    const action = el.dataset.action;
    if (action === 'overlay-bg') {
      if (e.target === el && this.overlay && !['help'].includes(this.overlay.type)) {
        this.overlay = null;
        this.render();
      }
      return;
    }
    const handler = this.actions[action];
    if (handler) handler.call(this, el, e);
  }

  get actions() {
    return {
      'new-run': () => {
        const input = this.root.querySelector('#seed-input');
        const seed = (input && input.value.trim().toUpperCase()) || randomSeedString();
        this.game = Game.newRun(seed);
        this.resetUi();
        this.save();
        sfx.click();
        this.render();
      },
      continue: () => {
        const g = Game.fromSave(storageGet(SAVE_KEY));
        if (!g) {
          storageDel(SAVE_KEY);
          this.toast('Save could not be loaded.');
          return this.render();
        }
        this.game = g;
        this.resetUi();
        this.render();
      },
      'to-title': () => {
        this.save();
        this.game = null;
        this.overlay = null;
        this.render();
      },
      abandon: () => { this.overlay = { type: 'abandon' }; this.render(); },
      'confirm-abandon': () => {
        this.overlay = null;
        this.game.combat = null;
        this.game.endRun(false);
        this.render();
      },
      'open-help': () => { this.overlay = { type: 'help' }; this.render(); },
      'open-library': () => { this.overlay = { type: 'library' }; this.render(); },
      'open-settings': () => { this.overlay = { type: 'settings' }; this.render(); },
      'open-deck': () => { this.overlay = { type: 'deck' }; this.render(); },
      'open-map-peek': () => {
        if (!this.game.run.room) return;
        this.overlay = { type: 'mapPeek' };
        this.render();
      },
      'close-overlay': () => {
        const pending = this.game && !this.game.combat && this.game.pendingSelect();
        if (pending && !this.overlay) {
          this.game.finishSelect();
          this.save();
        }
        this.overlay = null;
        this.render();
      },
      'toggle-sound': () => { setMuted(!isMuted()); this.render(); },

      // Map
      'enter-node': (el) => {
        const room = this.game.enterNode(Number(el.dataset.row), Number(el.dataset.col));
        if (!room) return;
        sfx.click();
        this.save();
        this.render();
      },

      // Blessing / events
      blessing: (el) => { this.game.chooseBlessing(el.dataset.id); sfx.buff(); this.save(); this.render(); },
      'event-option': (el) => {
        const res = this.game.chooseEventOption(Number(el.dataset.index));
        if (!res) return;
        sfx.click();
        this.save();
        this.render();
      },
      'select-card': (el) => {
        const uid = el.dataset.uid;
        const g = this.game;
        if (this.overlay && this.overlay.type === 'shopRemove') {
          const r = g.buyRemoval(uid);
          if (!r.ok) { sfx.error(); this.toast(r.reason || 'Cannot do that'); return; }
          sfx.gold();
        } else if (this.overlay && this.overlay.type === 'smith') {
          g.smith(uid);
          sfx.buff();
        } else {
          g.applySelect(uid);
          sfx.buff();
        }
        this.overlay = null;
        this.save();
        this.render();
      },
      'leave-room': () => { this.game.dismissRoom(); this.save(); this.render(); },

      // Rest / treasure / shop
      rest: () => { if (this.game.rest()) { sfx.heal(); this.save(); this.render(); } },
      smith: () => { this.overlay = { type: 'smith' }; this.render(); },
      'open-chest': () => { this.game.openTreasure(); sfx.gold(); this.save(); this.render(); },
      'buy-card': (el) => this.buy('cards', el),
      'buy-relic': (el) => this.buy('relics', el),
      'buy-potion': (el) => this.buy('potions', el),
      'shop-remove': () => {
        if (this.game.run.gold < this.game.removePrice()) { sfx.error(); return this.toast('Not enough Gold'); }
        this.overlay = { type: 'shopRemove' };
        this.render();
      },

      // Rewards
      claim: (el) => {
        const ok = this.game.claimReward(Number(el.dataset.index));
        if (!ok) { sfx.error(); return this.toast('Your potion slots are full.'); }
        sfx.gold();
        this.save();
        this.render();
      },
      'open-card-reward': (el) => { this.overlay = { type: 'cardReward', index: Number(el.dataset.index) }; this.render(); },
      'take-card': (el) => {
        const idx = this.overlay.index;
        this.game.claimReward(idx, Number(el.dataset.index));
        sfx.card();
        this.overlay = null;
        this.save();
        this.render();
      },
      'open-boss-relic': (el) => { this.overlay = { type: 'bossRelic', index: Number(el.dataset.index) }; this.render(); },
      'take-boss-relic': (el) => {
        this.game.claimReward(this.overlay.index, el.dataset.id);
        sfx.buff();
        this.overlay = null;
        this.save();
        this.render();
      },
      'leave-rewards': () => {
        this.game.leaveRewards();
        this.save();
        this.render();
      },

      // Potions
      potion: (el) => { this.overlay = { type: 'potion', slot: Number(el.dataset.slot) }; this.render(); },
      'use-potion': (el) => this.usePotion(Number(el.dataset.slot)),
      'discard-potion': (el) => {
        this.game.discardPotion(Number(el.dataset.slot));
        this.overlay = null;
        this.save();
        this.render();
      },

      // Combat
      'play-card': (el) => this.clickCard(el.dataset.uid),
      target: (el) => { if (this.ui.targeting) this.completeTarget(el.dataset.uid); },
      'end-turn': () => this.endTurn(),
      'view-pile': (el) => { this.overlay = { type: 'pile', pile: el.dataset.pile }; this.render(); },
    };
  }

  resetUi() {
    this.overlay = null;
    this.ui = { targeting: null, busy: false, acting: null, dying: new Set(), seenHand: new Set() };
  }

  buy(kind, el) {
    const r = this.game.buy(kind, Number(el.dataset.index));
    if (!r.ok) { sfx.error(); return this.toast(r.reason || 'Cannot buy that'); }
    sfx.gold();
    this.save();
    this.render();
  }

  usePotion(slot) {
    const g = this.game;
    this.overlay = null;
    if (!g.combat) {
      if (g.usePotionOutside(slot)) sfx.heal();
      this.save();
      return this.render();
    }
    const c = g.combat;
    const def = POTIONS[g.run.potions[slot]];
    if (def.target === 'enemy' && c.alive().length > 1) {
      this.ui.targeting = { kind: 'potion', slot };
      return this.render();
    }
    const r = c.usePotion(slot);
    if (!r.ok) this.toast(r.reason);
    this.afterAction();
  }

  // ───────────── Combat flow ─────────────
  beginCombat() {
    this.ui = { targeting: null, busy: false, acting: null, dying: new Set(), seenHand: new Set() };
    const c = this.game.startCombat();
    c.drainEvents();
    if (c.isBoss) this.banner(c.enemies[0].name, 'boss-intro');
  }

  clickCard(uid) {
    const c = this.game.combat;
    if (!c || this.ui.busy) return;
    if (this.ui.targeting && this.ui.targeting.uid === uid) return this.cancelTargeting();
    const inst = c.hand.find((h) => h.uid === uid);
    if (!inst) return;
    const check = c.canPlay(inst);
    if (!check.ok) {
      sfx.error();
      this.toast(check.reason);
      const el = this.root.querySelector(`.card[data-uid="${uid}"]`);
      if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
      return;
    }
    if (needsTarget(c, inst)) {
      this.ui.targeting = { kind: 'card', uid };
      return this.render();
    }
    this.playCard(uid, null);
  }

  completeTarget(targetUid) {
    const t = this.ui.targeting;
    this.ui.targeting = null;
    if (!t) return;
    if (t.kind === 'card') this.playCard(t.uid, targetUid);
    else {
      const r = this.game.combat.usePotion(t.slot, targetUid);
      if (!r.ok) this.toast(r.reason);
      this.afterAction();
    }
  }

  cancelTargeting() {
    this.ui.targeting = null;
    this.render();
  }

  playCard(uid, targetUid) {
    const c = this.game.combat;
    const res = c.playCard(uid, targetUid);
    if (!res.ok) {
      sfx.error();
      this.toast(res.reason);
      return this.render();
    }
    this.afterAction();
  }

  afterAction() {
    this.flush();
    if (this.game.combat && this.game.combat.over) this.endCombat();
  }

  // Render and play animations / sounds for pending combat events.
  flush() {
    const c = this.game.combat;
    if (!c) return this.render();
    const events = c.drainEvents();
    for (const ev of events) if (ev.type === 'death') this.ui.dying.add(ev.target);
    this.render();
    this.animate(events);
    if (this.ui.dying.size) {
      const ids = [...this.ui.dying];
      setTimeout(() => {
        ids.forEach((id) => this.ui.dying.delete(id));
        if (this.game && this.game.combat && !this.ui.busy) this.render();
      }, 700);
    }
  }

  animate(events) {
    let delay = 0;
    let sounded = new Set();
    const once = (key, fn) => { if (!sounded.has(key)) { sounded.add(key); fn(); } };
    for (const ev of events) {
      const el = ev.target ? this.root.querySelector(`[data-cid="${ev.target}"]`) : null;
      switch (ev.type) {
        case 'cardPlayed': once('card', sfx.card); break;
        case 'damage':
          if (el) {
            this.floater(el, ev.amount > 0 ? `-${ev.amount}` : 'Blocked', ev.amount > 0 ? 'dmg' : 'blocked', delay);
            if (ev.amount > 0) this.shake(el, delay);
          }
          once('hit', ev.amount >= 15 ? sfx.bigHit : ev.attack ? sfx.hit : sfx.burn);
          delay += 70;
          break;
        case 'block': if (el) this.floater(el, `+${ev.amount} Block`, 'block', delay); once('block', sfx.block); delay += 50; break;
        case 'heal': if (el) this.floater(el, `+${ev.amount}`, 'heal', delay); once('heal', sfx.heal); break;
        case 'light':
          if (ev.amount > 0) {
            const p = this.root.querySelector('[data-cid="player"]');
            if (p) this.floater(p, `+${ev.amount} Light`, 'light', delay);
            once('light', sfx.light);
          }
          break;
        case 'status':
          if (el && ev.amount > 0 && ev.key !== 'ritual') {
            const debuff = ['weak', 'vulnerable', 'frail', 'burn'].includes(ev.key);
            this.floater(el, `${debuff ? '▼' : '▲'} ${ev.key === 'burn' ? 'Burn' : ev.key[0].toUpperCase() + ev.key.slice(1).replace(/([A-Z])/g, ' $1')}`, debuff ? 'debuff' : 'buff', delay);
            once(debuff ? 'debuff' : 'buff', debuff ? sfx.debuff : sfx.buff);
            delay += 40;
          }
          break;
        case 'death': once('death', sfx.death); break;
        case 'revive': if (el) this.floater(el, 'Reborn!', 'heal', delay); once('heal', sfx.heal); break;
        case 'cardsAdded': this.toast(`${ev.n} ${CARDS[ev.id].name} added to your ${ev.pile} pile.`); break;
        case 'summon': once('summon', sfx.buff); break;
        default: break;
      }
    }
  }

  banner(text, cls) {
    const b = document.createElement('div');
    b.className = `banner ${cls}`;
    b.innerHTML = `<span>${text}</span>`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), cls === 'death' ? 3600 : 2200);
  }

  floater(el, text, cls, delay) {
    setTimeout(() => {
      const f = document.createElement('div');
      f.className = `floater ${cls}`;
      f.textContent = text;
      f.style.left = `${40 + Math.random() * 20}%`;
      el.appendChild(f);
      setTimeout(() => f.remove(), 1100);
    }, delay);
  }

  shake(el, delay) {
    setTimeout(() => {
      el.classList.remove('hit');
      void el.offsetWidth;
      el.classList.add('hit');
    }, delay);
  }

  async endTurn() {
    const c = this.game && this.game.combat;
    if (!c || this.ui.busy || c.phase !== 'player') return;
    this.ui.busy = true;
    this.ui.targeting = null;
    c.endPlayerTurn();
    this.flush();
    if (c.over) return this.endCombat();
    await wait(350);
    c.beginEnemyPhase();
    for (const e of c.alive().slice()) {
      if (c.over || e.dead) continue;
      this.ui.acting = e.uid;
      c.enemyAct(e);
      this.flush();
      await wait(550);
      if (c.over) break;
    }
    this.ui.acting = null;
    if (!c.over) {
      c.finishEnemyPhase();
      sfx.turn();
    }
    this.ui.busy = false;
    this.flush();
    if (c.over) this.endCombat();
  }

  async endCombat() {
    const c = this.game.combat;
    this.ui.busy = true;
    if (c.won) {
      sfx.victory();
      this.banner(c.isBoss ? 'Great Foe Felled' : c.isElite ? 'Foe Vanquished' : 'Victory', 'victory');
    } else if (!c.escaped) {
      sfx.defeat();
      this.banner('Extinguished', 'death');
    }
    await wait(c.escaped ? 300 : c.won ? 1700 : 3200);
    this.game.finishCombat();
    this.ui.busy = false;
    this.ui.targeting = null;
    this.save();
    this.render();
  }
}
