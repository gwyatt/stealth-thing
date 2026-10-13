// Enemy definitions and encounter tables.
//
// A move is declarative:
//   dmg/hits   – attack the player
//   block      – gain Block
//   self       – statuses applied to itself, e.g. { strength: 2 }
//   allies     – { block, strength } given to every living enemy (including itself)
//   player     – statuses applied to the player, e.g. { weak: 2 }
//   cards      – status cards added to the player's piles: [{ id, n, pile }]
//   summon     – enemy ids to summon (up to a 5-enemy cap)
//   heal       – HP restored to itself
// `ai(e, c)` returns the key of the next move. e.history holds previously chosen move keys.

export const ENEMIES = {};

function enemy(id, def) {
  ENEMIES[id] = { id, ...def };
}

const last = (e, n = 1) => e.history.slice(-n);
const lastIs = (e, k) => e.history[e.history.length - 1] === k;
const lastTwoAre = (e, k) => last(e, 2).length === 2 && last(e, 2).every((m) => m === k);
const cycle = (e, keys) => keys[e.history.length % keys.length];

// Pick weighted, avoiding a move used `maxRepeat` times in a row.
function weightedNoRepeat(e, c, entries, maxRepeat = 2) {
  const allowed = entries.filter(([k]) => !(last(e, maxRepeat).length === maxRepeat && last(e, maxRepeat).every((m) => m === k)));
  return c.rng.weighted(allowed.length ? allowed : entries);
}

// ═════════════════════════ Act 1 — The Sunken Crypt ═════════════════════════
enemy('crypt_rat', {
  name: 'Crypt Rat', icon: '🐀', hp: [10, 13],
  moves: {
    bite: { name: 'Bite', dmg: 5 },
    gnaw: { name: 'Gnaw', dmg: 3, player: { weak: 1 } },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['bite', 60], ['gnaw', 40]]),
});
enemy('drowned_thrall', {
  name: 'Drowned Thrall', icon: '🧟', hp: [19, 23],
  moves: {
    claw: { name: 'Claw', dmg: 6 },
    moan: { name: 'Mournful Moan', self: { strength: 2 } },
  },
  ai: (e) => (e.history.length % 3 === 2 ? 'moan' : 'claw'),
});
enemy('bone_archer', {
  name: 'Bone Archer', icon: '🏹', hp: [16, 19],
  moves: {
    aim: { name: 'Take Aim', block: 6, self: { strength: 1 } },
    volley: { name: 'Volley', dmg: 3, hits: 2 },
  },
  ai: (e) => cycle(e, ['aim', 'volley', 'volley']),
});
enemy('lantern_moth', {
  name: 'Lantern Moth', icon: '🦋', hp: [14, 17],
  moves: {
    dust: { name: 'Glimmer Dust', dmg: 3, player: { weak: 1 } },
    bump: { name: 'Bump', dmg: 6 },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['dust', 45], ['bump', 55]], 1),
});
enemy('grave_slime', {
  name: 'Grave Slime', icon: '🟢', hp: [26, 30],
  moves: {
    tackle: { name: 'Tackle', dmg: 9 },
    ooze: { name: 'Ooze', dmg: 4, cards: [{ id: 'slimed', n: 2, pile: 'discard' }] },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['tackle', 55], ['ooze', 45]], 1),
});
enemy('ghoul', {
  name: 'Ghoul', icon: '👹', hp: [36, 40],
  moves: {
    rend: { name: 'Rend', dmg: 11 },
    howl: { name: 'Howl', block: 6, self: { strength: 3 } },
  },
  ai: (e, c) => (e.history.length === 0 ? 'rend' : weightedNoRepeat(e, c, [['rend', 70], ['howl', 30]], lastIs(e, 'howl') ? 1 : 2)),
});

// Act 1 elites
enemy('gravewarden', {
  name: 'The Gravewarden', icon: '⚰️', hp: [70, 74], elite: true,
  moves: {
    bellow: { name: 'Bellow', self: { enrage: 2 } },
    cleave: { name: 'Cleave', dmg: 14 },
    skullbash: { name: 'Skull Bash', dmg: 7, player: { vulnerable: 2 } },
  },
  ai: (e, c) => {
    if (e.history.length === 0) return 'bellow';
    if (lastTwoAre(e, 'cleave')) return 'skullbash';
    return c.rng.weighted([['cleave', 60], ['skullbash', 40]]);
  },
});
enemy('ember_wisp', {
  name: 'Ember Wisp', icon: '👻', hp: [28, 31], elite: true,
  moves: {
    sear: { name: 'Sear', dmg: 5, player: { burn: 2 } },
    flare: { name: 'Flare', dmg: 9 },
    shimmer: { name: 'Shimmer', block: 8 },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['sear', 40], ['flare', 40], ['shimmer', 20]], 1),
});
enemy('bog_hag', {
  name: 'Bog Hag', icon: '🧙', hp: [64, 68], elite: true,
  moves: {
    hex: { name: 'Hex', player: { weak: 2, frail: 2 } },
    bolt: { name: 'Bog Bolt', dmg: 13 },
    brew: { name: 'Bubbling Brew', block: 12, self: { strength: 2 } },
  },
  ai: (e) => cycle(e, ['hex', 'bolt', 'brew', 'bolt']),
});

// Act 1 boss
enemy('drowned_king', {
  name: 'The Drowned King', icon: '🔱', hp: [140, 140], boss: true,
  moves: {
    undertow: { name: 'Undertow', dmg: 6, player: { weak: 1 }, cards: [{ id: 'wound', n: 2, pile: 'discard' }] },
    crush: { name: 'Crushing Depths', dmg: 16 },
    tidal: { name: 'Tidal Crash', dmg: 4, hits: 3 },
    rise: { name: 'Rising Tide', block: 12, self: { strength: 2 } },
  },
  ai: (e) => cycle(e, ['undertow', 'crush', 'tidal', 'rise']),
});

// ═════════════════════════ Act 2 — The Fungal Warrens ═════════════════════════
enemy('sporeling', {
  name: 'Sporeling', icon: '🍄', hp: [16, 20],
  moves: {
    spore: { name: 'Spore Puff', dmg: 3, player: { vulnerable: 1 } },
    lash: { name: 'Lash', dmg: 7 },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['spore', 40], ['lash', 60]], 1),
});
enemy('myconid_brute', {
  name: 'Myconid Brute', icon: '🦍', hp: [52, 56],
  moves: {
    slam: { name: 'Slam', dmg: 14 },
    fortify: { name: 'Fortify', block: 12, self: { strength: 2 } },
  },
  ai: (e, c) => (e.history.length === 0 ? 'fortify' : weightedNoRepeat(e, c, [['slam', 65], ['fortify', 35]], lastIs(e, 'fortify') ? 1 : 2)),
});
enemy('fungal_shaman', {
  name: 'Fungal Shaman', icon: '🧌', hp: [34, 38],
  moves: {
    mend: { name: 'Mycelial Rite', allies: { strength: 1, block: 6 } },
    spit: { name: 'Acid Spit', dmg: 7, player: { weak: 1 } },
  },
  ai: (e) => cycle(e, ['spit', 'mend']),
});
enemy('cave_stalker', {
  name: 'Cave Stalker', icon: '🐆', hp: [38, 42],
  moves: {
    ambush: { name: 'Ambush', dmg: 11 },
    rake: { name: 'Rake', dmg: 5, hits: 2 },
    skulk: { name: 'Skulk', block: 10, self: { strength: 1 } },
  },
  ai: (e, c) => (e.history.length === 0 ? 'ambush' : weightedNoRepeat(e, c, [['rake', 60], ['skulk', 40]], 1)),
});
enemy('blight_beetle', {
  name: 'Blight Beetle', icon: '🪲', hp: [44, 48],
  init: { thorns: 2 },
  moves: {
    charge: { name: 'Charge', dmg: 11 },
    harden: { name: 'Harden', block: 14 },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['charge', 60], ['harden', 40]], 1),
});

// Act 2 elites
enemy('spore_mother', {
  name: 'Spore Mother', icon: '🌸', hp: [100, 104], elite: true,
  moves: {
    burst: { name: 'Burst Spores', summon: ['sporeling', 'sporeling'] },
    lash: { name: 'Root Lash', dmg: 14 },
    rot: { name: 'Rot', dmg: 5, player: { weak: 2 } },
  },
  ai: (e, c) => {
    const allies = c.alive().filter((x) => x !== e).length;
    if (e.history.length === 0) return 'burst';
    if (allies === 0 && !lastIs(e, 'burst')) return 'burst';
    return weightedNoRepeat(e, c, [['lash', 60], ['rot', 40]], 1);
  },
});
enemy('rootbound_knight', {
  name: 'Rootbound Knight', icon: '🛡️', hp: [100, 104], elite: true,
  init: { platedArmor: 8 },
  moves: {
    strike: { name: 'Thornblade', dmg: 17 },
    bash: { name: 'Shield Bash', dmg: 10, player: { frail: 2 } },
    entrench: { name: 'Entrench', block: 10, self: { strength: 3 } },
  },
  ai: (e) => cycle(e, ['bash', 'strike', 'entrench', 'strike']),
});
enemy('carrion_lord', {
  name: 'Carrion Lord', icon: '🦅', hp: [115, 120], elite: true,
  moves: {
    screech: { name: 'Screech', player: { weak: 2, vulnerable: 1 } },
    devour: { name: 'Devour', dmg: 18, heal: 10 },
    peck: { name: 'Peck Frenzy', dmg: 3, hits: 5 },
  },
  ai: (e) => cycle(e, ['screech', 'devour', 'peck', 'devour']),
});

// Act 2 boss
enemy('rot_colossus', {
  name: 'The Rot Colossus', icon: '🌳', hp: [190, 190], boss: true,
  moves: {
    storm: { name: 'Spore Storm', player: { weak: 2, frail: 2 }, cards: [{ id: 'slimed', n: 3, pile: 'discard' }] },
    thrash: { name: 'Thrash', dmg: 6, hits: 3 },
    grow: { name: 'Overgrowth', block: 20, self: { strength: 2 } },
    crush: { name: 'Colossal Crush', dmg: 24 },
  },
  ai: (e) => cycle(e, ['storm', 'thrash', 'grow', 'crush']),
});

// ═════════════════════════ Act 3 — The Ember Throne ═════════════════════════
enemy('ash_wraith', {
  name: 'Ash Wraith', icon: '💀', hp: [46, 50],
  moves: {
    wail: { name: 'Wail', player: { weak: 2, frail: 2 } },
    drain: { name: 'Life Drain', dmg: 12, heal: 6 },
  },
  ai: (e, c) => (e.history.length === 0 ? 'wail' : weightedNoRepeat(e, c, [['drain', 70], ['wail', 30]], 2)),
});
enemy('cinder_golem', {
  name: 'Cinder Golem', icon: '🗿', hp: [72, 78],
  moves: {
    smash: { name: 'Smash', dmg: 18 },
    heat: { name: 'Heat Up', block: 10, self: { strength: 3 } },
    spew: { name: 'Spew Cinders', dmg: 8, cards: [{ id: 'scorch', n: 2, pile: 'discard' }] },
  },
  ai: (e) => cycle(e, ['spew', 'smash', 'heat']),
});
enemy('flame_cultist', {
  name: 'Flame Cultist', icon: '🕯️', hp: [50, 55],
  moves: {
    incant: { name: 'Incantation', self: { ritual: 3 } },
    strike: { name: 'Dark Strike', dmg: 7 },
  },
  ai: (e) => (e.history.length === 0 ? 'incant' : 'strike'),
});
enemy('obsidian_sentry', {
  name: 'Obsidian Sentry', icon: '🗼', hp: [58, 62],
  init: { platedArmor: 6 },
  moves: {
    beam: { name: 'Searing Beam', dmg: 10, cards: [{ id: 'dazed', n: 2, pile: 'discard' }] },
    shield: { name: 'Bulwark Pulse', allies: { block: 12 } },
  },
  ai: (e) => cycle(e, ['beam', 'shield', 'beam']),
});
enemy('ember_imp', {
  name: 'Ember Imp', icon: '😈', hp: [22, 26],
  moves: {
    jab: { name: 'Pitchfork Jab', dmg: 4, hits: 2 },
    ignite: { name: 'Ignite', player: { burn: 3 } },
  },
  ai: (e, c) => weightedNoRepeat(e, c, [['jab', 65], ['ignite', 35]], 1),
});

// Act 3 elites
enemy('phoenix_knight', {
  name: 'Phoenix Knight', icon: '🐦‍🔥', hp: [108, 114], elite: true,
  init: { rebirth: 1 },
  moves: {
    wings: { name: 'Wing Slash', dmg: 8, hits: 2 },
    immolate: { name: 'Immolation', dmg: 20, player: { burn: 3 } },
    preen: { name: 'Preen', block: 15, self: { strength: 2 } },
  },
  ai: (e) => cycle(e, ['wings', 'immolate', 'preen']),
});
enemy('magma_behemoth', {
  name: 'Magma Behemoth', icon: '🌋', hp: [158, 164], elite: true,
  moves: {
    smolder: { name: 'Smolder', block: 20, self: { strength: 2 } },
    slam: { name: 'Magma Slam', dmg: 14, cards: [{ id: 'scorch', n: 2, pile: 'draw' }] },
    erupt: { name: 'Eruption', dmg: 28 },
  },
  ai: (e) => cycle(e, ['smolder', 'slam', 'erupt']),
});

// Act 3 boss
enemy('ember_tyrant', {
  name: 'The Ember Tyrant', icon: '👺', hp: [260, 260], boss: true,
  moves: {
    brand: { name: 'Brand', dmg: 14, cards: [{ id: 'scorch', n: 2, pile: 'draw' }] },
    hellfire: { name: 'Hellfire', dmg: 5, hits: 4 },
    decree: { name: "Tyrant's Decree", block: 20, self: { strength: 3 } },
    inferno: { name: 'Inferno', dmg: 30 },
    ascend: { name: 'Ascension', heal: 30, self: { ritual: 1 }, player: { weak: 2 } },
  },
  ai: (e) => {
    if (!e.flags.ascended && e.hp <= e.maxHp / 2) {
      e.flags.ascended = true;
      return 'ascend';
    }
    return cycle(e, ['brand', 'hellfire', 'decree', 'inferno']);
  },
});

// ═════════════════════════ Encounter tables ═════════════════════════
export const ENCOUNTERS = {
  1: {
    weak: [['crypt_rat', 'crypt_rat'], ['drowned_thrall'], ['lantern_moth', 'crypt_rat'], ['bone_archer', 'crypt_rat']],
    strong: [
      ['ghoul'], ['grave_slime', 'crypt_rat'], ['drowned_thrall', 'bone_archer'], ['crypt_rat', 'crypt_rat', 'crypt_rat'],
      ['lantern_moth', 'lantern_moth', 'crypt_rat'], ['grave_slime', 'lantern_moth'], ['drowned_thrall', 'drowned_thrall'],
    ],
    elite: [['gravewarden'], ['ember_wisp', 'ember_wisp'], ['bog_hag']],
    boss: [['drowned_king']],
  },
  2: {
    weak: [['sporeling', 'sporeling'], ['cave_stalker'], ['blight_beetle']],
    strong: [
      ['myconid_brute'], ['fungal_shaman', 'sporeling', 'sporeling'], ['cave_stalker', 'sporeling'], ['blight_beetle', 'sporeling'],
      ['myconid_brute', 'fungal_shaman'], ['cave_stalker', 'cave_stalker'],
    ],
    elite: [['spore_mother'], ['rootbound_knight'], ['carrion_lord']],
    boss: [['rot_colossus']],
  },
  3: {
    weak: [['ember_imp', 'ember_imp'], ['ash_wraith'], ['flame_cultist']],
    strong: [
      ['cinder_golem'], ['ash_wraith', 'ember_imp'], ['flame_cultist', 'ember_imp'], ['obsidian_sentry', 'ember_imp', 'ember_imp'],
      ['ember_imp', 'ember_imp', 'ember_imp'], ['flame_cultist', 'obsidian_sentry'], ['ash_wraith', 'ash_wraith'],
    ],
    elite: [['phoenix_knight'], ['magma_behemoth'], ['flame_cultist', 'flame_cultist']],
    boss: [['ember_tyrant']],
  },
};

export const ACT_NAMES = { 1: 'The Sunken Crypt', 2: 'The Fungal Warrens', 3: 'The Ember Throne' };

// Derive an intent category for display from a move's fields.
export function moveIntent(move) {
  if (move.intent) return move.intent;
  const atk = !!move.dmg;
  const def = !!move.block || !!(move.allies && move.allies.block);
  const buff = !!move.self || !!(move.allies && move.allies.strength) || !!move.heal;
  const debuff = !!move.player || !!move.cards;
  if (move.summon) return 'summon';
  if (atk && debuff) return 'attack_debuff';
  if (atk && def) return 'attack_defend';
  if (atk && buff) return 'attack_buff';
  if (atk) return 'attack';
  if (def && buff) return 'defend_buff';
  if (def) return 'defend';
  if (buff && debuff) return 'buff_debuff';
  if (buff) return 'buff';
  if (debuff) return 'debuff';
  return 'unknown';
}
