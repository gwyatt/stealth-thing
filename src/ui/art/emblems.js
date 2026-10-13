// Engraved, single-colour emblems (64×64) used for card art, icons, intents and statuses.
// Shapes use currentColor; `.cut` marks dark cut-outs styled by CSS.
const S = (d, w = 5) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const CUT = 'class="cut"';

const sword = `<path d="M55 4 L60 9 L26 43 L21 38Z"/><path d="M12 34 L30 52 L27 55 L9 37Z"/>${S('M19 45 L9 55', 6)}<circle cx="7" cy="57" r="4"/>`;
const shield = `<path d="M32 5 L55 12 C55 35 46 49 32 59 C18 49 9 35 9 12Z"/><path ${CUT} d="M32 12 L48 17 C48 33 42 43 32 51Z"/>`;
const flame = `<path d="M32 61 C15 59 9 45 15 32 C18 40 24 42 24 35 C24 23 33 17 30 3 C45 13 54 28 51 43 C49 55 42 61 32 61Z"/><path ${CUT} d="M32 55 C25 54 22 47 25 41 C28 45 31 44 31 40 C31 35 34 32 34 27 C40 33 42 41 40 47 C39 52 36 55 32 55Z"/>`;

export const EMBLEMS = {
  sword,
  swords: `${sword}<g transform="translate(64 0) scale(-1 1)">${sword}</g>`,
  shield,
  flame,
  lantern: `${S('M24 10 C24 3 40 3 40 10', 4)}<path d="M20 12 H44 L41 18 H23Z"/><path d="M21 18 H43 V50 H21Z"/><path ${CUT} d="M25 21 H39 V47 H25Z"/><path d="M32 45 C27 44 26 38 30 32 C31 36 33 36 33 33 C36 37 37 43 32 45Z"/><path d="M18 50 H46 L43 57 H21Z"/>`,
  candle: `<path d="M24 28 H40 V60 H24Z"/><path d="M22 58 H42 V62 H22Z"/><path d="M32 25 C26 23 25 15 32 5 C39 15 38 23 32 25Z"/>`,
  fist: `<path d="M14 26 C14 20 20 19 22 23 C22 16 30 15 31 21 C32 15 40 15 41 21 C43 16 50 18 50 24 V38 C50 50 43 58 33 58 H26 C18 58 14 52 14 44Z"/><path ${CUT} d="M22 24 V33 M31 22 V32 M41 22 V32" stroke="#000" stroke-width="2"/><path d="M8 34 C8 28 16 27 18 32 L20 42 C14 44 8 40 8 34Z"/>`,
  chain: `${S('M8 38 C2 32 8 22 16 26 L24 30 C30 34 26 44 18 42Z', 4.5)}${S('M24 34 C20 26 28 18 36 22 L42 26 C48 30 44 40 36 38Z', 4.5)}${S('M42 28 C38 20 46 12 54 16 L58 20', 4.5)}`,
  dart: `<path d="M58 6 L50 26 L44 20Z"/>${S('M47 23 L12 52', 4)}<path d="M8 50 L16 46 L18 54 L10 58Z"/><path d="M20 10 L22 18 L30 20 L22 22 L20 30 L18 22 L10 20 L18 18Z"/>`,
  bolt: `<path d="M38 2 L12 36 H28 L22 62 L52 24 H35Z"/>`,
  eye: `<path d="M2 32 C14 14 50 14 62 32 C50 50 14 50 2 32Z"/><circle ${CUT} cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="7"/>`,
  skull: `<path d="M32 4 C15 4 8 16 9 29 C10 37 14 41 18 43 V54 H46 V43 C50 41 54 37 55 29 C56 16 49 4 32 4Z"/><path ${CUT} d="M17 28 C17 22 27 22 27 29 C27 35 17 35 17 28Z M37 29 C37 22 47 22 47 28 C47 35 37 35 37 29Z M29 40 L32 34 L35 40Z"/><path ${CUT} d="M24 47 V54 M32 47 V54 M40 47 V54" stroke="#000" stroke-width="2.5"/>`,
  skullHorned: `<path d="M32 12 C18 12 13 22 14 32 C15 38 18 41 21 42 V52 H43 V42 C46 41 49 38 50 32 C51 22 46 12 32 12Z"/><path d="M15 22 C6 18 4 8 8 2 C10 10 16 14 22 16Z M49 22 C58 18 60 8 56 2 C54 10 48 14 42 16Z"/><path ${CUT} d="M21 31 C21 26 29 26 29 32 C29 37 21 37 21 31Z M35 32 C35 26 43 26 43 31 C43 37 35 37 35 32Z"/>`,
  feather: `<path d="M54 4 C30 8 14 26 12 48 L16 52 C38 50 56 32 58 8Z"/>${S('M8 58 L48 16', 3)}<path ${CUT} d="M26 40 L38 40 M30 32 L44 30 M22 46 L30 48" stroke="#000" stroke-width="2"/>`,
  sun: `<circle cx="32" cy="32" r="13"/>${S('M32 3 V12 M32 52 V61 M3 32 H12 M52 32 H61 M11 11 L17 17 M47 47 L53 53 M53 11 L47 17 M17 47 L11 53', 4)}`,
  star: `<path d="M32 2 L37 25 L60 18 L42 32 L60 46 L37 39 L32 62 L27 39 L4 46 L22 32 L4 18 L27 25Z"/>`,
  smoke: `${S('M14 54 C6 46 18 40 12 32 C6 24 16 16 12 8', 4)}${S('M32 58 C24 48 38 42 30 32 C24 24 34 16 30 6', 4)}${S('M50 54 C42 46 54 40 48 32 C42 24 52 16 48 8', 4)}`,
  blood: `<path d="M32 4 C40 20 52 32 52 44 C52 55 43 62 32 62 C21 62 12 55 12 44 C12 32 24 20 32 4Z"/><path ${CUT} d="M20 44 C20 50 24 54 28 55" stroke="#000" stroke-width="3" fill="none"/>`,
  wing: `<path d="M6 54 C10 30 26 10 58 6 C52 14 50 18 52 22 C44 22 42 26 44 30 C36 30 34 34 36 38 C28 38 26 42 28 46 C20 46 14 50 6 54Z"/>`,
  boot: `<path d="M18 4 H38 V36 L56 42 C60 44 60 54 56 56 H14 V44 C14 40 18 38 18 34Z"/><path ${CUT} d="M14 50 H58" stroke="#000" stroke-width="2.5"/>`,
  hand: `<path d="M16 34 V20 C16 16 22 16 22 20 V30 V12 C22 8 28 8 28 12 V28 V8 C28 4 34 4 34 8 V28 V12 C34 8 40 8 40 12 V32 L44 26 C47 22 52 25 50 30 L42 48 C38 56 32 60 26 60 C18 60 14 54 14 46Z"/>`,
  mace: `${S('M10 58 L36 32', 6)}<circle cx="42" cy="22" r="13"/><path d="M42 2 L46 10 H38Z M62 22 L54 26 V18Z M42 42 L38 34 H46Z M22 22 L30 18 V26Z M56 8 L52 16 L48 12Z"/>`,
  tower: `<path d="M14 6 H22 V12 H28 V6 H36 V12 H42 V6 H50 V20 L46 24 V58 H18 V24 L14 20Z"/><path ${CUT} d="M28 58 V46 C28 40 36 40 36 46 V58Z M30 28 H34 V36 H30Z"/>`,
  breastplate: `<path d="M10 10 C18 6 24 8 32 14 C40 8 46 6 54 10 L52 28 C52 46 44 58 32 60 C20 58 12 46 12 28Z"/><path ${CUT} d="M32 18 V56 M18 32 C24 36 40 36 46 32" stroke="#000" stroke-width="2.5" fill="none"/>`,
  pyre: `<path d="M6 54 L50 40 L54 46 L10 60Z M14 40 L58 54 L54 60 L10 46Z"/><path d="M32 44 C22 42 20 32 26 24 C27 30 31 30 30 26 C30 20 33 15 32 8 C40 16 44 26 42 34 C41 40 38 44 32 44Z"/>`,
  slash: `<path d="M6 56 C14 26 34 8 60 4 C42 14 26 30 16 58Z"/><path d="M20 60 C26 42 40 26 58 18 C46 30 36 44 30 62Z" opacity="0.6"/>`,
  heart: `<path d="M32 58 C10 42 4 30 6 20 C8 8 24 4 32 18 C40 4 56 8 58 20 C60 30 54 42 32 58Z"/>`,
  crown: `<path d="M6 48 L4 14 L18 30 L32 8 L46 30 L60 14 L58 48Z"/><path d="M6 52 H58 V58 H6Z"/><circle ${CUT} cx="32" cy="38" r="4"/>`,
  spiral: S('M32 32 C32 28 38 28 38 33 C38 40 26 40 26 32 C26 22 44 22 44 33 C44 46 20 46 20 32 C20 16 50 16 50 33 C50 52 14 52 14 32', 4),
  arrowUp: `<path d="M32 4 L56 30 H42 V60 H22 V30 H8Z"/>`,
  horn: `<path d="M8 52 C10 30 26 14 50 10 L58 4 L58 18 C40 20 26 32 22 56 C18 60 10 58 8 52Z"/><path ${CUT} d="M20 40 L28 44 M26 30 L34 36 M34 22 L42 28" stroke="#000" stroke-width="2.5"/>`,
  pouch: `<path d="M24 8 H40 L36 16 C50 22 58 34 56 46 C54 56 44 60 32 60 C20 60 10 56 8 46 C6 34 14 22 28 16Z"/><path ${CUT} d="M26 18 H38" stroke="#000" stroke-width="3"/>`,
  chest: `<path d="M6 26 C6 14 14 8 32 8 C50 8 58 14 58 26Z"/><path d="M6 30 H58 V58 H6Z"/><path ${CUT} d="M6 28 H58 M28 26 H36 V38 H28Z" stroke="#000" stroke-width="2.5"/>`,
  rune: `<path d="M32 2 L60 32 L32 62 L4 32Z"/><path ${CUT} d="M24 24 C24 14 40 14 40 24 C40 32 32 32 32 40 M32 47 V50" stroke="#000" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  bonfire: `${S('M30 6 L32 46', 4)}<path d="M24 14 H40 V18 H24Z"/><path d="M32 54 C18 52 16 40 22 30 C24 36 28 38 28 32 C30 40 34 40 34 34 C38 38 40 32 40 28 C48 36 46 52 32 54Z"/><path d="M4 56 C14 50 50 50 60 56 V62 H4Z"/>`,
  hourglass: `<path d="M12 4 H52 V10 H12Z M12 54 H52 V60 H12Z"/><path d="M16 10 H48 C48 24 38 28 36 32 C38 36 48 40 48 54 H16 C16 40 26 36 28 32 C26 28 16 24 16 10Z"/><path ${CUT} d="M22 14 H42 C40 22 34 24 32 28 C30 24 24 22 22 14Z"/>`,
  ring: `${S('M32 58 C16 58 10 46 12 36 C14 26 22 22 32 22 C42 22 50 26 52 36 C54 46 48 58 32 58Z', 6)}<path d="M22 14 L32 4 L42 14 L32 22Z"/>`,
  gem: `<path d="M16 6 H48 L60 22 L32 60 L4 22Z"/><path ${CUT} d="M4 22 H60 M24 6 L20 22 L32 60 L44 22 L40 6" stroke="#000" stroke-width="2" fill="none"/>`,
  flask: `<path d="M26 4 H38 V10 H36 V22 C48 26 56 34 56 44 C56 54 46 62 32 62 C18 62 8 54 8 44 C8 34 16 26 28 22 V10 H26Z"/><path class="liquid" d="M12 42 C20 38 26 46 32 42 C38 38 44 46 52 42 C54 52 46 58 32 58 C18 58 10 52 12 42Z"/>`,
  thorns: `${S('M4 50 C18 34 30 46 40 30 C48 18 56 14 60 12', 5)}<path d="M14 40 L10 30 L20 38Z M28 40 L34 50 L24 44Z M38 32 L34 22 L42 28Z M50 18 L56 26 L48 22Z"/>`,
  crackedShield: `${shield}<path ${CUT} d="M30 6 L36 20 L26 30 L36 42 L30 58" stroke="#000" stroke-width="3.5" fill="none"/>`,
  brokenSword: `<path d="M44 16 L50 20 L26 44 L22 40Z"/><path d="M52 6 L58 10 L54 14 L48 10Z"/><path d="M12 34 L30 52 L27 55 L9 37Z"/>${S('M19 45 L9 55', 6)}<circle cx="7" cy="57" r="4"/>`,
  bone: `<path d="M14 20 C6 20 4 10 10 6 C14 2 22 6 20 12 L44 36 C50 34 56 38 56 44 C60 46 60 56 52 58 C50 62 40 60 42 52 L18 28 C16 30 10 28 10 24Z"/>`,
  leaf: `<path d="M8 56 C8 26 26 8 58 6 C58 38 40 56 8 56Z"/>${S('M8 56 L44 20', 3)}`,
  helm: `<path d="M32 4 C14 4 10 20 10 30 V58 H54 V30 C54 20 50 4 32 4Z"/><path ${CUT} d="M16 30 H48 V36 H16Z M30 36 H34 V52 H30Z"/>`,
  scroll: `<path d="M14 10 H50 C56 10 56 20 50 20 V50 C50 58 42 58 40 54 H8 C2 54 2 44 8 44 H14Z"/><path ${CUT} d="M20 24 H42 M20 32 H42 M20 40 H36" stroke="#000" stroke-width="2.5"/>`,
  drum: `<ellipse cx="32" cy="18" rx="24" ry="8"/><path d="M8 18 V46 C8 52 56 52 56 46 V18 C56 24 8 24 8 18Z"/><path ${CUT} d="M10 24 L22 46 L34 26 L46 46 L54 26" stroke="#000" stroke-width="2.5" fill="none"/>`,
  coin: `<circle cx="32" cy="32" r="26"/><circle ${CUT} cx="32" cy="32" r="19"/><path d="M32 18 L38 30 L32 46 L26 30Z"/>`,
  compass: `<circle cx="32" cy="32" r="27"/><circle ${CUT} cx="32" cy="32" r="21"/><path d="M32 12 L38 32 L32 52 L26 32Z"/>`,
  idol: `<path d="M22 6 H42 C46 6 48 10 48 14 V28 C48 34 44 36 42 36 V46 H50 V58 H14 V46 H22 V36 C20 36 16 34 16 28 V14 C16 10 18 6 22 6Z"/><path ${CUT} d="M22 20 H28 M36 20 H42 M28 30 H36" stroke="#000" stroke-width="3"/>`,
  berry: `<circle cx="22" cy="38" r="11"/><circle cx="42" cy="38" r="11"/><circle cx="32" cy="52" r="10"/><circle cx="32" cy="26" r="9"/><path d="M32 18 C30 10 36 4 46 4 C44 10 38 14 32 18Z"/>`,
  stone: `<path d="M8 40 C6 26 18 14 34 14 C50 14 60 26 56 40 C54 52 40 58 30 58 C18 58 10 52 8 40Z"/><path ${CUT} d="M22 30 C28 26 36 28 40 34" stroke="#000" stroke-width="2.5" fill="none"/>`,
  cards: `<path d="M8 14 L32 8 L42 50 L18 56Z" opacity="0.55"/><path d="M22 8 H48 V54 H22Z"/><path ${CUT} d="M27 13 H43 V49 H27Z"/>`,
  map: `<path d="M4 12 L22 6 L42 12 L60 6 V52 L42 58 L22 52 L4 58Z"/><path ${CUT} d="M22 6 V52 M42 12 V58" stroke="#000" stroke-width="2"/><path ${CUT} d="M10 40 L18 30 L28 36 L38 22 L50 26" stroke="#000" stroke-width="2.5" fill="none" stroke-dasharray="3 3"/>`,
  gear: `<circle cx="32" cy="32" r="16"/><path d="M28 2 H36 L38 12 H26Z M28 62 H36 L38 52 H26Z M2 28 V36 L12 38 V26Z M62 28 V36 L52 38 V26Z M9 14 L14 9 L22 16 L16 22Z M55 50 L50 55 L42 48 L48 42Z M50 9 L55 14 L48 22 L42 16Z M14 55 L9 50 L16 42 L22 48Z"/><circle ${CUT} cx="32" cy="32" r="7"/>`,
};

export function emblem(name, cls = '', style = '') {
  return `<svg class="emblem ${cls}" viewBox="0 0 64 64" aria-hidden="true"${style ? ` style="${style}"` : ''}>${EMBLEMS[name] || EMBLEMS.rune}</svg>`;
}

// ── Mappings ──
export const CARD_EMBLEM = {
  strike: 'sword', guard: 'shield', kindle: 'candle', ember_slash: 'slash', twin_cut: 'swords', lantern_bash: 'mace',
  cinder_sweep: 'slash', quick_jab: 'fist', searing_strike: 'sword', hooked_chain: 'chain', spark_dart: 'dart',
  flicker_strike: 'bolt', brace: 'shield', ash_veil: 'smoke', stoke: 'pyre', smoke_screen: 'smoke', gather_embers: 'hand',
  sidestep: 'boot', tinder: 'flame', flare: 'sun', immolate: 'flame', kindling_pyre: 'pyre', bulwark: 'tower',
  ashen_armor: 'breastplate', wildfire: 'flame', cinder_storm: 'star', lantern_ward: 'lantern', burning_blood: 'blood',
  inferno_fist: 'fist', molten_edge: 'sword', ember_ward: 'shield', backdraft: 'shield', smother: 'smoke',
  pilgrims_step: 'boot', stoked_blade: 'sword', heat_shimmer: 'eye', reckless_flame: 'flame', supernova: 'star',
  eternal_flame: 'candle', phoenix_feather: 'feather', pyroclasm: 'flame', conflagration: 'pyre', overcharge: 'bolt',
  blazing_barrier: 'thorns', ignition: 'lantern', twin_suns: 'sun', ashborn: 'wing',
  scorch: 'flame', wound: 'blood', slimed: 'blood', dazed: 'spiral', gloom: 'skull', ache: 'bone',
};

export const RELIC_EMBLEM = {
  brass_lantern: ['lantern', '#d9a04a'], coal_pouch: ['pouch', '#8a7a6a'], oaken_shield: ['shield', '#9a7448'],
  smelling_salts: ['flask', '#c8d0d8'], vial_of_embers: ['flask', '#e0662a'], iron_ring: ['ring', '#9a958c'],
  feather_charm: ['feather', '#c8c0b0'], hearthstone: ['stone', '#c8803a'], lucky_coin: ['coin', '#d9b04a'],
  wild_berry: ['berry', '#9a3a5a'], crystal_prism: ['gem', '#9ac8e0'], metronome: ['hourglass', '#b8a07a'],
  ember_heart: ['heart', '#d84a2a'], warm_cloak: ['breastplate', '#8a5a3a'], ashen_idol: ['idol', '#9a948a'],
  golden_compass: ['compass', '#d9b04a'], potion_belt: ['pouch', '#a07a4a'], phoenix_plume: ['wing', '#ff7a2a'],
  lens_of_focus: ['eye', '#9ac8e0'], ancient_coal: ['stone', '#5a4a40'], thorny_vine: ['thorns', '#6a8a4a'],
  mirror_shard: ['gem', '#c8d8e8'], war_drum: ['drum', '#a0603a'], merchants_seal: ['scroll', '#c8b088'],
  bottled_star: ['star', '#f0e0a0'], sunstone: ['sun', '#f0b040'], hungry_lantern: ['lantern', '#8a3a2a'],
  cursed_crown: ['crown', '#8a6aa0'], everburning_wick: ['candle', '#f0a040'], runic_hourglass: ['hourglass', '#7ab0c8'],
  molten_core: ['heart', '#ff6a1a'],
};

export const POTION_COLOR = {
  healing_draught: '#c83a3a', fire_flask: '#ff7a1a', block_tonic: '#5a8ac8', strength_elixir: '#a02a1a',
  swift_potion: '#6ac8a0', energy_potion: '#f0d050', liquid_light: '#fff0a0', fear_potion: '#7a3aa0',
  burning_oil: '#3a2a1a', weakening_mist: '#8a9aa0', smoke_bomb: '#5a5a5a', elixir_of_ages: '#d9b04a',
};

export const STATUS_EMBLEM = {
  strength: 'fist', dexterity: 'feather', weak: 'brokenSword', vulnerable: 'crackedShield', frail: 'bone', burn: 'flame',
  thorns: 'thorns', ritual: 'candle', platedArmor: 'helm', regen: 'leaf', enrage: 'skullHorned', rebirth: 'wing',
  kindlingPyre: 'pyre', ashenArmor: 'breastplate', emberWard: 'shield', eternalFlame: 'sun', pyroclasm: 'flame',
  phoenix: 'wing', drawNext: 'eye', energyNext: 'bolt', stokedBlade: 'sword',
};

export const INTENT_EMBLEM = { attack: 'sword', defend: 'shield', buff: 'arrowUp', debuff: 'spiral', summon: 'horn', unknown: 'rune' };

export const NODE_EMBLEM = { combat: 'swords', elite: 'skullHorned', rest: 'bonfire', shop: 'pouch', event: 'rune', treasure: 'chest', boss: 'crown' };
