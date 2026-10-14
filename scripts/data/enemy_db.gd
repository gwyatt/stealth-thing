class_name EnemyDB
## Enemy definitions and encounter tables.
##
## A move is declarative:
##   dmg / hits  – attack the player
##   block       – gain Block
##   self        – statuses applied to itself, e.g. {"strength": 2}
##   allies      – {"block": n, "strength": n} given to every living enemy
##   player      – statuses applied to the player
##   cards       – status cards added to the player's piles: [[id, n, pile], ...]
##   summon      – enemy ids to summon
##   heal        – HP restored to itself
## `ai()` picks the next move key. e.history holds previously chosen keys.

const ENEMIES := {
	# ═══════════ Act 1 — The Sunken Crypt ═══════════
	"crypt_rat": {"name": "Crypt Rat", "hp": [10, 13], "size": 0.7, "moves": {
		"bite": {"name": "Bite", "dmg": 5},
		"gnaw": {"name": "Gnaw", "dmg": 3, "player": {"weak": 1}}}},
	"drowned_thrall": {"name": "Drowned Thrall", "hp": [19, 23], "size": 0.95, "moves": {
		"claw": {"name": "Claw", "dmg": 6},
		"moan": {"name": "Mournful Moan", "self": {"strength": 2}}}},
	"bone_archer": {"name": "Bone Archer", "hp": [16, 19], "size": 0.95, "moves": {
		"aim": {"name": "Take Aim", "block": 6, "self": {"strength": 1}},
		"volley": {"name": "Volley", "dmg": 3, "hits": 2}}},
	"lantern_moth": {"name": "Lantern Moth", "hp": [14, 17], "size": 0.85, "moves": {
		"dust": {"name": "Glimmer Dust", "dmg": 3, "player": {"weak": 1}},
		"bump": {"name": "Bump", "dmg": 6}}},
	"grave_slime": {"name": "Grave Slime", "hp": [26, 30], "size": 0.85, "moves": {
		"tackle": {"name": "Tackle", "dmg": 9},
		"ooze": {"name": "Ooze", "dmg": 4, "cards": [["slimed", 2, "discard"]]}}},
	"ghoul": {"name": "Ghoul", "hp": [36, 40], "size": 1.0, "moves": {
		"rend": {"name": "Rend", "dmg": 11},
		"howl": {"name": "Howl", "block": 6, "self": {"strength": 3}}}},
	"gravewarden": {"name": "The Gravewarden", "hp": [70, 74], "elite": true, "size": 1.2, "moves": {
		"bellow": {"name": "Bellow", "self": {"enrage": 2}},
		"cleave": {"name": "Cleave", "dmg": 14},
		"skullbash": {"name": "Skull Bash", "dmg": 7, "player": {"vulnerable": 2}}}},
	"ember_wisp": {"name": "Ember Wisp", "hp": [28, 31], "elite": true, "size": 0.9, "moves": {
		"sear": {"name": "Sear", "dmg": 5, "player": {"burn": 2}},
		"flare": {"name": "Flare", "dmg": 9},
		"shimmer": {"name": "Shimmer", "block": 8}}},
	"bog_hag": {"name": "Bog Hag", "hp": [64, 68], "elite": true, "size": 1.1, "moves": {
		"hex": {"name": "Hex", "player": {"weak": 2, "frail": 2}},
		"bolt": {"name": "Bog Bolt", "dmg": 13},
		"brew": {"name": "Bubbling Brew", "block": 12, "self": {"strength": 2}}}},
	"drowned_king": {"name": "The Drowned King", "hp": [140, 140], "boss": true, "size": 1.45, "moves": {
		"undertow": {"name": "Undertow", "dmg": 6, "player": {"weak": 1}, "cards": [["wound", 2, "discard"]]},
		"crush": {"name": "Crushing Depths", "dmg": 16},
		"tidal": {"name": "Tidal Crash", "dmg": 4, "hits": 3},
		"rise": {"name": "Rising Tide", "block": 12, "self": {"strength": 2}}}},

	# ═══════════ Act 2 — The Fungal Warrens ═══════════
	"sporeling": {"name": "Sporeling", "hp": [16, 20], "size": 0.7, "moves": {
		"spore": {"name": "Spore Puff", "dmg": 3, "player": {"vulnerable": 1}},
		"lash": {"name": "Lash", "dmg": 7}}},
	"myconid_brute": {"name": "Myconid Brute", "hp": [52, 56], "size": 1.15, "moves": {
		"slam": {"name": "Slam", "dmg": 14},
		"fortify": {"name": "Fortify", "block": 12, "self": {"strength": 2}}}},
	"fungal_shaman": {"name": "Fungal Shaman", "hp": [34, 38], "size": 1.0, "moves": {
		"mend": {"name": "Mycelial Rite", "allies": {"strength": 1, "block": 6}},
		"spit": {"name": "Acid Spit", "dmg": 7, "player": {"weak": 1}}}},
	"cave_stalker": {"name": "Cave Stalker", "hp": [38, 42], "size": 0.95, "moves": {
		"ambush": {"name": "Ambush", "dmg": 11},
		"rake": {"name": "Rake", "dmg": 5, "hits": 2},
		"skulk": {"name": "Skulk", "block": 10, "self": {"strength": 1}}}},
	"blight_beetle": {"name": "Blight Beetle", "hp": [44, 48], "size": 0.95, "init": {"thorns": 2}, "moves": {
		"charge": {"name": "Charge", "dmg": 11},
		"harden": {"name": "Harden", "block": 14}}},
	"spore_mother": {"name": "Spore Mother", "hp": [100, 104], "elite": true, "size": 1.25, "moves": {
		"burst": {"name": "Burst Spores", "summon": ["sporeling", "sporeling"]},
		"lash": {"name": "Root Lash", "dmg": 14},
		"rot": {"name": "Rot", "dmg": 5, "player": {"weak": 2}}}},
	"rootbound_knight": {"name": "Rootbound Knight", "hp": [100, 104], "elite": true, "size": 1.2, "init": {"plated_armor": 8}, "moves": {
		"strike": {"name": "Thornblade", "dmg": 17},
		"bash": {"name": "Shield Bash", "dmg": 10, "player": {"frail": 2}},
		"entrench": {"name": "Entrench", "block": 10, "self": {"strength": 3}}}},
	"carrion_lord": {"name": "Carrion Lord", "hp": [115, 120], "elite": true, "size": 1.25, "moves": {
		"screech": {"name": "Screech", "player": {"weak": 2, "vulnerable": 1}},
		"devour": {"name": "Devour", "dmg": 18, "heal": 10},
		"peck": {"name": "Peck Frenzy", "dmg": 3, "hits": 5}}},
	"rot_colossus": {"name": "The Rot Colossus", "hp": [190, 190], "boss": true, "size": 1.5, "moves": {
		"storm": {"name": "Spore Storm", "player": {"weak": 2, "frail": 2}, "cards": [["slimed", 3, "discard"]]},
		"thrash": {"name": "Thrash", "dmg": 6, "hits": 3},
		"grow": {"name": "Overgrowth", "block": 20, "self": {"strength": 2}},
		"crush": {"name": "Colossal Crush", "dmg": 24}}},

	# ═══════════ Act 3 — The Ember Throne ═══════════
	"ash_wraith": {"name": "Ash Wraith", "hp": [46, 50], "size": 1.0, "moves": {
		"wail": {"name": "Wail", "player": {"weak": 2, "frail": 2}},
		"drain": {"name": "Life Drain", "dmg": 12, "heal": 6}}},
	"cinder_golem": {"name": "Cinder Golem", "hp": [72, 78], "size": 1.15, "moves": {
		"smash": {"name": "Smash", "dmg": 18},
		"heat": {"name": "Heat Up", "block": 10, "self": {"strength": 3}},
		"spew": {"name": "Spew Cinders", "dmg": 8, "cards": [["scorch", 2, "discard"]]}}},
	"flame_cultist": {"name": "Flame Cultist", "hp": [50, 55], "size": 1.0, "moves": {
		"incant": {"name": "Incantation", "self": {"ritual": 3}},
		"strike": {"name": "Dark Strike", "dmg": 7}}},
	"obsidian_sentry": {"name": "Obsidian Sentry", "hp": [58, 62], "size": 1.05, "init": {"plated_armor": 6}, "moves": {
		"beam": {"name": "Searing Beam", "dmg": 10, "cards": [["dazed", 2, "discard"]]},
		"shield": {"name": "Bulwark Pulse", "allies": {"block": 12}}}},
	"ember_imp": {"name": "Ember Imp", "hp": [22, 26], "size": 0.75, "moves": {
		"jab": {"name": "Pitchfork Jab", "dmg": 4, "hits": 2},
		"ignite": {"name": "Ignite", "player": {"burn": 3}}}},
	"phoenix_knight": {"name": "Phoenix Knight", "hp": [108, 114], "elite": true, "size": 1.25, "init": {"rebirth": 1}, "moves": {
		"wings": {"name": "Wing Slash", "dmg": 8, "hits": 2},
		"immolate": {"name": "Immolation", "dmg": 20, "player": {"burn": 3}},
		"preen": {"name": "Preen", "block": 15, "self": {"strength": 2}}}},
	"magma_behemoth": {"name": "Magma Behemoth", "hp": [158, 164], "elite": true, "size": 1.3, "moves": {
		"smolder": {"name": "Smolder", "block": 20, "self": {"strength": 2}},
		"slam": {"name": "Magma Slam", "dmg": 14, "cards": [["scorch", 2, "draw"]]},
		"erupt": {"name": "Eruption", "dmg": 28}}},
	"ember_tyrant": {"name": "The Ember Tyrant", "hp": [260, 260], "boss": true, "size": 1.55, "moves": {
		"brand": {"name": "Brand", "dmg": 14, "cards": [["scorch", 2, "draw"]]},
		"hellfire": {"name": "Hellfire", "dmg": 5, "hits": 4},
		"decree": {"name": "Tyrant's Decree", "block": 20, "self": {"strength": 3}},
		"inferno": {"name": "Inferno", "dmg": 30},
		"ascend": {"name": "Ascension", "heal": 30, "self": {"ritual": 1}, "player": {"weak": 2}}}},
}

const ENCOUNTERS := {
	1: {
		"weak": [["crypt_rat", "crypt_rat"], ["drowned_thrall"], ["lantern_moth", "crypt_rat"], ["bone_archer", "crypt_rat"]],
		"strong": [["ghoul"], ["grave_slime", "crypt_rat"], ["drowned_thrall", "bone_archer"], ["crypt_rat", "crypt_rat", "crypt_rat"],
			["lantern_moth", "lantern_moth", "crypt_rat"], ["grave_slime", "lantern_moth"], ["drowned_thrall", "drowned_thrall"]],
		"elite": [["gravewarden"], ["ember_wisp", "ember_wisp"], ["bog_hag"]],
		"boss": [["drowned_king"]],
	},
	2: {
		"weak": [["sporeling", "sporeling"], ["cave_stalker"], ["blight_beetle"]],
		"strong": [["myconid_brute"], ["fungal_shaman", "sporeling", "sporeling"], ["cave_stalker", "sporeling"], ["blight_beetle", "sporeling"],
			["myconid_brute", "fungal_shaman"], ["cave_stalker", "cave_stalker"]],
		"elite": [["spore_mother"], ["rootbound_knight"], ["carrion_lord"]],
		"boss": [["rot_colossus"]],
	},
	3: {
		"weak": [["ember_imp", "ember_imp"], ["ash_wraith"], ["flame_cultist"]],
		"strong": [["cinder_golem"], ["ash_wraith", "ember_imp"], ["flame_cultist", "ember_imp"], ["obsidian_sentry", "ember_imp", "ember_imp"],
			["ember_imp", "ember_imp", "ember_imp"], ["flame_cultist", "obsidian_sentry"], ["ash_wraith", "ash_wraith"]],
		"elite": [["phoenix_knight"], ["magma_behemoth"], ["flame_cultist", "flame_cultist"]],
		"boss": [["ember_tyrant"]],
	},
}

const ACT_NAMES := {1: "The Sunken Crypt", 2: "The Fungal Warrens", 3: "The Ember Throne"}
const BOSS_OF_ACT := {1: "drowned_king", 2: "rot_colossus", 3: "ember_tyrant"}

static func _last(e: Dictionary, n: int) -> Array:
	var h: Array = e.history
	return h.slice(maxi(0, h.size() - n))

static func _last_is(e: Dictionary, k: String) -> bool:
	return not e.history.is_empty() and e.history[-1] == k

static func _cycle(e: Dictionary, keys: Array) -> String:
	return keys[e.history.size() % keys.size()]

## Weighted pick that avoids using a move more than `max_repeat` times in a row.
static func _weighted(e: Dictionary, c, entries: Array, max_repeat: int = 2) -> String:
	var recent := _last(e, max_repeat)
	var allowed := []
	for en in entries:
		var blocked := recent.size() == max_repeat
		for m in recent:
			if m != en[0]:
				blocked = false
		if not blocked:
			allowed.append(en)
	return c.rng.weighted(allowed if not allowed.is_empty() else entries)

static func ai(e: Dictionary, c) -> String:
	var turn: int = e.history.size()
	match e.id:
		"crypt_rat": return _weighted(e, c, [["bite", 60], ["gnaw", 40]])
		"drowned_thrall": return "moan" if turn % 3 == 2 else "claw"
		"bone_archer": return _cycle(e, ["aim", "volley", "volley"])
		"lantern_moth": return _weighted(e, c, [["dust", 45], ["bump", 55]], 1)
		"grave_slime": return _weighted(e, c, [["tackle", 55], ["ooze", 45]], 1)
		"ghoul":
			if turn == 0:
				return "rend"
			return _weighted(e, c, [["rend", 70], ["howl", 30]], 1 if _last_is(e, "howl") else 2)
		"gravewarden":
			if turn == 0:
				return "bellow"
			if _last(e, 2) == ["cleave", "cleave"]:
				return "skullbash"
			return c.rng.weighted([["cleave", 60], ["skullbash", 40]])
		"ember_wisp": return _weighted(e, c, [["sear", 40], ["flare", 40], ["shimmer", 20]], 1)
		"bog_hag": return _cycle(e, ["hex", "bolt", "brew", "bolt"])
		"drowned_king": return _cycle(e, ["undertow", "crush", "tidal", "rise"])
		"sporeling": return _weighted(e, c, [["spore", 40], ["lash", 60]], 1)
		"myconid_brute":
			if turn == 0:
				return "fortify"
			return _weighted(e, c, [["slam", 65], ["fortify", 35]], 1 if _last_is(e, "fortify") else 2)
		"fungal_shaman": return _cycle(e, ["spit", "mend"])
		"cave_stalker":
			return "ambush" if turn == 0 else _weighted(e, c, [["rake", 60], ["skulk", 40]], 1)
		"blight_beetle": return _weighted(e, c, [["charge", 60], ["harden", 40]], 1)
		"spore_mother":
			var allies := 0
			for a in c.alive():
				if a.uid != e.uid:
					allies += 1
			if turn == 0 or (allies == 0 and not _last_is(e, "burst")):
				return "burst"
			return _weighted(e, c, [["lash", 60], ["rot", 40]], 1)
		"rootbound_knight": return _cycle(e, ["bash", "strike", "entrench", "strike"])
		"carrion_lord": return _cycle(e, ["screech", "devour", "peck", "devour"])
		"rot_colossus": return _cycle(e, ["storm", "thrash", "grow", "crush"])
		"ash_wraith":
			return "wail" if turn == 0 else _weighted(e, c, [["drain", 70], ["wail", 30]], 2)
		"cinder_golem": return _cycle(e, ["spew", "smash", "heat"])
		"flame_cultist": return "incant" if turn == 0 else "strike"
		"obsidian_sentry": return _cycle(e, ["beam", "shield", "beam"])
		"ember_imp": return _weighted(e, c, [["jab", 65], ["ignite", 35]], 1)
		"phoenix_knight": return _cycle(e, ["wings", "immolate", "preen"])
		"magma_behemoth": return _cycle(e, ["smolder", "slam", "erupt"])
		"ember_tyrant":
			if not e.flags.get("ascended", false) and e.hp <= e.max_hp / 2:
				e.flags["ascended"] = true
				return "ascend"
			var plain: Array = e.history.filter(func(m): return m != "ascend")
			return ["brand", "hellfire", "decree", "inferno"][plain.size() % 4]
	push_error("No AI for %s" % e.id)
	return EnemyDB.ENEMIES[e.id].moves.keys()[0]

## Intent category for display, derived from a move's fields.
static func intent(move: Dictionary) -> String:
	var atk: bool = move.has("dmg")
	var def: bool = move.has("block") or (move.has("allies") and move.allies.has("block"))
	var buff: bool = move.has("self") or (move.has("allies") and move.allies.has("strength")) or move.has("heal")
	var debuff: bool = move.has("player") or move.has("cards")
	if move.has("summon"):
		return "summon"
	if atk and debuff:
		return "attack_debuff"
	if atk and def:
		return "attack_defend"
	if atk and buff:
		return "attack_buff"
	if atk:
		return "attack"
	if def and buff:
		return "defend_buff"
	if def:
		return "defend"
	if buff and debuff:
		return "buff_debuff"
	if buff:
		return "buff"
	if debuff:
		return "debuff"
	return "unknown"
