// Card definitions.
//
// `v` holds the card's numbers: d = damage, b = block, m = magic number, h = hits.
// `up` overrides fields (including `v` entries) when the card is upgraded.
// `text` is templated: {d} and {b} are shown with combat modifiers applied, other
// tokens are shown raw.
// `play(c, v, target)` runs the card against the combat API (see engine/combat.js).

export const CARDS = {};

function card(id, def) {
  CARDS[id] = { id, exhaust: false, ethereal: false, unplayable: false, lightCost: 0, ...def };
}

// ───────────────────────── Starter ─────────────────────────
card('strike', {
  name: 'Strike', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
  v: { d: 6 }, up: { v: { d: 9 } },
  text: 'Deal {d} damage.',
  play: (c, v, t) => c.attack(t, v.d),
});
card('guard', {
  name: 'Guard', type: 'skill', rarity: 'starter', cost: 1, target: 'self',
  v: { b: 5 }, up: { v: { b: 8 } },
  text: 'Gain {b} Block.',
  play: (c, v) => c.block(v.b),
});
card('kindle', {
  name: 'Kindle', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
  v: { d: 5, m: 2 }, up: { v: { d: 7, m: 3 } },
  text: 'Deal {d} damage. Gain {m} Light.',
  play: (c, v, t) => { c.attack(t, v.d); c.gainLight(v.m); },
});

// ───────────────────────── Common ─────────────────────────
card('ember_slash', {
  name: 'Ember Slash', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
  v: { d: 7, m: 2 }, up: { v: { d: 9, m: 3 } },
  text: 'Deal {d} damage. Apply {m} Burn.',
  play: (c, v, t) => { c.attack(t, v.d); c.apply(t, 'burn', v.m); },
});
card('twin_cut', {
  name: 'Twin Cut', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
  v: { d: 5 }, up: { v: { d: 7 } },
  text: 'Deal {d} damage twice.',
  play: (c, v, t) => { c.attack(t, v.d); c.attack(t, v.d); },
});
card('lantern_bash', {
  name: 'Lantern Bash', type: 'attack', rarity: 'common', cost: 2, target: 'enemy',
  v: { d: 12, m: 2 }, up: { v: { d: 15, m: 3 } },
  text: 'Deal {d} damage. Apply {m} Vulnerable.',
  play: (c, v, t) => { c.attack(t, v.d); c.apply(t, 'vulnerable', v.m); },
});
card('cinder_sweep', {
  name: 'Cinder Sweep', type: 'attack', rarity: 'common', cost: 1, target: 'all',
  v: { d: 7 }, up: { v: { d: 10 } },
  text: 'Deal {d} damage to ALL enemies.',
  play: (c, v) => c.attackAll(v.d),
});
card('quick_jab', {
  name: 'Quick Jab', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
  v: { d: 3, m: 1 }, up: { v: { d: 5 } },
  text: 'Deal {d} damage. Draw {m} card.',
  play: (c, v, t) => { c.attack(t, v.d); c.draw(v.m); },
});
card('searing_strike', {
  name: 'Searing Strike', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
  v: { d: 6, m: 3 }, up: { v: { d: 8 } },
  text: 'Deal {d} damage. If you have {m}+ Light, deal {d} damage again.',
  play: (c, v, t) => { c.attack(t, v.d); if (c.player.light >= v.m) c.attack(t, v.d); },
});
card('hooked_chain', {
  name: 'Hooked Chain', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
  v: { d: 8, m: 1 }, up: { v: { d: 10, m: 2 } },
  text: 'Deal {d} damage. Apply {m} Weak.',
  play: (c, v, t) => { c.attack(t, v.d); c.apply(t, 'weak', v.m); },
});
card('spark_dart', {
  name: 'Spark Dart', type: 'attack', rarity: 'common', cost: 0, lightCost: 1, target: 'enemy',
  v: { d: 9 }, up: { v: { d: 12 } },
  text: 'Deal {d} damage.',
  play: (c, v, t) => c.attack(t, v.d),
});
card('flicker_strike', {
  name: 'Flicker Strike', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
  v: { d: 9 }, up: { v: { d: 12 } },
  text: 'Deal {d} damage. If this kills an enemy, gain 1 Energy.',
  play: (c, v, t) => { c.attack(t, v.d); if (t.hp <= 0) c.gainEnergy(1); },
});
card('brace', {
  name: 'Brace', type: 'skill', rarity: 'common', cost: 1, target: 'self',
  v: { b: 7, m: 1 }, up: { v: { b: 10 } },
  text: 'Gain {b} Block. Gain {m} Light.',
  play: (c, v) => { c.block(v.b); c.gainLight(v.m); },
});
card('ash_veil', {
  name: 'Ash Veil', type: 'skill', rarity: 'common', cost: 1, target: 'self',
  v: { b: 6, m: 1 }, up: { v: { b: 9 } },
  text: 'Gain {b} Block. Draw {m} card.',
  play: (c, v) => { c.block(v.b); c.draw(v.m); },
});
card('stoke', {
  name: 'Stoke', type: 'skill', rarity: 'common', cost: 0, target: 'self',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Gain {m} Light.',
  play: (c, v) => c.gainLight(v.m),
});
card('smoke_screen', {
  name: 'Smoke Screen', type: 'skill', rarity: 'common', cost: 1, target: 'self',
  v: { b: 6, m: 1 }, up: { v: { b: 8, m: 2 } },
  text: 'Gain {b} Block. Apply {m} Weak to ALL enemies.',
  play: (c, v) => { c.block(v.b); c.applyAll('weak', v.m); },
});
card('gather_embers', {
  name: 'Gather Embers', type: 'skill', rarity: 'common', cost: 1, target: 'self',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Draw {m} cards. Gain 1 Light.',
  play: (c, v) => { c.draw(v.m); c.gainLight(1); },
});
card('sidestep', {
  name: 'Sidestep', type: 'skill', rarity: 'common', cost: 0, target: 'self',
  v: { b: 3 }, up: { v: { b: 5 } },
  text: 'Gain {b} Block. Next turn, draw 1 additional card.',
  play: (c, v) => { c.block(v.b); c.apply(c.player, 'drawNext', 1); },
});
card('tinder', {
  name: 'Tinder', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
  v: { m: 5 }, up: { v: { m: 7 } },
  text: 'Apply {m} Burn.',
  play: (c, v, t) => c.apply(t, 'burn', v.m),
});

// ───────────────────────── Uncommon ─────────────────────────
card('flare', {
  name: 'Flare', type: 'attack', rarity: 'uncommon', cost: 1, target: 'all',
  v: { m: 4 }, up: { v: { m: 5 } },
  text: 'Spend all Light. Deal {m} damage to ALL enemies for each Light spent.',
  play: (c, v) => { const n = c.spendAllLight(); if (n > 0) c.attackAll(v.m * n); },
});
card('immolate', {
  name: 'Immolate', type: 'skill', rarity: 'uncommon', cost: 2, target: 'enemy',
  v: { m: 12 }, up: { v: { m: 16 } },
  text: 'Apply {m} Burn.',
  play: (c, v, t) => c.apply(t, 'burn', v.m),
});
card('kindling_pyre', {
  name: 'Kindling Pyre', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'At the start of your turn, gain {m} Light.',
  play: (c, v) => c.apply(c.player, 'kindlingPyre', v.m),
});
card('bulwark', {
  name: 'Bulwark', type: 'skill', rarity: 'uncommon', cost: 2, target: 'self',
  v: { b: 14, m: 2 }, up: { v: { b: 18 } },
  text: 'Gain {b} Block. Gain {m} Light.',
  play: (c, v) => { c.block(v.b); c.gainLight(v.m); },
});
card('ashen_armor', {
  name: 'Ashen Armor', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Whenever you gain Light, gain {m} Block.',
  play: (c, v) => c.apply(c.player, 'ashenArmor', v.m),
});
card('wildfire', {
  name: 'Wildfire', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy',
  up: { cost: 0 },
  text: "Double the target's Burn.",
  play: (c, v, t) => { const n = t.statuses.burn || 0; if (n > 0) c.apply(t, 'burn', n, { raw: true }); },
});
card('cinder_storm', {
  name: 'Cinder Storm', type: 'attack', rarity: 'uncommon', cost: 2, target: 'all',
  v: { d: 4, h: 4, m: 1 }, up: { v: { h: 5 } },
  text: 'Deal {d} damage to a random enemy {h} times. Each hit applies {m} Burn.',
  play: (c, v) => {
    for (let i = 0; i < v.h; i++) {
      const t = c.randomEnemy();
      if (!t) break;
      c.attack(t, v.d);
      if (t.hp > 0) c.apply(t, 'burn', v.m);
    }
  },
});
card('lantern_ward', {
  name: 'Lantern Ward', type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
  v: { b: 3, m: 2 }, up: { v: { m: 3 } },
  text: 'Gain {b} Block, plus {m} for each Light you have.',
  play: (c, v) => c.block(v.b + v.m * c.player.light),
});
card('burning_blood', {
  name: 'Burning Blood', type: 'skill', rarity: 'uncommon', cost: 0, target: 'self',
  v: { m: 3 }, up: { text: 'Lose {m} HP. Gain 2 Energy. Draw 1 card.' },
  text: 'Lose {m} HP. Gain 2 Energy.',
  play: (c, v, t, up) => { c.loseHp(v.m); c.gainEnergy(2); if (up) c.draw(1); },
});
card('inferno_fist', {
  name: 'Inferno Fist', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
  v: { d: 12, m: 3 }, up: { v: { d: 14, m: 4 } },
  text: 'Deal {d} damage, plus {m} for each Light you have.',
  play: (c, v, t) => c.attack(t, v.d + v.m * c.player.light),
});
card('molten_edge', {
  name: 'Molten Edge', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Gain {m} Strength.',
  play: (c, v) => c.apply(c.player, 'strength', v.m),
});
card('ember_ward', {
  name: 'Ember Ward', type: 'power', rarity: 'uncommon', cost: 2, target: 'self',
  v: { m: 4 }, up: { v: { m: 6 } },
  text: 'At the end of your turn, gain {m} Block.',
  play: (c, v) => c.apply(c.player, 'emberWard', v.m),
});
card('backdraft', {
  name: 'Backdraft', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
  up: { cost: 0 },
  text: 'Deal damage equal to your Block.',
  play: (c, v, t) => c.attack(t, c.player.block),
});
card('smother', {
  name: 'Smother', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', exhaust: true,
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Apply {m} Weak and {m} Vulnerable. Exhaust.',
  play: (c, v, t) => { c.apply(t, 'weak', v.m); c.apply(t, 'vulnerable', v.m); },
});
card('pilgrims_step', {
  name: "Pilgrim's Step", type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
  v: { b: 8, m: 2 }, up: { v: { b: 11 } },
  text: 'Gain {b} Block. Next turn, draw {m} additional cards.',
  play: (c, v) => { c.block(v.b); c.apply(c.player, 'drawNext', v.m); },
});
card('stoked_blade', {
  name: 'Stoked Blade', type: 'power', rarity: 'uncommon', cost: 1, target: 'self',
  v: { m: 1 }, up: { cost: 0 },
  text: 'Whenever you play an Attack, gain {m} Light.',
  play: (c, v) => c.apply(c.player, 'stokedBlade', v.m),
});
card('heat_shimmer', {
  name: 'Heat Shimmer', type: 'skill', rarity: 'uncommon', cost: 1, target: 'self',
  v: { b: 6, m: 5 }, up: { v: { b: 9 } },
  text: 'Gain {b} Block. If you have {m}+ Light, gain 1 Energy.',
  play: (c, v) => { c.block(v.b); if (c.player.light >= v.m) c.gainEnergy(1); },
});
card('reckless_flame', {
  name: 'Reckless Flame', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
  v: { d: 15 }, up: { v: { d: 20 } },
  text: 'Deal {d} damage. Shuffle a Scorch into your draw pile.',
  play: (c, v, t) => { c.attack(t, v.d); c.addCards('scorch', 'draw', 1); },
});

// ───────────────────────── Rare ─────────────────────────
card('supernova', {
  name: 'Supernova', type: 'attack', rarity: 'rare', cost: 3, target: 'enemy', exhaust: true,
  v: { d: 10, m: 6 }, up: { v: { m: 8 } },
  text: 'Spend all Light. Deal {d} damage, plus {m} for each Light spent. Exhaust.',
  play: (c, v, t) => { const n = c.spendAllLight(); c.attack(t, v.d + v.m * n); },
});
card('eternal_flame', {
  name: 'Eternal Flame', type: 'power', rarity: 'rare', cost: 3, target: 'self',
  v: { m: 1 }, up: { cost: 2 },
  text: 'Your Light no longer wanes. At the end of your turn, gain {m} Light.',
  play: (c, v) => c.apply(c.player, 'eternalFlame', v.m),
});
card('phoenix_feather', {
  name: 'Phoenix Feather', type: 'power', rarity: 'rare', cost: 2, target: 'self',
  v: { m: 30 }, up: { v: { m: 50 } },
  text: 'The first time you would die this combat, heal to {m}% of your Max HP instead.',
  play: (c, v) => { if (!c.player.statuses.phoenix) c.apply(c.player, 'phoenix', v.m); },
});
card('pyroclasm', {
  name: 'Pyroclasm', type: 'power', rarity: 'rare', cost: 2, target: 'self',
  v: { m: 2 }, up: { cost: 1 },
  text: 'Whenever you apply Burn, apply {m} more.',
  play: (c, v) => c.apply(c.player, 'pyroclasm', v.m),
});
card('conflagration', {
  name: 'Conflagration', type: 'attack', rarity: 'rare', cost: 2, target: 'all',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Each enemy loses HP equal to {m}× its Burn.',
  play: (c, v) => { for (const e of c.alive()) { const n = e.statuses.burn || 0; if (n) c.loseHpEnemy(e, n * v.m); } },
});
card('overcharge', {
  name: 'Overcharge', type: 'skill', rarity: 'rare', cost: 0, target: 'self', exhaust: true,
  v: { m: 3 }, up: { exhaust: false, text: 'Gain {m} Light and 1 Energy.' },
  text: 'Gain {m} Light and 1 Energy. Exhaust.',
  play: (c, v) => { c.gainLight(v.m); c.gainEnergy(1); },
});
card('blazing_barrier', {
  name: 'Blazing Barrier', type: 'power', rarity: 'rare', cost: 2, target: 'self',
  v: { m: 3 }, up: { v: { m: 5 } },
  text: 'Gain {m} Thorns.',
  play: (c, v) => c.apply(c.player, 'thorns', v.m),
});
card('ignition', {
  name: 'Ignition', type: 'skill', rarity: 'rare', cost: 1, target: 'self', exhaust: true,
  up: { cost: 0 },
  text: 'Fill your Light to its maximum. Exhaust.',
  play: (c) => c.gainLight(Math.max(0, c.player.maxLight - c.player.light)),
});
card('twin_suns', {
  name: 'Twin Suns', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
  v: { d: 8, m: 5 }, up: { v: { d: 10 } },
  text: 'Deal {d} damage twice. If you have {m}+ Light, four times instead.',
  play: (c, v, t) => { const n = c.player.light >= v.m ? 4 : 2; for (let i = 0; i < n; i++) c.attack(t, v.d); },
});
card('ashborn', {
  name: 'Ashborn', type: 'power', rarity: 'rare', cost: 2, target: 'self',
  v: { m: 2 }, up: { v: { m: 3 } },
  text: 'Gain {m} Strength and {m} Dexterity.',
  play: (c, v) => { c.apply(c.player, 'strength', v.m); c.apply(c.player, 'dexterity', v.m); },
});

// ───────────────────────── Status & Curse ─────────────────────────
card('scorch', {
  name: 'Scorch', type: 'status', rarity: 'special', cost: -1, target: 'none', unplayable: true,
  v: { m: 2 },
  text: 'Unplayable. At the end of your turn, if this is in your hand, take {m} damage.',
  endOfTurnInHand: (c, v) => c.damagePlayer(v.m),
});
card('wound', {
  name: 'Wound', type: 'status', rarity: 'special', cost: -1, target: 'none', unplayable: true,
  text: 'Unplayable.',
});
card('slimed', {
  name: 'Slimed', type: 'status', rarity: 'special', cost: 1, target: 'self', exhaust: true,
  text: 'Exhaust.',
  play: () => {},
});
card('dazed', {
  name: 'Dazed', type: 'status', rarity: 'special', cost: -1, target: 'none', unplayable: true, ethereal: true,
  text: 'Unplayable. Ethereal.',
});
card('gloom', {
  name: 'Gloom', type: 'curse', rarity: 'curse', cost: -1, target: 'none', unplayable: true,
  text: 'Unplayable.',
});
card('ache', {
  name: 'Ache', type: 'curse', rarity: 'curse', cost: -1, target: 'none', unplayable: true,
  v: { m: 1 },
  text: 'Unplayable. At the end of your turn, if this is in your hand, lose {m} HP.',
  endOfTurnInHand: (c, v) => c.loseHp(v.m),
});

// ───────────────────────── Helpers ─────────────────────────

// Resolve a card instance ({uid, id, up}) into its effective stats.
export function cardStats(inst) {
  const def = CARDS[inst.id];
  if (!def) throw new Error(`Unknown card: ${inst.id}`);
  if (!inst.up || !def.up) return { ...def, v: { ...(def.v || {}) }, upgraded: !!inst.up };
  const { v: upV, ...rest } = def.up;
  return {
    ...def,
    ...rest,
    v: { ...(def.v || {}), ...(upV || {}) },
    name: def.name + '+',
    upgraded: true,
  };
}

export function canUpgrade(inst) {
  const def = CARDS[inst.id];
  return !!def.up && !inst.up;
}

export const REWARD_POOL = Object.values(CARDS).filter((c) => ['common', 'uncommon', 'rare'].includes(c.rarity));

export function poolByRarity(rarity) {
  return REWARD_POOL.filter((c) => c.rarity === rarity);
}

export const STARTER_DECK = ['strike', 'strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', 'kindle'];
