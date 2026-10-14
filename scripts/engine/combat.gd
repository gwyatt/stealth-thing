class_name Combat
extends RefCounted
## A single fight. Pure game logic with no nodes: the UI reads state and drains
## `events` to animate. Creatures are Dictionaries so they serialize and inspect easily.

const HAND_LIMIT := 10
const BASE_DRAW := 5
const BASE_ENERGY := 3
const BASE_MAX_LIGHT := 10
const MAX_ENEMIES := 5

var run  # RunState
var rng: Rng
var is_boss := false
var is_elite := false
var events: Array = []
var turn := 0
var phase := "start"  # start | player | enemy | over
var over := false
var won := false
var escaped := false
var first_attack_double := false
var double_active := false
var turn_stats := {"attacks": 0, "skills": 0, "cards": 0}
var stats := {"damage_dealt": 0, "cards_played": 0, "kills": 0}

var player: Dictionary
var enemies: Array = []
var draw_pile: Array = []
var hand: Array = []
var discard_pile: Array = []
var exhaust_pile: Array = []
var _next_uid := 1

func _init(run_state, enemy_ids: Array, seed_value: int, boss := false, elite := false) -> void:
	run = run_state
	rng = Rng.new(seed_value)
	is_boss = boss
	is_elite = elite
	player = {
		"is_player": true, "uid": "player", "name": "The Lanternkeeper",
		"hp": int(run.data.hp), "max_hp": int(run.data.max_hp), "block": 0,
		"energy": 0, "max_energy": BASE_ENERGY + relic_sum("energy"),
		"light": 0, "max_light": BASE_MAX_LIGHT + relic_sum("max_light"),
		"statuses": {}, "dead": false,
	}
	for c in run.data.deck:
		draw_pile.append({"uid": c.uid, "id": c.id, "up": c.up})
	rng.shuffle(draw_pile)
	for id in enemy_ids:
		spawn_enemy(id)

# ───────────── Relics ─────────────
func relics() -> Array:
	return run.data.relics

func has_relic(id: String) -> bool:
	return run.data.relics.has(id)

func relic_sum(key: String) -> float:
	var s := 0.0
	for id in run.data.relics:
		s += float(RelicDB.RELICS[id].get(key, 0))
	return s

func relic_flag(key: String) -> bool:
	for id in run.data.relics:
		if RelicDB.RELICS[id].get(key, false):
			return true
	return false

func emit(type: String, data := {}) -> void:
	data["type"] = type
	events.append(data)

func drain_events() -> Array:
	var ev := events
	events = []
	return ev

# ───────────── Setup ─────────────
func spawn_enemy(id: String) -> Dictionary:
	var def: Dictionary = EnemyDB.ENEMIES[id]
	var hp := rng.range_i(def.hp[0], def.hp[1])
	var e := {
		"is_player": false, "uid": "e%d" % _next_uid, "id": id, "name": def.name,
		"hp": hp, "max_hp": hp, "block": 0, "statuses": (def.get("init", {}) as Dictionary).duplicate(),
		"history": [], "intent": "", "flags": {}, "dead": false,
	}
	_next_uid += 1
	enemies.append(e)
	return e

func start() -> void:
	for e in enemies:
		choose_intent(e)
	start_player_turn()

# ───────────── Queries ─────────────
func alive() -> Array:
	return enemies.filter(func(e): return not e.dead)

func random_enemy():
	var a := alive()
	return rng.pick(a) if not a.is_empty() else null

func find_enemy(uid: String):
	for e in enemies:
		if e.uid == uid and not e.dead:
			return e
	return null

func status(target: Dictionary, key: String) -> int:
	return int(target.statuses.get(key, 0))

func can_play(inst: Dictionary) -> Dictionary:
	var s := CardDB.stats(inst)
	if phase != "player" or over:
		return {"ok": false, "reason": "Not your turn"}
	if s.unplayable:
		return {"ok": false, "reason": "Unplayable"}
	if s.cost > player.energy:
		return {"ok": false, "reason": "Not enough Energy"}
	if s.light_cost > player.light:
		return {"ok": false, "reason": "Not enough Light"}
	return {"ok": true}

func preview_attack(base: int, target = null) -> int:
	return calc_damage(player, target, base)

func preview_block(base: int) -> int:
	return calc_block(base)

func intent_info(e: Dictionary) -> Dictionary:
	var move: Dictionary = EnemyDB.ENEMIES[e.id].moves.get(e.intent, {})
	if move.is_empty():
		return {}
	var info := {"key": e.intent, "name": move.name, "type": EnemyDB.intent(move)}
	if move.has("dmg"):
		info["dmg"] = calc_damage(e, player, move.dmg)
		info["hits"] = move.get("hits", 1)
	return info

# ───────────── Math ─────────────
func calc_damage(attacker: Dictionary, defender, base: int) -> int:
	var dmg := float(base + status(attacker, "strength"))
	if status(attacker, "weak") > 0:
		dmg *= 0.75
	if defender != null and status(defender, "vulnerable") > 0:
		dmg *= 1.5
	if attacker.is_player and double_active:
		dmg *= 2.0
	return maxi(0, floori(dmg))

func calc_block(base: int) -> int:
	var b := float(base + status(player, "dexterity"))
	if status(player, "frail") > 0:
		b *= 0.75
	return maxi(0, floori(b))

# ───────────── API used by cards, relics and potions ─────────────
func attack(target, base: int) -> int:
	if target == null or target.dead or over:
		return 0
	var dmg := calc_damage(player, target, base)
	var lost := deal_damage(target, dmg, true)
	var thorns := status(target, "thorns")
	if thorns > 0 and not target.dead:
		deal_damage(player, thorns, false)
	return lost

func attack_all(base: int) -> void:
	for e in alive():
		attack(e, base)

func enemy_attack(e: Dictionary, base: int, hits := 1) -> void:
	for i in hits:
		if over or e.dead:
			return
		deal_damage(player, calc_damage(e, player, base), true)
		var thorns := status(player, "thorns")
		if thorns > 0 and not over:
			deal_damage(e, thorns, false)

func deal_damage(target: Dictionary, amount: int, is_attack := false) -> int:
	if target.dead or over:
		return 0
	var blocked := mini(target.block, amount)
	target.block -= blocked
	var through := amount - blocked
	var lost := mini(target.hp, through)
	target.hp -= through
	if not target.is_player:
		stats.damage_dealt += lost
	emit("damage", {"target": target.uid, "amount": through, "blocked": blocked, "attack": is_attack})
	if is_attack and through > 0 and status(target, "plated_armor") > 0:
		add_status(target, "plated_armor", -1)
	check_death(target)
	return lost

## HP loss that ignores Block (unless `use_block`).
func lose_hp_enemy(e, n: int, use_block := false) -> void:
	if e == null or e.dead:
		return
	if use_block:
		deal_damage(e, n)
		return
	e.hp -= n
	stats.damage_dealt += n
	emit("damage", {"target": e.uid, "amount": n, "blocked": 0, "attack": false})
	check_death(e)

func lose_hp(n: int) -> void:
	if over:
		return
	player.hp -= n
	emit("damage", {"target": "player", "amount": n, "blocked": 0, "attack": false})
	check_death(player)

func damage_player(n: int) -> void:
	deal_damage(player, n)

func block(n: int, raw := false) -> void:
	var amt := n if raw else calc_block(n)
	if amt <= 0:
		return
	player.block += amt
	emit("block", {"target": "player", "amount": amt})

func enemy_block(e: Dictionary, n: int) -> void:
	if e.dead:
		return
	e.block += n
	emit("block", {"target": e.uid, "amount": n})

func heal(n: int) -> void:
	var before: int = player.hp
	player.hp = mini(player.max_hp, player.hp + n)
	if player.hp > before:
		emit("heal", {"target": "player", "amount": player.hp - before})

func apply(target, key: String, n: int, raw := false) -> void:
	if target == null or target.dead or over or n == 0:
		return
	if key == "burn" and not target.is_player and not raw:
		n += status(player, "pyroclasm") + int(relic_sum("burn_bonus"))
	add_status(target, key, n)

func apply_all(key: String, n: int) -> void:
	for e in alive():
		apply(e, key, n)

func add_status(target: Dictionary, key: String, n: int) -> void:
	var next := status(target, key) + n
	if next == 0:
		target.statuses.erase(key)
	else:
		target.statuses[key] = next
	if key == "ritual" and n > 0 and target.has("flags"):
		target.flags["ritual_fresh"] = true
	emit("status", {"target": target.uid, "key": key, "amount": n})

func gain_light(n: int) -> void:
	if n <= 0 or over:
		return
	n += int(relic_sum("light_bonus"))
	var before: int = player.light
	player.light = mini(player.max_light, before + n)
	emit("light", {"amount": player.light - before})
	var armor := status(player, "ashen_armor")
	if armor > 0:
		block(armor, true)

func spend_light(n: int) -> int:
	var spent := mini(n, player.light)
	player.light -= spent
	if spent > 0:
		emit("light", {"amount": -spent})
	return spent

func spend_all_light() -> int:
	return spend_light(player.light)

func gain_energy(n: int) -> void:
	player.energy += n
	emit("energy", {"amount": n})

func draw(n: int) -> void:
	for i in n:
		if hand.size() >= HAND_LIMIT:
			return
		if draw_pile.is_empty():
			if discard_pile.is_empty():
				return
			draw_pile = rng.shuffle(discard_pile)
			discard_pile = []
			emit("shuffle")
		var card = draw_pile.pop_back()
		hand.append(card)
		emit("draw", {"uid": card.uid})

func add_cards(id: String, pile: String, n := 1) -> void:
	for i in n:
		var inst := {"uid": "t%d" % _next_uid, "id": id, "up": false, "temp": true}
		_next_uid += 1
		if pile == "draw":
			draw_pile.insert(rng.range_i(0, draw_pile.size()), inst)
		elif pile == "hand" and hand.size() < HAND_LIMIT:
			hand.append(inst)
		else:
			discard_pile.append(inst)
	emit("cards_added", {"id": id, "pile": pile, "n": n})

func escape() -> void:
	over = true
	escaped = true
	phase = "over"

# ───────────── Death ─────────────
func check_death(target: Dictionary) -> void:
	if target.hp > 0:
		return
	if target.is_player:
		var phoenix := status(player, "phoenix")
		if phoenix > 0:
			player.statuses.erase("phoenix")
			player.hp = ceili(player.max_hp * phoenix / 100.0)
			emit("revive", {"target": "player"})
			return
		if has_relic("phoenix_plume") and not run.data.relic_state.get("phoenix_plume_used", false):
			run.data.relic_state["phoenix_plume_used"] = true
			player.hp = ceili(player.max_hp * 0.5)
			emit("revive", {"target": "player", "relic": "phoenix_plume"})
			return
		player.hp = 0
		player.dead = true
		over = true
		won = false
		phase = "over"
		emit("defeat")
		return
	if status(target, "rebirth") > 0:
		target.statuses = {}
		target.hp = floori(target.max_hp / 2.0)
		target.block = 0
		emit("revive", {"target": target.uid})
		return
	target.hp = 0
	target.dead = true
	target.block = 0
	stats.kills += 1
	emit("death", {"target": target.uid})
	if alive().is_empty():
		over = true
		won = true
		phase = "over"
		emit("victory")
	for id in relics():
		RelicDB.on_enemy_death(id, self)

# ───────────── Turn flow ─────────────
func start_player_turn() -> void:
	if over:
		return
	turn += 1
	turn_stats = {"attacks": 0, "skills": 0, "cards": 0}
	player.block = 0
	player.energy = player.max_energy + status(player, "energy_next")
	player.statuses.erase("energy_next")
	tick_burn(player)
	if over:
		return
	if turn == 1:
		for id in relics():
			RelicDB.on_combat_start(id, self)
			if over:
				return
	var pyre := status(player, "kindling_pyre")
	if pyre > 0:
		gain_light(pyre)
	for id in relics():
		RelicDB.on_turn_start(id, self)
	if over:
		return
	var extra := status(player, "draw_next")
	player.statuses.erase("draw_next")
	draw(BASE_DRAW + int(relic_sum("extra_draw")) + extra)
	phase = "player"
	emit("turn_start", {"turn": turn})

func tick_burn(target: Dictionary) -> void:
	var b := status(target, "burn")
	if b <= 0:
		return
	if target.is_player:
		lose_hp(b)
	else:
		lose_hp_enemy(target, b)
	if not target.dead:
		add_status(target, "burn", -1)

func needs_target(inst: Dictionary) -> bool:
	return CardDB.stats(inst).target == "enemy" and alive().size() > 1

func play_card(uid: String, target_uid := "") -> Dictionary:
	var idx := -1
	for i in hand.size():
		if hand[i].uid == uid:
			idx = i
	if idx < 0:
		return {"ok": false, "reason": "Card not in hand"}
	var inst: Dictionary = hand[idx]
	var check := can_play(inst)
	if not check.ok:
		return check
	var s := CardDB.stats(inst)
	var target = null
	if s.target == "enemy":
		if target_uid != "":
			target = find_enemy(target_uid)
		elif alive().size() == 1:
			target = alive()[0]
		if target == null:
			return {"ok": false, "reason": "Choose a target"}

	hand.remove_at(idx)
	player.energy -= s.cost
	if s.light_cost > 0:
		spend_light(s.light_cost)
	turn_stats.cards += 1
	stats.cards_played += 1
	if s.type == "attack":
		turn_stats.attacks += 1
	if s.type == "skill":
		turn_stats.skills += 1
		for e in alive():
			var enrage := status(e, "enrage")
			if enrage > 0:
				add_status(e, "strength", enrage)
	if s.type == "attack" and first_attack_double:
		first_attack_double = false
		double_active = true
	emit("card_played", {"uid": inst.uid, "id": inst.id, "target": target.uid if target != null else ""})

	CardDB.play(inst.id, self, s.v, target, inst.get("up", false))
	double_active = false

	if not over and s.type == "attack":
		var blade := status(player, "stoked_blade")
		if blade > 0:
			gain_light(blade)
	if not over:
		for id in relics():
			RelicDB.on_card_played(id, self, s)

	if s.type == "power":
		pass  # Powers are consumed.
	elif s.exhaust:
		exhaust_pile.append(inst)
		emit("exhaust", {"uid": inst.uid})
	else:
		discard_pile.append(inst)
	return {"ok": true}

func use_potion(slot: int, target_uid := "") -> Dictionary:
	var id = run.data.potions[slot]
	if id == null or over or phase != "player":
		return {"ok": false, "reason": "Cannot use now"}
	if not PotionDB.can_use(id, self):
		return {"ok": false, "reason": "Cannot use here"}
	var target = null
	if PotionDB.needs_target(id):
		if target_uid != "":
			target = find_enemy(target_uid)
		elif alive().size() == 1:
			target = alive()[0]
		if target == null:
			return {"ok": false, "reason": "Choose a target"}
	run.data.potions[slot] = null
	emit("potion", {"id": id})
	PotionDB.use(id, self, target)
	return {"ok": true}

func end_player_turn() -> void:
	if phase != "player" or over:
		return
	for inst in hand.duplicate():
		var s := CardDB.stats(inst)
		CardDB.end_of_turn_in_hand(inst.id, self, s.v)
		if over:
			return
	var ward := status(player, "ember_ward")
	if ward > 0:
		block(ward, true)
	for id in relics():
		RelicDB.on_turn_end(id, self)
	if over:
		return
	var flame := status(player, "eternal_flame")
	if flame > 0:
		gain_light(flame)
	elif not relic_flag("no_wane") and player.light > 0:
		var wane := mini(player.light, 1 + int(relic_sum("extra_wane")))
		player.light -= wane
		emit("light", {"amount": -wane, "wane": true})
	for inst in hand:
		if CardDB.stats(inst).ethereal:
			exhaust_pile.append(inst)
		else:
			discard_pile.append(inst)
	hand = []
	emit("discard_hand")
	decay_statuses(player)
	phase = "enemy"

func begin_enemy_phase() -> void:
	for e in alive():
		e.block = 0

## One enemy's turn: burn, its move, end-of-turn effects.
func enemy_act(e: Dictionary) -> void:
	if e.dead or over:
		return
	tick_burn(e)
	if e.dead or over:
		return
	var move: Dictionary = EnemyDB.ENEMIES[e.id].moves[e.intent]
	emit("enemy_move", {"uid": e.uid, "name": move.name, "intent": EnemyDB.intent(move)})
	execute_move(e, move)
	if over or e.dead:
		return
	var ritual := status(e, "ritual")
	if ritual > 0:
		if e.flags.get("ritual_fresh", false):
			e.flags["ritual_fresh"] = false
		else:
			add_status(e, "strength", ritual)
	var plated := status(e, "plated_armor")
	if plated > 0:
		enemy_block(e, plated)
	var regen := status(e, "regen")
	if regen > 0:
		e.hp = mini(e.max_hp, e.hp + regen)
	decay_statuses(e)

func execute_move(e: Dictionary, move: Dictionary) -> void:
	if move.has("block"):
		enemy_block(e, move.block)
	if move.has("dmg"):
		enemy_attack(e, move.dmg, move.get("hits", 1))
	if over:
		return
	for k in move.get("self", {}):
		add_status(e, k, move.self[k])
	if move.has("allies"):
		for a in alive():
			if move.allies.has("block"):
				enemy_block(a, move.allies.block)
			if move.allies.has("strength"):
				add_status(a, "strength", move.allies.strength)
	for k in move.get("player", {}):
		add_status(player, k, move.player[k])
	for entry in move.get("cards", []):
		add_cards(entry[0], entry[2], entry[1])
	if move.has("heal"):
		var before: int = e.hp
		e.hp = mini(e.max_hp, e.hp + move.heal)
		emit("heal", {"target": e.uid, "amount": e.hp - before})
	for id in move.get("summon", []):
		if alive().size() >= MAX_ENEMIES:
			break
		var s := spawn_enemy(id)
		choose_intent(s)
		emit("summon", {"uid": s.uid})

func finish_enemy_phase() -> void:
	if over:
		return
	for e in alive():
		choose_intent(e)
	start_player_turn()

## Resolve a whole round at once (bots and tests).
func end_turn() -> void:
	end_player_turn()
	if over:
		return
	begin_enemy_phase()
	for e in alive():
		enemy_act(e)
		if over:
			return
	finish_enemy_phase()

func choose_intent(e: Dictionary) -> void:
	var key := EnemyDB.ai(e, self)
	e.intent = key
	e.history.append(key)

func decay_statuses(target: Dictionary) -> void:
	for key in target.statuses.keys():
		if StatusDB.decays(key):
			add_status(target, key, -1)

## Write results back into the run.
func finalize() -> void:
	run.data.hp = maxi(0, player.hp)
	run.data.max_hp = player.max_hp
