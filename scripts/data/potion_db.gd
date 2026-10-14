class_name PotionDB

const POTIONS := {
	"healing_draught": {"name": "Healing Draught", "rarity": "common", "color": "c83a3a", "desc": "Heal 20 HP.", "outside": true},
	"fire_flask": {"name": "Fire Flask", "rarity": "common", "color": "ff7a1a", "target": "enemy", "desc": "Deal 20 damage to an enemy."},
	"block_tonic": {"name": "Block Tonic", "rarity": "common", "color": "5a8ac8", "desc": "Gain 12 Block."},
	"strength_elixir": {"name": "Strength Elixir", "rarity": "uncommon", "color": "a02a1a", "desc": "Gain 2 Strength."},
	"swift_potion": {"name": "Swift Potion", "rarity": "common", "color": "6ac8a0", "desc": "Draw 3 cards."},
	"energy_potion": {"name": "Energy Potion", "rarity": "common", "color": "f0d050", "desc": "Gain 2 Energy."},
	"liquid_light": {"name": "Liquid Light", "rarity": "common", "color": "fff0a0", "desc": "Gain 5 Light."},
	"fear_potion": {"name": "Fear Potion", "rarity": "common", "color": "7a3aa0", "target": "enemy", "desc": "Apply 3 Vulnerable."},
	"burning_oil": {"name": "Burning Oil", "rarity": "uncommon", "color": "5a3a1a", "desc": "Apply 6 Burn to ALL enemies."},
	"weakening_mist": {"name": "Weakening Mist", "rarity": "common", "color": "8a9aa0", "desc": "Apply 3 Weak to ALL enemies."},
	"smoke_bomb": {"name": "Smoke Bomb", "rarity": "rare", "color": "5a5a5a", "desc": "Escape from a non-boss combat. You receive no rewards."},
	"elixir_of_ages": {"name": "Elixir of Ages", "rarity": "rare", "color": "d9b04a", "desc": "Raise your Max HP by 5 and heal to full.", "outside": true},
}

static func needs_target(id: String) -> bool:
	return POTIONS[id].get("target", "self") == "enemy"

static func can_use(id: String, c) -> bool:
	if id == "smoke_bomb":
		return not c.is_boss
	return true

static func use(id: String, c, t) -> void:
	match id:
		"healing_draught": c.heal(20)
		"fire_flask": c.lose_hp_enemy(t, 20, true)
		"block_tonic": c.block(12, true)
		"strength_elixir": c.apply(c.player, "strength", 2)
		"swift_potion": c.draw(3)
		"energy_potion": c.gain_energy(2)
		"liquid_light": c.gain_light(5)
		"fear_potion": c.apply(t, "vulnerable", 3)
		"burning_oil": c.apply_all("burn", 6)
		"weakening_mist": c.apply_all("weak", 3)
		"smoke_bomb": c.escape()
		"elixir_of_ages":
			c.player.max_hp += 5
			c.heal(c.player.max_hp)

static func use_outside(id: String, run) -> bool:
	match id:
		"healing_draught":
			run.heal(20)
			return true
		"elixir_of_ages":
			run.data.max_hp += 5
			run.data.hp = run.data.max_hp
			return true
	return false
