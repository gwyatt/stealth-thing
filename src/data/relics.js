// Relics. Combat hooks receive the Combat instance; run hooks receive the Run state.
// Passive flags (energy, maxLight, ...) are read directly by the engine.

export const RELICS = {};

function relic(id, def) {
  RELICS[id] = { id, ...def };
}

// ───── Starter ─────
relic('brass_lantern', {
  name: 'Brass Lantern', icon: '🏮', rarity: 'starter',
  desc: 'Start each combat with 2 Light.',
  onCombatStart: (c) => c.gainLight(2),
});

// ───── Common ─────
relic('coal_pouch', {
  name: 'Coal Pouch', icon: '👝', rarity: 'common',
  desc: 'Start each combat with 2 additional Light.',
  onCombatStart: (c) => c.gainLight(2),
});
relic('oaken_shield', {
  name: 'Oaken Shield', icon: '🪵', rarity: 'common',
  desc: 'Start each combat with 10 Block.',
  onCombatStart: (c) => c.block(10, { raw: true }),
});
relic('smelling_salts', {
  name: 'Smelling Salts', icon: '🧂', rarity: 'common',
  desc: 'Draw 2 additional cards on the first turn of each combat.',
  onCombatStart: (c) => c.apply(c.player, 'drawNext', 2),
});
relic('vial_of_embers', {
  name: 'Vial of Embers', icon: '🧪', rarity: 'common',
  desc: 'At the start of each combat, apply 3 Burn to ALL enemies.',
  onCombatStart: (c) => c.applyAll('burn', 3),
});
relic('iron_ring', {
  name: 'Iron Ring', icon: '💍', rarity: 'common',
  desc: 'Start each combat with 1 Strength.',
  onCombatStart: (c) => c.apply(c.player, 'strength', 1),
});
relic('feather_charm', {
  name: 'Feather Charm', icon: '🪶', rarity: 'common',
  desc: 'Start each combat with 1 Dexterity.',
  onCombatStart: (c) => c.apply(c.player, 'dexterity', 1),
});
relic('hearthstone', {
  name: 'Hearthstone', icon: '🪨', rarity: 'common',
  desc: 'At the end of combat, heal 5 HP.',
  onCombatWon: (run) => { run.hp = Math.min(run.maxHp, run.hp + 5); },
});
relic('lucky_coin', {
  name: 'Lucky Coin', icon: '🪙', rarity: 'common',
  desc: 'Gain 12 additional Gold after each combat.',
  bonusGold: 12,
});
relic('wild_berry', {
  name: 'Wild Berry', icon: '🫐', rarity: 'common',
  desc: 'Upon pickup, raise your Max HP by 7.',
  onPickup: (run) => { run.maxHp += 7; run.hp += 7; },
});

// ───── Uncommon ─────
relic('crystal_prism', {
  name: 'Crystal Prism', icon: '🔮', rarity: 'uncommon',
  desc: 'Whenever you gain Light, gain 1 additional Light.',
  lightBonus: 1,
});
relic('metronome', {
  name: 'Metronome', icon: '⏱️', rarity: 'uncommon',
  desc: 'Every 3rd Attack you play each turn draws a card.',
  onCardPlayed: (c, card) => {
    if (card.type === 'attack' && c.turnStats.attacks % 3 === 0) c.draw(1);
  },
});
relic('ember_heart', {
  name: 'Ember Heart', icon: '❤️‍🔥', rarity: 'uncommon',
  desc: 'Whenever an enemy dies, gain 1 Energy and draw 1 card.',
  onEnemyDeath: (c) => { if (!c.over) { c.gainEnergy(1); c.draw(1); } },
});
relic('warm_cloak', {
  name: 'Warm Cloak', icon: '🧣', rarity: 'uncommon',
  desc: 'At the end of your turn, if you have no Block, gain 6 Block.',
  onTurnEnd: (c) => { if (c.player.block === 0) c.block(6, { raw: true }); },
});
relic('ashen_idol', {
  name: 'Ashen Idol', icon: '🗿', rarity: 'uncommon',
  desc: 'Whenever you apply Burn, apply 1 more.',
  burnBonus: 1,
});
relic('golden_compass', {
  name: 'Golden Compass', icon: '🧭', rarity: 'uncommon',
  desc: 'Card rewards offer 1 additional choice.',
  extraCardChoice: 1,
});
relic('potion_belt', {
  name: 'Potion Belt', icon: '🎒', rarity: 'uncommon',
  desc: 'Upon pickup, gain 2 potion slots.',
  onPickup: (run) => { run.potions.push(null, null); },
});

// ───── Rare ─────
relic('phoenix_plume', {
  name: 'Phoenix Plume', icon: '🔥', rarity: 'rare',
  desc: 'The first time you would die, heal to 50% of your Max HP instead. (Once per run.)',
  // Handled by Combat.checkPlayerDeath.
});
relic('lens_of_focus', {
  name: 'Lens of Focus', icon: '🔍', rarity: 'rare',
  desc: 'The first Attack you play each combat deals double damage.',
  // Handled by Combat.attack via c.firstAttackDouble.
  onCombatStart: (c) => { c.firstAttackDouble = true; },
});
relic('ancient_coal', {
  name: 'Ancient Coal', icon: '⚫', rarity: 'rare',
  desc: 'At the start of your turn, gain 1 Light.',
  onTurnStart: (c) => c.gainLight(1),
});
relic('thorny_vine', {
  name: 'Thorny Vine', icon: '🌿', rarity: 'rare',
  desc: 'Start each combat with 3 Thorns.',
  onCombatStart: (c) => c.apply(c.player, 'thorns', 3),
});
relic('mirror_shard', {
  name: 'Mirror Shard', icon: '🪞', rarity: 'rare',
  desc: 'Your maximum Light is increased by 5.',
  maxLight: 5,
});
relic('war_drum', {
  name: 'War Drum', icon: '🥁', rarity: 'rare',
  desc: 'Every 3 turns, gain 1 Strength.',
  onTurnStart: (c) => { if (c.turn % 3 === 0) c.apply(c.player, 'strength', 1); },
});

// ───── Shop ─────
relic('merchants_seal', {
  name: "Merchant's Seal", icon: '📜', rarity: 'shop',
  desc: 'Everything in shops costs 25% less.',
  shopDiscount: 0.25,
});
relic('bottled_star', {
  name: 'Bottled Star', icon: '⭐', rarity: 'shop',
  desc: 'At the start of each combat, gain 1 Energy.',
  onCombatStart: (c) => c.gainEnergy(1),
});

// ───── Boss ─────
relic('sunstone', {
  name: 'Sunstone', icon: '☀️', rarity: 'boss',
  desc: 'Gain 1 Energy at the start of each turn. Your Light wanes by 2 instead of 1.',
  energy: 1, extraWane: 1,
});
relic('hungry_lantern', {
  name: 'Hungry Lantern', icon: '🪔', rarity: 'boss',
  desc: 'Gain 1 Energy at the start of each turn. You can no longer Rest at campfires.',
  energy: 1, noRest: true,
});
relic('cursed_crown', {
  name: 'Cursed Crown', icon: '👑', rarity: 'boss',
  desc: 'Gain 1 Energy at the start of each turn. Upon pickup, add 2 Gloom curses to your deck.',
  energy: 1,
  onPickup: (run, api) => { api.addCardToDeck('gloom'); api.addCardToDeck('gloom'); },
});
relic('everburning_wick', {
  name: 'Everburning Wick', icon: '🕯️', rarity: 'boss',
  desc: 'Your Light no longer wanes. Start each combat with 3 Light.',
  noWane: true,
  onCombatStart: (c) => c.gainLight(3),
});
relic('runic_hourglass', {
  name: 'Runic Hourglass', icon: '⏳', rarity: 'boss',
  desc: 'Draw 2 additional cards each turn.',
  extraDraw: 2,
});
relic('molten_core', {
  name: 'Molten Core', icon: '🌋', rarity: 'boss',
  desc: 'Upon pickup, upgrade 4 random cards. Start each combat with 2 Strength.',
  onPickup: (run, api) => api.upgradeRandom(4),
  onCombatStart: (c) => c.apply(c.player, 'strength', 2),
});

export function relicsByRarity(rarity) {
  return Object.values(RELICS).filter((r) => r.rarity === rarity);
}
