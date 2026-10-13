// Potions. `use(c, target)` runs in combat; `useOutside(run)` (optional) allows use on the map.
export const POTIONS = {};

function potion(id, def) {
  POTIONS[id] = { id, target: 'self', ...def };
}

potion('healing_draught', {
  name: 'Healing Draught', icon: '🧃', rarity: 'common', desc: 'Heal 20 HP.',
  use: (c) => c.heal(20),
  useOutside: (run) => { run.hp = Math.min(run.maxHp, run.hp + 20); },
});
potion('fire_flask', {
  name: 'Fire Flask', icon: '🧨', rarity: 'common', target: 'enemy', desc: 'Deal 20 damage to an enemy.',
  use: (c, t) => c.loseHpEnemy(t, 20, { block: true }),
});
potion('block_tonic', {
  name: 'Block Tonic', icon: '🛡️', rarity: 'common', desc: 'Gain 12 Block.',
  use: (c) => c.block(12, { raw: true }),
});
potion('strength_elixir', {
  name: 'Strength Elixir', icon: '💪', rarity: 'uncommon', desc: 'Gain 2 Strength.',
  use: (c) => c.apply(c.player, 'strength', 2),
});
potion('swift_potion', {
  name: 'Swift Potion', icon: '💨', rarity: 'common', desc: 'Draw 3 cards.',
  use: (c) => c.draw(3),
});
potion('energy_potion', {
  name: 'Energy Potion', icon: '⚡', rarity: 'common', desc: 'Gain 2 Energy.',
  use: (c) => c.gainEnergy(2),
});
potion('liquid_light', {
  name: 'Liquid Light', icon: '✨', rarity: 'common', desc: 'Gain 5 Light.',
  use: (c) => c.gainLight(5),
});
potion('fear_potion', {
  name: 'Fear Potion', icon: '😱', rarity: 'common', target: 'enemy', desc: 'Apply 3 Vulnerable.',
  use: (c, t) => c.apply(t, 'vulnerable', 3),
});
potion('burning_oil', {
  name: 'Burning Oil', icon: '🛢️', rarity: 'uncommon', desc: 'Apply 6 Burn to ALL enemies.',
  use: (c) => c.applyAll('burn', 6),
});
potion('weakening_mist', {
  name: 'Weakening Mist', icon: '🌫️', rarity: 'common', desc: 'Apply 3 Weak to ALL enemies.',
  use: (c) => c.applyAll('weak', 3),
});
potion('smoke_bomb', {
  name: 'Smoke Bomb', icon: '💣', rarity: 'rare', desc: 'Escape from a non-boss combat. You receive no rewards.',
  canUse: (c) => !c.isBoss,
  use: (c) => c.escape(),
});
potion('elixir_of_ages', {
  name: 'Elixir of Ages', icon: '🍷', rarity: 'rare', desc: 'Raise your Max HP by 5 and heal to full.',
  use: (c) => { c.run.maxHp += 5; c.player.maxHp += 5; c.heal(c.player.maxHp); },
  useOutside: (run) => { run.maxHp += 5; run.hp = run.maxHp; },
});
