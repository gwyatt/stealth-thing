class_name StatusDB
## Status effects. `decays` statuses lose one stack at the end of their owner's turn.

const STATUSES := {
	"strength": {"name": "Strength", "icon": "fist", "kind": "buff", "desc": "Attacks deal {n} additional damage."},
	"dexterity": {"name": "Dexterity", "icon": "feather", "kind": "buff", "desc": "Block gained from cards increased by {n}."},
	"weak": {"name": "Weak", "icon": "broken_sword", "kind": "debuff", "decays": true, "desc": "Attacks deal 25% less damage. Lasts {n} turn(s)."},
	"vulnerable": {"name": "Vulnerable", "icon": "cracked_shield", "kind": "debuff", "decays": true, "desc": "Takes 50% more attack damage. Lasts {n} turn(s)."},
	"frail": {"name": "Frail", "icon": "bone", "kind": "debuff", "decays": true, "desc": "Block gained from cards reduced by 25%. Lasts {n} turn(s)."},
	"burn": {"name": "Burn", "icon": "flame", "kind": "debuff", "desc": "At the start of its turn, loses {n} HP, then Burn is reduced by 1."},
	"thorns": {"name": "Thorns", "icon": "thorns", "kind": "buff", "desc": "When attacked, deals {n} damage back."},
	"ritual": {"name": "Ritual", "icon": "candle", "kind": "buff", "desc": "At the end of its turn, gains {n} Strength."},
	"plated_armor": {"name": "Plated Armor", "icon": "helm", "kind": "buff", "desc": "At the end of its turn, gains {n} Block. Unblocked attack damage reduces this by 1."},
	"regen": {"name": "Regeneration", "icon": "leaf", "kind": "buff", "desc": "At the end of its turn, heals {n} HP."},
	"enrage": {"name": "Enrage", "icon": "skull_horned", "kind": "buff", "desc": "Whenever you play a Skill, gains {n} Strength."},
	"rebirth": {"name": "Rebirth", "icon": "wing", "kind": "buff", "desc": "The first time this dies, it rises again at half HP."},
	"kindling_pyre": {"name": "Kindling Pyre", "icon": "pyre", "kind": "buff", "desc": "At the start of your turn, gain {n} Light."},
	"ashen_armor": {"name": "Ashen Armor", "icon": "breastplate", "kind": "buff", "desc": "Whenever you gain Light, gain {n} Block."},
	"ember_ward": {"name": "Ember Ward", "icon": "shield", "kind": "buff", "desc": "At the end of your turn, gain {n} Block."},
	"eternal_flame": {"name": "Eternal Flame", "icon": "sun", "kind": "buff", "desc": "Light no longer wanes. At the end of your turn, gain {n} Light."},
	"pyroclasm": {"name": "Pyroclasm", "icon": "flame", "kind": "buff", "desc": "Whenever you apply Burn, apply {n} more."},
	"phoenix": {"name": "Phoenix Feather", "icon": "wing", "kind": "buff", "desc": "The first time you would die this combat, heal to {n}% of your Max HP instead."},
	"draw_next": {"name": "Foresight", "icon": "eye", "kind": "buff", "desc": "Draw {n} additional card(s) next turn."},
	"energy_next": {"name": "Second Wind", "icon": "bolt", "kind": "buff", "desc": "Gain {n} additional Energy next turn."},
	"stoked_blade": {"name": "Stoked Blade", "icon": "sword", "kind": "buff", "desc": "Whenever you play an Attack, gain {n} Light."},
}

static func info(key: String) -> Dictionary:
	return STATUSES.get(key, {"name": key, "icon": "rune", "kind": "buff", "desc": ""})

static func describe(key: String, n: int) -> String:
	return String(info(key).desc).replace("{n}", str(n))

static func decays(key: String) -> bool:
	return STATUSES.has(key) and STATUSES[key].get("decays", false)
