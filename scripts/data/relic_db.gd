class_name RelicDB
## Relics. Passive numbers (energy, max_light, …) are read directly by the engine;
## event-driven effects live in the hook functions below.

const RELICS := {
	# ── Starter ──
	"brass_lantern": {"name": "Brass Lantern", "rarity": "starter", "icon": "lantern", "tint": "d9a04a", "desc": "Start each combat with 2 Light."},
	# ── Common ──
	"coal_pouch": {"name": "Coal Pouch", "rarity": "common", "icon": "pouch", "tint": "8a7a6a", "desc": "Start each combat with 2 additional Light."},
	"oaken_shield": {"name": "Oaken Shield", "rarity": "common", "icon": "shield", "tint": "9a7448", "desc": "Start each combat with 10 Block."},
	"smelling_salts": {"name": "Smelling Salts", "rarity": "common", "icon": "flask", "tint": "c8d0d8", "desc": "Draw 2 additional cards on the first turn of each combat."},
	"vial_of_embers": {"name": "Vial of Embers", "rarity": "common", "icon": "flask", "tint": "e0662a", "desc": "At the start of each combat, apply 3 Burn to ALL enemies."},
	"iron_ring": {"name": "Iron Ring", "rarity": "common", "icon": "ring", "tint": "9a958c", "desc": "Start each combat with 1 Strength."},
	"feather_charm": {"name": "Feather Charm", "rarity": "common", "icon": "feather", "tint": "c8c0b0", "desc": "Start each combat with 1 Dexterity."},
	"hearthstone": {"name": "Hearthstone", "rarity": "common", "icon": "stone", "tint": "c8803a", "desc": "At the end of combat, heal 5 HP."},
	"lucky_coin": {"name": "Lucky Coin", "rarity": "common", "icon": "coin", "tint": "d9b04a", "desc": "Gain 12 additional Gold after each combat.", "bonus_gold": 12},
	"wild_berry": {"name": "Wild Berry", "rarity": "common", "icon": "berry", "tint": "9a3a5a", "desc": "Upon pickup, raise your Max HP by 7."},
	# ── Uncommon ──
	"crystal_prism": {"name": "Crystal Prism", "rarity": "uncommon", "icon": "gem", "tint": "9ac8e0", "desc": "Whenever you gain Light, gain 1 additional Light.", "light_bonus": 1},
	"metronome": {"name": "Metronome", "rarity": "uncommon", "icon": "hourglass", "tint": "b8a07a", "desc": "Every 3rd Attack you play each turn draws a card."},
	"ember_heart": {"name": "Ember Heart", "rarity": "uncommon", "icon": "heart", "tint": "d84a2a", "desc": "Whenever an enemy dies, gain 1 Energy and draw 1 card."},
	"warm_cloak": {"name": "Warm Cloak", "rarity": "uncommon", "icon": "breastplate", "tint": "8a5a3a", "desc": "At the end of your turn, if you have no Block, gain 6 Block."},
	"ashen_idol": {"name": "Ashen Idol", "rarity": "uncommon", "icon": "idol", "tint": "9a948a", "desc": "Whenever you apply Burn, apply 1 more.", "burn_bonus": 1},
	"golden_compass": {"name": "Golden Compass", "rarity": "uncommon", "icon": "compass", "tint": "d9b04a", "desc": "Card rewards offer 1 additional choice.", "extra_card_choice": 1},
	"potion_belt": {"name": "Potion Belt", "rarity": "uncommon", "icon": "pouch", "tint": "a07a4a", "desc": "Upon pickup, gain 2 potion slots."},
	# ── Rare ──
	"phoenix_plume": {"name": "Phoenix Plume", "rarity": "rare", "icon": "wing", "tint": "ff7a2a", "desc": "The first time you would die, heal to 50% of your Max HP instead. (Once per run.)"},
	"lens_of_focus": {"name": "Lens of Focus", "rarity": "rare", "icon": "eye", "tint": "9ac8e0", "desc": "The first Attack you play each combat deals double damage."},
	"ancient_coal": {"name": "Ancient Coal", "rarity": "rare", "icon": "stone", "tint": "5a4a40", "desc": "At the start of your turn, gain 1 Light."},
	"thorny_vine": {"name": "Thorny Vine", "rarity": "rare", "icon": "thorns", "tint": "6a8a4a", "desc": "Start each combat with 3 Thorns."},
	"mirror_shard": {"name": "Mirror Shard", "rarity": "rare", "icon": "gem", "tint": "c8d8e8", "desc": "Your maximum Light is increased by 5.", "max_light": 5},
	"war_drum": {"name": "War Drum", "rarity": "rare", "icon": "drum", "tint": "a0603a", "desc": "Every 3 turns, gain 1 Strength."},
	# ── Shop ──
	"merchants_seal": {"name": "Merchant's Seal", "rarity": "shop", "icon": "scroll", "tint": "c8b088", "desc": "Everything in shops costs 25% less.", "shop_discount": 0.25},
	"bottled_star": {"name": "Bottled Star", "rarity": "shop", "icon": "star", "tint": "f0e0a0", "desc": "At the start of each combat, gain 1 Energy."},
	# ── Boss ──
	"sunstone": {"name": "Sunstone", "rarity": "boss", "icon": "sun", "tint": "f0b040", "desc": "Gain 1 Energy at the start of each turn. Your Light wanes by 2 instead of 1.", "energy": 1, "extra_wane": 1},
	"hungry_lantern": {"name": "Hungry Lantern", "rarity": "boss", "icon": "lantern", "tint": "8a3a2a", "desc": "Gain 1 Energy at the start of each turn. You can no longer Rest at campfires.", "energy": 1, "no_rest": true},
	"cursed_crown": {"name": "Cursed Crown", "rarity": "boss", "icon": "crown", "tint": "8a6aa0", "desc": "Gain 1 Energy at the start of each turn. Upon pickup, add 2 Gloom curses to your deck.", "energy": 1},
	"everburning_wick": {"name": "Everburning Wick", "rarity": "boss", "icon": "candle", "tint": "f0a040", "desc": "Your Light no longer wanes. Start each combat with 3 Light.", "no_wane": true},
	"runic_hourglass": {"name": "Runic Hourglass", "rarity": "boss", "icon": "hourglass", "tint": "7ab0c8", "desc": "Draw 2 additional cards each turn.", "extra_draw": 2},
	"molten_core": {"name": "Molten Core", "rarity": "boss", "icon": "heart", "tint": "ff6a1a", "desc": "Upon pickup, upgrade 4 random cards. Start each combat with 2 Strength."},
}

static func by_rarity(rarity: String) -> Array:
	var out := []
	for id in RELICS:
		if RELICS[id].rarity == rarity:
			out.append(id)
	return out

## Called once per combat, at the start of the first player turn.
static func on_combat_start(id: String, c) -> void:
	match id:
		"brass_lantern", "coal_pouch": c.gain_light(2)
		"oaken_shield": c.block(10, true)
		"smelling_salts": c.apply(c.player, "draw_next", 2)
		"vial_of_embers": c.apply_all("burn", 3)
		"iron_ring": c.apply(c.player, "strength", 1)
		"feather_charm": c.apply(c.player, "dexterity", 1)
		"lens_of_focus": c.first_attack_double = true
		"thorny_vine": c.apply(c.player, "thorns", 3)
		"bottled_star": c.gain_energy(1)
		"everburning_wick": c.gain_light(3)
		"molten_core": c.apply(c.player, "strength", 2)

static func on_turn_start(id: String, c) -> void:
	match id:
		"ancient_coal": c.gain_light(1)
		"war_drum":
			if c.turn % 3 == 0:
				c.apply(c.player, "strength", 1)

static func on_turn_end(id: String, c) -> void:
	match id:
		"warm_cloak":
			if c.player.block == 0:
				c.block(6, true)

static func on_card_played(id: String, c, card: Dictionary) -> void:
	match id:
		"metronome":
			if card.type == "attack" and c.turn_stats.attacks % 3 == 0:
				c.draw(1)

static func on_enemy_death(id: String, c) -> void:
	match id:
		"ember_heart":
			if not c.over:
				c.gain_energy(1)
				c.draw(1)

## Out-of-combat hooks receive the RunState.
static func on_pickup(id: String, run) -> void:
	match id:
		"wild_berry": run.gain_max_hp(7)
		"potion_belt": run.data.potions.append_array([null, null])
		"cursed_crown":
			run.add_card_to_deck("gloom")
			run.add_card_to_deck("gloom")
		"molten_core": run.upgrade_random(4)

static func on_combat_won(id: String, run) -> void:
	match id:
		"hearthstone": run.heal(5)
