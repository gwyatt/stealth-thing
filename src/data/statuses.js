// Status effects. `decays` statuses lose 1 stack at the end of their owner's turn.
export const STATUSES = {
  strength: { name: 'Strength', icon: '💪', kind: 'buff', desc: (n) => `Attacks deal ${n} additional damage.` },
  dexterity: { name: 'Dexterity', icon: '🛡️', kind: 'buff', desc: (n) => `Block gained from cards increased by ${n}.` },
  weak: { name: 'Weak', icon: '🥀', kind: 'debuff', decays: true, desc: (n) => `Attacks deal 25% less damage for ${n} turn(s).` },
  vulnerable: { name: 'Vulnerable', icon: '💔', kind: 'debuff', decays: true, desc: (n) => `Takes 50% more attack damage for ${n} turn(s).` },
  frail: { name: 'Frail', icon: '🦴', kind: 'debuff', decays: true, desc: (n) => `Block gained from cards reduced by 25% for ${n} turn(s).` },
  burn: { name: 'Burn', icon: '🔥', kind: 'debuff', desc: (n) => `At the start of its turn, loses ${n} HP, then Burn is reduced by 1.` },
  thorns: { name: 'Thorns', icon: '🌵', kind: 'buff', desc: (n) => `When attacked, deals ${n} damage back.` },
  ritual: { name: 'Ritual', icon: '🕯️', kind: 'buff', desc: (n) => `At the end of its turn, gains ${n} Strength.` },
  platedArmor: { name: 'Plated Armor', icon: '⛓️', kind: 'buff', desc: (n) => `At the end of its turn, gains ${n} Block. Unblocked attack damage reduces this by 1.` },
  regen: { name: 'Regeneration', icon: '🌿', kind: 'buff', desc: (n) => `At the end of its turn, heals ${n} HP.` },
  enrage: { name: 'Enrage', icon: '😡', kind: 'buff', desc: (n) => `Whenever you play a Skill, gains ${n} Strength.` },
  rebirth: { name: 'Rebirth', icon: '🪶', kind: 'buff', desc: () => `The first time this dies, it revives at half HP.` },
  // Player powers
  kindlingPyre: { name: 'Kindling Pyre', icon: '🪵', kind: 'buff', desc: (n) => `At the start of your turn, gain ${n} Light.` },
  ashenArmor: { name: 'Ashen Armor', icon: '🧥', kind: 'buff', desc: (n) => `Whenever you gain Light, gain ${n} Block.` },
  emberWard: { name: 'Ember Ward', icon: '🔰', kind: 'buff', desc: (n) => `At the end of your turn, gain ${n} Block.` },
  eternalFlame: { name: 'Eternal Flame', icon: '♾️', kind: 'buff', desc: (n) => `Light no longer wanes. At the end of your turn, gain ${n} Light.` },
  pyroclasm: { name: 'Pyroclasm', icon: '🌋', kind: 'buff', desc: (n) => `Whenever you apply Burn, apply ${n} more.` },
  phoenix: { name: 'Phoenix Feather', icon: '🐦‍🔥', kind: 'buff', desc: (n) => `The first time you would die this combat, heal to ${n}% of your Max HP instead.` },
  drawNext: { name: 'Foresight', icon: '👁️', kind: 'buff', desc: (n) => `Draw ${n} additional card(s) next turn.` },
  energyNext: { name: 'Second Wind', icon: '⚡', kind: 'buff', desc: (n) => `Gain ${n} additional Energy next turn.` },
  stokedBlade: { name: 'Stoked Blade', icon: '🗡️', kind: 'buff', desc: (n) => `Whenever you play an Attack, gain ${n} Light.` },
};

export function statusInfo(key) {
  return STATUSES[key] || { name: key, icon: '❔', kind: 'buff', desc: () => '' };
}
