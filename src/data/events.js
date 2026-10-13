// Map "?" events. options(run) returns choices; each choice's `effect(run, api)` returns
// { text, select? } where select = { purpose: 'remove'|'upgrade'|'duplicate'|'transform' }
// asks the UI to have the player pick a card from their deck.

export const EVENTS = {};

function event(id, def) {
  EVENTS[id] = { id, acts: [1, 2, 3], ...def };
}

event('forgotten_shrine', {
  name: 'Forgotten Shrine', icon: '⛩️',
  text: 'A moss-choked shrine glows faintly in the dark. An offering bowl sits before a faceless idol, and a coin-heavy reliquary lies within reach.',
  options: (run, api) => [
    {
      label: 'Pray', desc: `Lose ${Math.ceil(run.maxHp * 0.12)} HP. Obtain a random relic.`,
      effect: (run, api) => {
        api.loseHp(Math.ceil(run.maxHp * 0.12));
        const r = api.gainRandomRelic();
        return { text: `The idol's eyes open. Pain lances through you — and something is left in your palm: ${r.name}.` };
      },
    },
    {
      label: 'Desecrate', desc: 'Gain 120 Gold. Become cursed with Gloom.',
      effect: (run, api) => {
        api.gainGold(120);
        api.addCardToDeck('gloom');
        return { text: 'You pry the reliquary open. A cold weight settles over your heart.' };
      },
    },
    { label: 'Leave', desc: 'Nothing happens.', effect: () => ({ text: 'You leave the shrine undisturbed.' }) },
  ],
});

event('wandering_smith', {
  name: 'The Wandering Smith', icon: '⚒️',
  text: 'A soot-faced dwarf hammers at a portable anvil. "Lantern-bearer! I can sharpen something for you. Or mend those wounds of yours, for a price."',
  options: (run, api) => [
    {
      label: 'Sharpen', desc: 'Upgrade a card.',
      disabled: !api.hasUpgradable(),
      effect: () => ({ text: '"Pick your piece."', select: { purpose: 'upgrade' } }),
    },
    {
      label: 'Mend', desc: 'Pay 35 Gold. Heal 30% of your Max HP.',
      disabled: run.gold < 35,
      effect: (run, api) => {
        api.gainGold(-35);
        api.heal(Math.ceil(run.maxHp * 0.3));
        return { text: 'The smith packs your wounds with warm ash. You feel better.' };
      },
    },
    { label: 'Leave', desc: 'Nothing happens.', effect: () => ({ text: '"Suit yourself."' }) },
  ],
});

event('pool_of_embers', {
  name: 'Pool of Embers', icon: '♨️',
  text: 'A shallow pool of liquid fire laps at the stone. Its warmth is strangely inviting.',
  options: () => [
    {
      label: 'Bathe', desc: 'Lose 6 HP. Remove a card from your deck.',
      effect: (run, api) => {
        api.loseHp(6);
        return { text: 'The fire burns away something you no longer need.', select: { purpose: 'remove' } };
      },
    },
    {
      label: 'Drink', desc: 'Heal 15 HP.',
      effect: (run, api) => { api.heal(15); return { text: 'It tastes of smoke and honey.' }; },
    },
    { label: 'Leave', desc: 'Nothing happens.', effect: () => ({ text: 'You step around the pool.' }) },
  ],
});

event('hooded_merchant', {
  name: 'Hooded Merchant', icon: '🧥',
  text: 'A figure with no face beneath its hood holds out a card that seems to burn without heat. "A trade. A little of your life for a lot of my power."',
  options: (run, api) => [
    {
      label: 'Trade', desc: 'Lose 7 Max HP. Obtain a random Rare card.',
      disabled: run.maxHp <= 10,
      effect: (run, api) => {
        api.loseMaxHp(7);
        const c = api.gainRandomCard('rare');
        return { text: `The merchant presses ${c.name} into your hands and is gone.` };
      },
    },
    { label: 'Refuse', desc: 'Nothing happens.', effect: () => ({ text: '"Another time, then."' }) },
  ],
});

event('cracked_chest', {
  name: 'Cracked Chest', icon: '📦',
  text: 'A chest sits half-buried in rubble, its lock rusted through. Something rattles inside. Something also breathes nearby.',
  options: () => [
    {
      label: 'Smash it open', desc: 'Lose 5 HP. Gain 50 Gold and a random potion.',
      effect: (run, api) => {
        api.loseHp(5);
        api.gainGold(50);
        const p = api.gainRandomPotion();
        return { text: p ? `Splinters fly. Inside: coins and a ${p.name}.` : 'Splinters fly. Inside: coins, and a potion you have no room to carry.' };
      },
    },
    { label: 'Leave', desc: 'Nothing happens.', effect: () => ({ text: 'Better not.' }) },
  ],
});

event('whispering_skull', {
  name: 'Whispering Skull', icon: '💀',
  text: 'A skull on a pike turns to face you. "Listen... listen... I know secrets of fire..."',
  options: () => [
    {
      label: 'Listen', desc: 'Obtain a random Uncommon card.',
      effect: (run, api) => { const c = api.gainRandomCard('uncommon'); return { text: `The skull whispers until you understand: ${c.name}.` }; },
    },
    {
      label: 'Silence it', desc: 'Gain 5 Max HP.',
      effect: (run, api) => { api.gainMaxHp(5); return { text: 'The skull shatters. You feel strangely invigorated.' }; },
    },
  ],
});

event('lost_pilgrim', {
  name: 'Lost Pilgrim', icon: '🧎',
  text: 'An old pilgrim huddles by a dead lantern. "Please... I need coin to buy oil. I have nothing else to give but this trinket."',
  options: (run, api) => [
    {
      label: 'Give 60 Gold', desc: 'Obtain a random relic.',
      disabled: run.gold < 60,
      effect: (run, api) => {
        api.gainGold(-60);
        const r = api.gainRandomRelic();
        return { text: `The pilgrim weeps with gratitude and gives you ${r.name}.` };
      },
    },
    {
      label: 'Share your flame', desc: 'Lose 4 HP. Upgrade 2 random cards.',
      effect: (run, api) => {
        api.loseHp(4);
        const n = api.upgradeRandom(2);
        return { text: n ? 'You relight their lantern. Its warmth flows back into your cards.' : 'You relight their lantern.' };
      },
    },
    { label: 'Ignore', desc: 'Nothing happens.', effect: () => ({ text: 'You walk on. Their sobbing follows you.' }) },
  ],
});

event('mirror_pool', {
  name: 'Mirror Pool', icon: '🪞',
  text: 'Still black water reflects you perfectly — except your reflection is holding a different card.',
  options: () => [
    { label: 'Reach in', desc: 'Duplicate a card in your deck.', effect: () => ({ text: 'Choose what to copy.', select: { purpose: 'duplicate' } }) },
    { label: 'Leave', desc: 'Nothing happens.', effect: () => ({ text: 'You look away.' }) },
  ],
});

event('fungal_feast', {
  name: 'Fungal Feast', icon: '🍄', acts: [2],
  text: 'Glowing mushrooms of every color carpet the cavern floor. Some look delicious. Some look deadly.',
  options: () => [
    {
      label: 'Feast', desc: 'Heal to full. Become cursed with Ache.',
      effect: (run, api) => { api.heal(run.maxHp); api.addCardToDeck('ache'); return { text: 'Delicious. Your stomach disagrees, permanently.' }; },
    },
    {
      label: 'Nibble', desc: 'Heal 10 HP.',
      effect: (run, api) => { api.heal(10); return { text: 'Just a taste.' }; },
    },
  ],
});

event('molten_altar', {
  name: 'Molten Altar', icon: '🔥', acts: [2, 3],
  text: 'An altar of cooling magma bears the inscription: "Give to the flame, and the flame gives back."',
  options: () => [
    {
      label: 'Offer a card', desc: 'Transform a card into a random card.',
      effect: () => ({ text: 'The altar hungers.', select: { purpose: 'transform' } }),
    },
    {
      label: 'Offer blood', desc: 'Lose 10 HP. Gain 2 random potions.',
      effect: (run, api) => { api.loseHp(10); api.gainRandomPotion(); api.gainRandomPotion(); return { text: 'Two flasks bubble up from the magma.' }; },
    },
    { label: 'Leave', desc: 'Nothing happens.', effect: () => ({ text: 'You leave the altar cold.' }) },
  ],
});

event('gambling_imp', {
  name: 'Gambling Imp', icon: '🎲', acts: [2, 3],
  text: '"Double or nothing, mortal! Fifty gold on a coin toss. Heads, I pay you a hundred. Tails, I keep it."',
  options: (run, api) => [
    {
      label: 'Gamble 50 Gold', desc: '50% chance: gain 100 Gold. Otherwise lose 50.',
      disabled: run.gold < 50,
      effect: (run, api) => {
        if (api.rng.chance(0.5)) { api.gainGold(50); return { text: 'Heads! The imp pays up, grumbling.' }; }
        api.gainGold(-50);
        return { text: 'Tails. The imp cackles and vanishes in a puff of smoke.' };
      },
    },
    { label: 'Walk away', desc: 'Nothing happens.', effect: () => ({ text: '"Coward!"' }) },
  ],
});
