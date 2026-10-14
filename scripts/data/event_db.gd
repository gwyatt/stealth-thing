class_name EventDB
## "?" room events. options() lists choices; choose() applies one and returns
## {text, select} where select = {"purpose": "remove"|"upgrade"|"duplicate"|"transform"}
## asks the player to pick a card from their deck.

const EVENTS := {
	"forgotten_shrine": {"name": "Forgotten Shrine", "icon": "idol", "acts": [1, 2, 3],
		"text": "A moss-choked shrine glows faintly in the dark. An offering bowl sits before a faceless idol, and a coin-heavy reliquary lies within reach."},
	"wandering_smith": {"name": "The Wandering Smith", "icon": "mace", "acts": [1, 2, 3],
		"text": "A soot-faced dwarf hammers at a portable anvil. \"Lantern-bearer! I can sharpen something for you. Or mend those wounds of yours, for a price.\""},
	"pool_of_embers": {"name": "Pool of Embers", "icon": "flame", "acts": [1, 2, 3],
		"text": "A shallow pool of liquid fire laps at the stone. Its warmth is strangely inviting."},
	"hooded_merchant": {"name": "Hooded Merchant", "icon": "pouch", "acts": [1, 2, 3],
		"text": "A figure with no face beneath its hood holds out a card that burns without heat. \"A trade. A little of your life for a lot of my power.\""},
	"cracked_chest": {"name": "Cracked Chest", "icon": "chest", "acts": [1, 2, 3],
		"text": "A chest sits half-buried in rubble, its lock rusted through. Something rattles inside. Something also breathes nearby."},
	"whispering_skull": {"name": "Whispering Skull", "icon": "skull", "acts": [1, 2, 3],
		"text": "A skull on a pike turns to face you. \"Listen... listen... I know secrets of fire...\""},
	"lost_pilgrim": {"name": "Lost Pilgrim", "icon": "lantern", "acts": [1, 2, 3],
		"text": "An old pilgrim huddles by a dead lantern. \"Please... I need coin to buy oil. I have nothing to give but this trinket.\""},
	"mirror_pool": {"name": "Mirror Pool", "icon": "eye", "acts": [1, 2, 3],
		"text": "Still black water reflects you perfectly, except your reflection is holding a different card."},
	"fungal_feast": {"name": "Fungal Feast", "icon": "leaf", "acts": [2],
		"text": "Glowing mushrooms of every color carpet the cavern floor. Some look delicious. Some look deadly."},
	"molten_altar": {"name": "Molten Altar", "icon": "pyre", "acts": [2, 3],
		"text": "An altar of cooling magma bears the inscription: \"Give to the flame, and the flame gives back.\""},
	"gambling_imp": {"name": "Gambling Imp", "icon": "coin", "acts": [2, 3],
		"text": "\"Double or nothing, mortal! Fifty gold on a coin toss. Heads, I pay you a hundred. Tails, I keep it.\""},
}

static func _opt(label: String, desc: String, disabled := false) -> Dictionary:
	return {"label": label, "desc": desc, "disabled": disabled}

static func options(id: String, run) -> Array:
	var d: Dictionary = run.data
	match id:
		"forgotten_shrine":
			return [_opt("Pray", "Lose %d HP. Obtain a random relic." % ceili(d.max_hp * 0.12)),
				_opt("Desecrate", "Gain 120 Gold. Become cursed with Gloom."),
				_opt("Leave", "Nothing happens.")]
		"wandering_smith":
			return [_opt("Sharpen", "Upgrade a card.", not run.has_upgradable()),
				_opt("Mend", "Pay 35 Gold. Heal 30% of your Max HP.", d.gold < 35),
				_opt("Leave", "Nothing happens.")]
		"pool_of_embers":
			return [_opt("Bathe", "Lose 6 HP. Remove a card from your deck."),
				_opt("Drink", "Heal 15 HP."), _opt("Leave", "Nothing happens.")]
		"hooded_merchant":
			return [_opt("Trade", "Lose 7 Max HP. Obtain a random Rare card.", d.max_hp <= 10),
				_opt("Refuse", "Nothing happens.")]
		"cracked_chest":
			return [_opt("Smash it open", "Lose 5 HP. Gain 50 Gold and a random potion."), _opt("Leave", "Nothing happens.")]
		"whispering_skull":
			return [_opt("Listen", "Obtain a random Uncommon card."), _opt("Silence it", "Gain 5 Max HP.")]
		"lost_pilgrim":
			return [_opt("Give 60 Gold", "Obtain a random relic.", d.gold < 60),
				_opt("Share your flame", "Lose 4 HP. Upgrade 2 random cards."), _opt("Ignore", "Nothing happens.")]
		"mirror_pool":
			return [_opt("Reach in", "Duplicate a card in your deck."), _opt("Leave", "Nothing happens.")]
		"fungal_feast":
			return [_opt("Feast", "Heal to full. Become cursed with Ache."), _opt("Nibble", "Heal 10 HP.")]
		"molten_altar":
			return [_opt("Offer a card", "Transform a card into a random card."),
				_opt("Offer blood", "Lose 10 HP. Gain 2 random potions."), _opt("Leave", "Nothing happens.")]
		"gambling_imp":
			return [_opt("Gamble 50 Gold", "50% chance: gain 100 Gold. Otherwise lose 50.", d.gold < 50), _opt("Walk away", "Nothing happens.")]
	return [_opt("Leave", "Nothing happens.")]

static func _r(text: String, select := "") -> Dictionary:
	return {"text": text, "select": {"purpose": select} if select != "" else null}

static func choose(id: String, i: int, run) -> Dictionary:
	var d: Dictionary = run.data
	match [id, i]:
		["forgotten_shrine", 0]:
			run.lose_hp(ceili(d.max_hp * 0.12))
			return _r("The idol's eyes open. Pain lances through you, and something is left in your palm: %s." % run.gain_random_relic())
		["forgotten_shrine", 1]:
			run.gain_gold(120)
			run.add_card_to_deck("gloom")
			return _r("You pry the reliquary open. A cold weight settles over your heart.")
		["wandering_smith", 0]: return _r("\"Pick your piece.\"", "upgrade")
		["wandering_smith", 1]:
			run.gain_gold(-35)
			run.heal(ceili(d.max_hp * 0.3))
			return _r("The smith packs your wounds with warm ash. You feel better.")
		["pool_of_embers", 0]:
			run.lose_hp(6)
			return _r("The fire burns away something you no longer need.", "remove")
		["pool_of_embers", 1]:
			run.heal(15)
			return _r("It tastes of smoke and honey.")
		["hooded_merchant", 0]:
			run.lose_max_hp(7)
			return _r("The merchant presses %s into your hands and is gone." % run.gain_random_card("rare"))
		["cracked_chest", 0]:
			run.lose_hp(5)
			run.gain_gold(50)
			var p: String = run.gain_random_potion()
			return _r("Splinters fly. Inside: coins and a %s." % p if p != "" else "Splinters fly. Inside: coins, and a potion you have no room to carry.")
		["whispering_skull", 0]:
			return _r("The skull whispers until you understand: %s." % run.gain_random_card("uncommon"))
		["whispering_skull", 1]:
			run.gain_max_hp(5)
			return _r("The skull shatters. You feel strangely invigorated.")
		["lost_pilgrim", 0]:
			run.gain_gold(-60)
			return _r("The pilgrim weeps with gratitude and gives you %s." % run.gain_random_relic())
		["lost_pilgrim", 1]:
			run.lose_hp(4)
			run.upgrade_random(2)
			return _r("You relight their lantern. Its warmth flows back into your cards.")
		["mirror_pool", 0]: return _r("Choose what to copy.", "duplicate")
		["fungal_feast", 0]:
			run.heal(d.max_hp)
			run.add_card_to_deck("ache")
			return _r("Delicious. Your stomach disagrees, permanently.")
		["fungal_feast", 1]:
			run.heal(10)
			return _r("Just a taste.")
		["molten_altar", 0]: return _r("The altar hungers.", "transform")
		["molten_altar", 1]:
			run.lose_hp(10)
			run.gain_random_potion()
			run.gain_random_potion()
			return _r("Two flasks bubble up from the magma.")
		["gambling_imp", 0]:
			if run.rng.chance(0.5):
				run.gain_gold(50)
				return _r("Heads! The imp pays up, grumbling.")
			run.gain_gold(-50)
			return _r("Tails. The imp cackles and vanishes in a puff of smoke.")
	return _r("You move on.")
