class_name CardDB
## Card definitions and card effects.
##
## `v` holds a card's numbers: d = damage, b = block, m = magic number, h = hits.
## `up` overrides fields (including entries of `v`) when the card is upgraded.
## `text` is templated: {d} and {b} show combat-modified values, other tokens show raw.
## Effects live in `play()`, which drives the Combat API.

const STARTER_DECK := ["strike", "strike", "strike", "strike", "strike", "guard", "guard", "guard", "guard", "kindle"]

const CARDS := {
	# ── Starter ──
	"strike": {"name": "Strike", "type": "attack", "rarity": "starter", "cost": 1, "target": "enemy", "v": {"d": 6}, "up": {"v": {"d": 9}}, "text": "Deal {d} damage.", "art": "sword"},
	"guard": {"name": "Guard", "type": "skill", "rarity": "starter", "cost": 1, "target": "self", "v": {"b": 5}, "up": {"v": {"b": 8}}, "text": "Gain {b} Block.", "art": "shield"},
	"kindle": {"name": "Kindle", "type": "attack", "rarity": "starter", "cost": 1, "target": "enemy", "v": {"d": 5, "m": 2}, "up": {"v": {"d": 7, "m": 3}}, "text": "Deal {d} damage. Gain {m} Light.", "art": "candle"},

	# ── Common ──
	"ember_slash": {"name": "Ember Slash", "type": "attack", "rarity": "common", "cost": 1, "target": "enemy", "v": {"d": 7, "m": 2}, "up": {"v": {"d": 9, "m": 3}}, "text": "Deal {d} damage. Apply {m} Burn.", "art": "slash"},
	"twin_cut": {"name": "Twin Cut", "type": "attack", "rarity": "common", "cost": 1, "target": "enemy", "v": {"d": 5}, "up": {"v": {"d": 7}}, "text": "Deal {d} damage twice.", "art": "swords"},
	"lantern_bash": {"name": "Lantern Bash", "type": "attack", "rarity": "common", "cost": 2, "target": "enemy", "v": {"d": 12, "m": 2}, "up": {"v": {"d": 15, "m": 3}}, "text": "Deal {d} damage. Apply {m} Vulnerable.", "art": "mace"},
	"cinder_sweep": {"name": "Cinder Sweep", "type": "attack", "rarity": "common", "cost": 1, "target": "all", "v": {"d": 7}, "up": {"v": {"d": 10}}, "text": "Deal {d} damage to ALL enemies.", "art": "slash"},
	"quick_jab": {"name": "Quick Jab", "type": "attack", "rarity": "common", "cost": 0, "target": "enemy", "v": {"d": 3, "m": 1}, "up": {"v": {"d": 5}}, "text": "Deal {d} damage. Draw {m} card.", "art": "fist"},
	"searing_strike": {"name": "Searing Strike", "type": "attack", "rarity": "common", "cost": 1, "target": "enemy", "v": {"d": 6, "m": 3}, "up": {"v": {"d": 8}}, "text": "Deal {d} damage. If you have {m}+ Light, deal {d} damage again.", "art": "sword"},
	"hooked_chain": {"name": "Hooked Chain", "type": "attack", "rarity": "common", "cost": 1, "target": "enemy", "v": {"d": 8, "m": 1}, "up": {"v": {"d": 10, "m": 2}}, "text": "Deal {d} damage. Apply {m} Weak.", "art": "chain"},
	"spark_dart": {"name": "Spark Dart", "type": "attack", "rarity": "common", "cost": 0, "light_cost": 1, "target": "enemy", "v": {"d": 9}, "up": {"v": {"d": 12}}, "text": "Deal {d} damage.", "art": "dart"},
	"flicker_strike": {"name": "Flicker Strike", "type": "attack", "rarity": "common", "cost": 1, "target": "enemy", "v": {"d": 9}, "up": {"v": {"d": 12}}, "text": "Deal {d} damage. If this kills an enemy, gain 1 Energy.", "art": "bolt"},
	"brace": {"name": "Brace", "type": "skill", "rarity": "common", "cost": 1, "target": "self", "v": {"b": 7, "m": 1}, "up": {"v": {"b": 10}}, "text": "Gain {b} Block. Gain {m} Light.", "art": "shield"},
	"ash_veil": {"name": "Ash Veil", "type": "skill", "rarity": "common", "cost": 1, "target": "self", "v": {"b": 6, "m": 1}, "up": {"v": {"b": 9}}, "text": "Gain {b} Block. Draw {m} card.", "art": "smoke"},
	"stoke": {"name": "Stoke", "type": "skill", "rarity": "common", "cost": 0, "target": "self", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Gain {m} Light.", "art": "pyre"},
	"smoke_screen": {"name": "Smoke Screen", "type": "skill", "rarity": "common", "cost": 1, "target": "self", "v": {"b": 6, "m": 1}, "up": {"v": {"b": 8, "m": 2}}, "text": "Gain {b} Block. Apply {m} Weak to ALL enemies.", "art": "smoke"},
	"gather_embers": {"name": "Gather Embers", "type": "skill", "rarity": "common", "cost": 1, "target": "self", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Draw {m} cards. Gain 1 Light.", "art": "hand"},
	"sidestep": {"name": "Sidestep", "type": "skill", "rarity": "common", "cost": 0, "target": "self", "v": {"b": 3}, "up": {"v": {"b": 5}}, "text": "Gain {b} Block. Next turn, draw 1 additional card.", "art": "boot"},
	"tinder": {"name": "Tinder", "type": "skill", "rarity": "common", "cost": 1, "target": "enemy", "v": {"m": 5}, "up": {"v": {"m": 7}}, "text": "Apply {m} Burn.", "art": "flame"},

	# ── Uncommon ──
	"flare": {"name": "Flare", "type": "attack", "rarity": "uncommon", "cost": 1, "target": "all", "v": {"m": 4}, "up": {"v": {"m": 5}}, "text": "Spend all Light. Deal {m} damage to ALL enemies for each Light spent.", "art": "sun"},
	"immolate": {"name": "Immolate", "type": "skill", "rarity": "uncommon", "cost": 2, "target": "enemy", "v": {"m": 12}, "up": {"v": {"m": 16}}, "text": "Apply {m} Burn.", "art": "flame"},
	"kindling_pyre": {"name": "Kindling Pyre", "type": "power", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "At the start of your turn, gain {m} Light.", "art": "pyre"},
	"bulwark": {"name": "Bulwark", "type": "skill", "rarity": "uncommon", "cost": 2, "target": "self", "v": {"b": 14, "m": 2}, "up": {"v": {"b": 18}}, "text": "Gain {b} Block. Gain {m} Light.", "art": "tower"},
	"ashen_armor": {"name": "Ashen Armor", "type": "power", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Whenever you gain Light, gain {m} Block.", "art": "breastplate"},
	"wildfire": {"name": "Wildfire", "type": "skill", "rarity": "uncommon", "cost": 1, "target": "enemy", "up": {"cost": 0}, "text": "Double the target's Burn.", "art": "flame"},
	"cinder_storm": {"name": "Cinder Storm", "type": "attack", "rarity": "uncommon", "cost": 2, "target": "all", "v": {"d": 4, "h": 4, "m": 1}, "up": {"v": {"h": 5}}, "text": "Deal {d} damage to a random enemy {h} times. Each hit applies {m} Burn.", "art": "star"},
	"lantern_ward": {"name": "Lantern Ward", "type": "skill", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"b": 3, "m": 2}, "up": {"v": {"m": 3}}, "text": "Gain {b} Block, plus {m} for each Light you have.", "art": "lantern"},
	"burning_blood": {"name": "Burning Blood", "type": "skill", "rarity": "uncommon", "cost": 0, "target": "self", "v": {"m": 3}, "up": {"text": "Lose {m} HP. Gain 2 Energy. Draw 1 card."}, "text": "Lose {m} HP. Gain 2 Energy.", "art": "blood"},
	"inferno_fist": {"name": "Inferno Fist", "type": "attack", "rarity": "uncommon", "cost": 2, "target": "enemy", "v": {"d": 12, "m": 3}, "up": {"v": {"d": 14, "m": 4}}, "text": "Deal {d} damage, plus {m} for each Light you have.", "art": "fist"},
	"molten_edge": {"name": "Molten Edge", "type": "power", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Gain {m} Strength.", "art": "sword"},
	"ember_ward": {"name": "Ember Ward", "type": "power", "rarity": "uncommon", "cost": 2, "target": "self", "v": {"m": 4}, "up": {"v": {"m": 6}}, "text": "At the end of your turn, gain {m} Block.", "art": "shield"},
	"backdraft": {"name": "Backdraft", "type": "attack", "rarity": "uncommon", "cost": 1, "target": "enemy", "up": {"cost": 0}, "text": "Deal damage equal to your Block.", "art": "shield"},
	"smother": {"name": "Smother", "type": "skill", "rarity": "uncommon", "cost": 1, "target": "enemy", "exhaust": true, "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Apply {m} Weak and {m} Vulnerable. Exhaust.", "art": "smoke"},
	"pilgrims_step": {"name": "Pilgrim's Step", "type": "skill", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"b": 8, "m": 2}, "up": {"v": {"b": 11}}, "text": "Gain {b} Block. Next turn, draw {m} additional cards.", "art": "boot"},
	"stoked_blade": {"name": "Stoked Blade", "type": "power", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"m": 1}, "up": {"cost": 0}, "text": "Whenever you play an Attack, gain {m} Light.", "art": "sword"},
	"heat_shimmer": {"name": "Heat Shimmer", "type": "skill", "rarity": "uncommon", "cost": 1, "target": "self", "v": {"b": 6, "m": 5}, "up": {"v": {"b": 9}}, "text": "Gain {b} Block. If you have {m}+ Light, gain 1 Energy.", "art": "eye"},
	"reckless_flame": {"name": "Reckless Flame", "type": "attack", "rarity": "uncommon", "cost": 1, "target": "enemy", "v": {"d": 15}, "up": {"v": {"d": 20}}, "text": "Deal {d} damage. Shuffle a Scorch into your draw pile.", "art": "flame"},

	# ── Rare ──
	"supernova": {"name": "Supernova", "type": "attack", "rarity": "rare", "cost": 3, "target": "enemy", "exhaust": true, "v": {"d": 10, "m": 6}, "up": {"v": {"m": 8}}, "text": "Spend all Light. Deal {d} damage, plus {m} for each Light spent. Exhaust.", "art": "star"},
	"eternal_flame": {"name": "Eternal Flame", "type": "power", "rarity": "rare", "cost": 3, "target": "self", "v": {"m": 1}, "up": {"cost": 2}, "text": "Your Light no longer wanes. At the end of your turn, gain {m} Light.", "art": "candle"},
	"phoenix_feather": {"name": "Phoenix Feather", "type": "power", "rarity": "rare", "cost": 2, "target": "self", "v": {"m": 30}, "up": {"v": {"m": 50}}, "text": "The first time you would die this combat, heal to {m}% of your Max HP instead.", "art": "feather"},
	"pyroclasm": {"name": "Pyroclasm", "type": "power", "rarity": "rare", "cost": 2, "target": "self", "v": {"m": 2}, "up": {"cost": 1}, "text": "Whenever you apply Burn, apply {m} more.", "art": "flame"},
	"conflagration": {"name": "Conflagration", "type": "attack", "rarity": "rare", "cost": 2, "target": "all", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Each enemy loses HP equal to {m}× its Burn.", "art": "pyre"},
	"overcharge": {"name": "Overcharge", "type": "skill", "rarity": "rare", "cost": 0, "target": "self", "exhaust": true, "v": {"m": 3}, "up": {"exhaust": false, "text": "Gain {m} Light and 1 Energy."}, "text": "Gain {m} Light and 1 Energy. Exhaust.", "art": "bolt"},
	"blazing_barrier": {"name": "Blazing Barrier", "type": "power", "rarity": "rare", "cost": 2, "target": "self", "v": {"m": 3}, "up": {"v": {"m": 5}}, "text": "Gain {m} Thorns.", "art": "thorns"},
	"ignition": {"name": "Ignition", "type": "skill", "rarity": "rare", "cost": 1, "target": "self", "exhaust": true, "up": {"cost": 0}, "text": "Fill your Light to its maximum. Exhaust.", "art": "lantern"},
	"twin_suns": {"name": "Twin Suns", "type": "attack", "rarity": "rare", "cost": 2, "target": "enemy", "v": {"d": 8, "m": 5}, "up": {"v": {"d": 10}}, "text": "Deal {d} damage twice. If you have {m}+ Light, four times instead.", "art": "sun"},
	"ashborn": {"name": "Ashborn", "type": "power", "rarity": "rare", "cost": 2, "target": "self", "v": {"m": 2}, "up": {"v": {"m": 3}}, "text": "Gain {m} Strength and {m} Dexterity.", "art": "wing"},

	# ── Status & Curse ──
	"scorch": {"name": "Scorch", "type": "status", "rarity": "special", "cost": -1, "target": "none", "unplayable": true, "v": {"m": 2}, "text": "Unplayable. At the end of your turn, if this is in your hand, take {m} damage.", "art": "flame"},
	"wound": {"name": "Wound", "type": "status", "rarity": "special", "cost": -1, "target": "none", "unplayable": true, "text": "Unplayable.", "art": "blood"},
	"slimed": {"name": "Slimed", "type": "status", "rarity": "special", "cost": 1, "target": "self", "exhaust": true, "text": "Exhaust.", "art": "blood"},
	"dazed": {"name": "Dazed", "type": "status", "rarity": "special", "cost": -1, "target": "none", "unplayable": true, "ethereal": true, "text": "Unplayable. Ethereal.", "art": "spiral"},
	"gloom": {"name": "Gloom", "type": "curse", "rarity": "curse", "cost": -1, "target": "none", "unplayable": true, "text": "Unplayable.", "art": "skull"},
	"ache": {"name": "Ache", "type": "curse", "rarity": "curse", "cost": -1, "target": "none", "unplayable": true, "v": {"m": 1}, "text": "Unplayable. At the end of your turn, if this is in your hand, lose {m} HP.", "art": "bone"},
}

const KEYWORDS := {
	"Light": "A resource that persists between turns (max 10). At the end of your turn, 1 Light wanes.",
	"Burn": "At the start of its turn, the creature loses HP equal to its Burn, then Burn is reduced by 1. Ignores Block.",
	"Block": "Prevents damage until the start of your next turn.",
	"Weak": "Weakened creatures deal 25% less attack damage.",
	"Vulnerable": "Vulnerable creatures take 50% more attack damage.",
	"Frail": "Frail creatures gain 25% less Block from cards.",
	"Exhaust": "Removed until the end of combat.",
	"Ethereal": "If this is in your hand at the end of your turn, it is Exhausted.",
	"Unplayable": "This card cannot be played.",
	"Strength": "Increases attack damage by 1 per stack.",
	"Dexterity": "Increases Block gained from cards by 1 per stack.",
	"Thorns": "When attacked, deals damage back to the attacker.",
	"Energy": "Spent to play cards. Refills at the start of your turn.",
	"Scorch": "A status card: deals 2 damage to you if it is in your hand at the end of your turn.",
}

## Resolve a card instance {uid, id, up} into its effective stats.
static func stats(inst: Dictionary) -> Dictionary:
	var def: Dictionary = CARDS[inst.id]
	var s := def.duplicate(true)
	s["id"] = inst.id
	s["v"] = (def.get("v", {}) as Dictionary).duplicate()
	s["upgraded"] = false
	for k in ["exhaust", "ethereal", "unplayable"]:
		if not s.has(k):
			s[k] = false
	if not s.has("light_cost"):
		s["light_cost"] = 0
	if inst.get("up", false) and def.has("up"):
		var up: Dictionary = def.up
		for k in up:
			if k == "v":
				for vk in up.v:
					s.v[vk] = up.v[vk]
			else:
				s[k] = up[k]
		s["name"] = def.name + "+"
		s["upgraded"] = true
	return s

static func can_upgrade(inst: Dictionary) -> bool:
	return CARDS[inst.id].has("up") and not inst.get("up", false)

static func pool(rarity: String) -> Array:
	var out := []
	for id in CARDS:
		if CARDS[id].rarity == rarity:
			out.append(id)
	return out

static func reward_pool() -> Array:
	return pool("common") + pool("uncommon") + pool("rare")

## Card effects. `c` is the Combat, `v` the card's numbers, `t` the target enemy (or null).
static func play(id: String, c, v: Dictionary, t, up: bool) -> void:
	match id:
		"strike": c.attack(t, v.d)
		"guard": c.block(v.b)
		"kindle":
			c.attack(t, v.d); c.gain_light(v.m)
		"ember_slash":
			c.attack(t, v.d); c.apply(t, "burn", v.m)
		"twin_cut":
			c.attack(t, v.d); c.attack(t, v.d)
		"lantern_bash":
			c.attack(t, v.d); c.apply(t, "vulnerable", v.m)
		"cinder_sweep": c.attack_all(v.d)
		"quick_jab":
			c.attack(t, v.d); c.draw(v.m)
		"searing_strike":
			c.attack(t, v.d)
			if c.player.light >= v.m:
				c.attack(t, v.d)
		"hooked_chain":
			c.attack(t, v.d); c.apply(t, "weak", v.m)
		"spark_dart": c.attack(t, v.d)
		"flicker_strike":
			c.attack(t, v.d)
			if t.hp <= 0:
				c.gain_energy(1)
		"brace", "bulwark":
			c.block(v.b); c.gain_light(v.m)
		"ash_veil":
			c.block(v.b); c.draw(v.m)
		"stoke": c.gain_light(v.m)
		"smoke_screen":
			c.block(v.b); c.apply_all("weak", v.m)
		"gather_embers":
			c.draw(v.m); c.gain_light(1)
		"sidestep":
			c.block(v.b); c.apply(c.player, "draw_next", 1)
		"tinder", "immolate": c.apply(t, "burn", v.m)
		"flare":
			var n: int = c.spend_all_light()
			if n > 0:
				c.attack_all(v.m * n)
		"kindling_pyre": c.apply(c.player, "kindling_pyre", v.m)
		"ashen_armor": c.apply(c.player, "ashen_armor", v.m)
		"wildfire":
			var b: int = t.statuses.get("burn", 0)
			if b > 0:
				c.apply(t, "burn", b, true)
		"cinder_storm":
			for i in v.h:
				var r = c.random_enemy()
				if r == null:
					break
				c.attack(r, v.d)
				if r.hp > 0:
					c.apply(r, "burn", v.m)
		"lantern_ward": c.block(v.b + v.m * c.player.light)
		"burning_blood":
			c.lose_hp(v.m); c.gain_energy(2)
			if up:
				c.draw(1)
		"inferno_fist": c.attack(t, v.d + v.m * c.player.light)
		"molten_edge": c.apply(c.player, "strength", v.m)
		"ember_ward": c.apply(c.player, "ember_ward", v.m)
		"backdraft": c.attack(t, c.player.block)
		"smother":
			c.apply(t, "weak", v.m); c.apply(t, "vulnerable", v.m)
		"pilgrims_step":
			c.block(v.b); c.apply(c.player, "draw_next", v.m)
		"stoked_blade": c.apply(c.player, "stoked_blade", v.m)
		"heat_shimmer":
			c.block(v.b)
			if c.player.light >= v.m:
				c.gain_energy(1)
		"reckless_flame":
			c.attack(t, v.d); c.add_cards("scorch", "draw", 1)
		"supernova":
			var n: int = c.spend_all_light()
			c.attack(t, v.d + v.m * n)
		"eternal_flame": c.apply(c.player, "eternal_flame", v.m)
		"phoenix_feather":
			if not c.player.statuses.has("phoenix"):
				c.apply(c.player, "phoenix", v.m)
		"pyroclasm": c.apply(c.player, "pyroclasm", v.m)
		"conflagration":
			for e in c.alive():
				var b: int = e.statuses.get("burn", 0)
				if b > 0:
					c.lose_hp_enemy(e, b * v.m)
		"overcharge":
			c.gain_light(v.m); c.gain_energy(1)
		"blazing_barrier": c.apply(c.player, "thorns", v.m)
		"ignition": c.gain_light(maxi(0, c.player.max_light - c.player.light))
		"twin_suns":
			var hits := 4 if c.player.light >= v.m else 2
			for i in hits:
				c.attack(t, v.d)
		"ashborn":
			c.apply(c.player, "strength", v.m); c.apply(c.player, "dexterity", v.m)
		"slimed": pass
		_: push_warning("Card %s has no effect" % id)

## Effects of status/curse cards left in hand at end of turn.
static func end_of_turn_in_hand(id: String, c, v: Dictionary) -> void:
	match id:
		"scorch": c.damage_player(v.m)
		"ache": c.lose_hp(v.m)
