class_name RunState
extends RefCounted
## Owns the persistent run (`data`, plain JSON-safe values) and every out-of-combat rule.
## The current room lives in data.room so a saved game resumes exactly where it was.

const SAVE_VERSION := 1
const FINAL_ACT := 3
const WEAK_FIGHTS_PER_ACT := 3

var data: Dictionary
var rng := Rng.new(1)
var combat: Combat = null

static func new_run(seed_text: String) -> RunState:
	var r := RunState.new()
	r.data = {
		"version": SAVE_VERSION, "seed": seed_text, "rng_state": "0",
		"act": 1, "floor": 0, "hp": 70, "max_hp": 70, "gold": 99,
		"deck": [], "relics": [], "relic_state": {}, "potions": [null, null, null],
		"map": {}, "pos": null, "path": [], "next_uid": 1, "remove_cost": 75,
		"act_fights": 0, "potion_chance": 40, "rare_offset": -5,
		"seen_events": [], "last_encounters": [],
		"stats": {"kills": 0, "damage_dealt": 0, "cards_played": 0, "elites": 0, "bosses": 0, "gold_earned": 0, "floors": 0},
		"room": null, "over": false, "won": false,
	}
	r.rng = Rng.new(Rng.hash_seed(seed_text))
	for id in CardDB.STARTER_DECK:
		r.add_card_to_deck(id)
	r.add_relic("brass_lantern")
	r.data.map = MapGen.generate(r.rng)
	r.data.room = {"type": "blessing", "options": r.roll_blessings(), "done": false}
	r.sync()
	return r

static func from_dict(d: Dictionary) -> RunState:
	if d.is_empty() or int(d.get("version", 0)) != SAVE_VERSION:
		return null
	var r := RunState.new()
	r.data = _normalize(d)
	r.rng.state = String(d.rng_state).to_int()
	return r

## JSON turns every number into a float; restore ints where the rules expect them.
static func _normalize(v):
	if v is Dictionary:
		var out := {}
		for k in v:
			out[k] = _normalize(v[k])
		return out
	if v is Array:
		return v.map(func(x): return _normalize(x))
	if v is float and v == floorf(v) and absf(v) < 9.0e15:
		return int(v)
	return v

## The RNG state is a 64-bit int, so it is stored as a string (JSON numbers are doubles).
func sync() -> void:
	data.rng_state = str(rng.state)

func to_dict() -> Dictionary:
	sync()
	return data

# ───────────── Deck & inventory (also used by events and relics) ─────────────
func add_card_to_deck(id: String, up := false) -> String:
	data.deck.append({"uid": "d%d" % data.next_uid, "id": id, "up": up})
	data.next_uid += 1
	return CardDB.CARDS[id].name

func remove_card(uid: String) -> void:
	for i in data.deck.size():
		if data.deck[i].uid == uid:
			data.deck.remove_at(i)
			return

func find_card(uid: String):
	for c in data.deck:
		if c.uid == uid:
			return c
	return null

func upgrade_card(uid: String) -> void:
	var c = find_card(uid)
	if c != null and CardDB.can_upgrade(c):
		c.up = true

func upgrade_random(n: int) -> int:
	var options: Array = rng.shuffle(data.deck.filter(func(c): return CardDB.can_upgrade(c)))
	var picked := options.slice(0, n)
	for c in picked:
		c.up = true
	return picked.size()

func has_upgradable() -> bool:
	return data.deck.any(func(c): return CardDB.can_upgrade(c))

func add_relic(id: String) -> void:
	if data.relics.has(id):
		return
	data.relics.append(id)
	RelicDB.on_pickup(id, self)

func has_relic(id: String) -> bool:
	return data.relics.has(id)

func relic_flag(key: String) -> bool:
	return data.relics.any(func(id): return RelicDB.RELICS[id].get(key, false))

func relic_sum(key: String) -> float:
	var s := 0.0
	for id in data.relics:
		s += float(RelicDB.RELICS[id].get(key, 0))
	return s

func add_potion(id: String) -> bool:
	var slot: int = data.potions.find(null)
	if slot < 0:
		return false
	data.potions[slot] = id
	return true

func discard_potion(slot: int) -> void:
	data.potions[slot] = null

func use_potion_outside(slot: int) -> bool:
	var id = data.potions[slot]
	if id == null or not PotionDB.POTIONS[id].get("outside", false):
		return false
	if PotionDB.use_outside(id, self):
		data.potions[slot] = null
		return true
	return false

func gain_gold(n: int) -> void:
	data.gold = maxi(0, data.gold + n)
	if n > 0:
		data.stats.gold_earned += n

func heal(n: int) -> void:
	data.hp = mini(data.max_hp, data.hp + n)

func lose_hp(n: int) -> void:
	data.hp -= n
	if data.hp <= 0:
		data.hp = 0
		end_run(false)

func gain_max_hp(n: int) -> void:
	data.max_hp += n
	data.hp += n

func lose_max_hp(n: int) -> void:
	data.max_hp = maxi(1, data.max_hp - n)
	data.hp = mini(data.hp, data.max_hp)

# ───────────── Random generation ─────────────
func random_card(rarity: String, exclude := []) -> String:
	var pool := CardDB.pool(rarity).filter(func(id): return not exclude.has(id))
	return rng.pick(pool if not pool.is_empty() else CardDB.pool(rarity))

func gain_random_card(rarity: String) -> String:
	return add_card_to_deck(random_card(rarity))

func roll_rarity(kind: String) -> String:
	if kind == "boss":
		return "rare"
	var rare := 10 if kind == "elite" else 3
	var unc := 40 if kind == "elite" else 37
	var roll: int = rng.range_i(0, 99) + data.rare_offset
	if roll >= 100 - rare:
		data.rare_offset = -5
		return "rare"
	if roll >= 100 - rare - unc:
		return "uncommon"
	data.rare_offset = mini(40, data.rare_offset + 1)
	return "common"

func roll_card_choices(kind: String) -> Array:
	var n := 3 + int(relic_sum("extra_card_choice"))
	var picked := []
	var up_chance: float = [0.0, 0.0, 0.12, 0.25][data.act]
	for i in n:
		var rarity := roll_rarity(kind)
		var id := random_card(rarity, picked.map(func(p): return p.id))
		var up: bool = rarity != "rare" and rng.chance(up_chance) and CardDB.CARDS[id].has("up")
		picked.append({"id": id, "up": up})
	return picked

func random_relic_id(exclude := []) -> String:
	var tiers := [["common", 50], ["uncommon", 33], ["rare", 17]]
	for attempt in 6:
		var tier: String = rng.weighted(tiers)
		var pool := RelicDB.by_rarity(tier).filter(func(id): return not data.relics.has(id) and not exclude.has(id))
		if not pool.is_empty():
			return rng.pick(pool)
	var any := []
	for t in ["common", "uncommon", "rare", "shop"]:
		any += RelicDB.by_rarity(t).filter(func(id): return not data.relics.has(id) and not exclude.has(id))
	return rng.pick(any) if not any.is_empty() else ""

## Returns the relic's name (or a gold consolation when every relic is owned).
func gain_random_relic() -> String:
	var id := random_relic_id()
	if id == "":
		gain_gold(100)
		return "100 Gold"
	add_relic(id)
	return RelicDB.RELICS[id].name

func random_potion_id() -> String:
	var tier: String = rng.weighted([["common", 65], ["uncommon", 25], ["rare", 10]])
	var pool := PotionDB.POTIONS.keys().filter(func(id): return PotionDB.POTIONS[id].rarity == tier)
	return rng.pick(pool)

## Returns the potion's name, or "" if there was no room.
func gain_random_potion() -> String:
	var id := random_potion_id()
	return PotionDB.POTIONS[id].name if add_potion(id) else ""

# ───────────── Blessing (run start) ─────────────
func roll_blessings() -> Array:
	var all := [
		{"id": "maxhp", "label": "Gain 10 Max HP."},
		{"id": "gold", "label": "Gain 100 Gold."},
		{"id": "relic", "label": "Obtain a random Common relic."},
		{"id": "remove", "label": "Remove a card from your deck."},
		{"id": "upgrade", "label": "Upgrade 2 random cards."},
		{"id": "rare", "label": "Lose 8 Max HP. Obtain a random Rare card."},
		{"id": "potions", "label": "Obtain 3 random potions."},
	]
	return rng.sample(all, 3)

func choose_blessing(id: String) -> void:
	var room = data.room
	if room == null or room.type != "blessing" or room.done:
		return
	room.done = true
	var select := ""
	match id:
		"maxhp": gain_max_hp(10)
		"gold": gain_gold(100)
		"relic":
			var pool := RelicDB.by_rarity("common").filter(func(r): return not has_relic(r))
			add_relic(rng.pick(pool))
		"remove": select = "remove"
		"upgrade": upgrade_random(2)
		"rare":
			lose_max_hp(8)
			gain_random_card("rare")
		"potions":
			for i in 3:
				gain_random_potion()
	if select != "":
		room["select"] = {"purpose": select}
	else:
		data.room = null
	sync()

# ───────────── Map ─────────────
func available_nodes() -> Array:
	if data.room != null:
		return []
	var map: Dictionary = data.map
	if data.pos == null:
		return map.rows[0]
	var row: int = data.pos.row
	if row == MapGen.ROWS - 1:
		return [map.boss]
	if row >= MapGen.ROWS:
		return []
	var cur = MapGen.find_node(map, row, data.pos.col)
	return cur.next.map(func(c): return MapGen.find_node(map, row + 1, c))

func enter_node(row: int, col: int):
	var node = null
	for n in available_nodes():
		if n.row == row and n.col == col:
			node = n
	if node == null:
		return null
	data.pos = {"row": row, "col": col}
	data.path.append({"row": row, "col": col})
	data.floor += 1
	data.stats.floors += 1
	data.room = create_room(node.type)
	sync()
	return data.room

func create_room(type: String) -> Dictionary:
	match type:
		"combat":
			var pool := "weak" if data.act_fights < WEAK_FIGHTS_PER_ACT else "strong"
			data.act_fights += 1
			return {"type": "combat", "kind": "normal", "enemies": pick_encounter(pool)}
		"elite": return {"type": "combat", "kind": "elite", "enemies": pick_encounter("elite")}
		"boss": return {"type": "combat", "kind": "boss", "enemies": pick_encounter("boss")}
		"event": return create_event_room()
		"shop": return {"type": "shop", "stock": roll_shop()}
		"rest": return {"type": "rest", "done": false}
		"treasure": return {"type": "treasure", "opened": false, "relic": random_relic_id(), "gold": rng.range_i(25, 45)}
	push_error("Unknown room type %s" % type)
	return {}

func pick_encounter(pool: String) -> Array:
	var list: Array = EnemyDB.ENCOUNTERS[data.act][pool]
	var recent: Array = data.last_encounters.slice(maxi(0, data.last_encounters.size() - 2))
	var fresh := list.filter(func(e): return not recent.has(",".join(e)))
	var enc: Array = rng.pick(fresh if not fresh.is_empty() else list)
	data.last_encounters.append(",".join(enc))
	return enc.duplicate()

func create_event_room() -> Dictionary:
	var roll := rng.range_i(1, 100)
	if roll <= 12:
		var r := create_room("combat")
		r["from_event"] = true
		return r
	if roll <= 17:
		return create_room("shop")
	if roll <= 21:
		return create_room("treasure")
	var pool := EventDB.EVENTS.keys().filter(func(id): return EventDB.EVENTS[id].acts.has(data.act))
	var fresh := pool.filter(func(id): return not data.seen_events.has(id))
	if fresh.is_empty():
		fresh = pool
	var id: String = rng.pick(fresh)
	data.seen_events.append(id)
	return {"type": "event", "id": id, "result": null}

# ───────────── Combat ─────────────
func start_combat() -> Combat:
	var room = data.room
	if room == null or room.type != "combat":
		return null
	var seed_value := Rng.hash_seed("%s:%d:%d" % [data.seed, data.act, data.floor])
	combat = Combat.new(self, room.enemies, seed_value, room.kind == "boss", room.kind == "elite")
	combat.start()
	return combat

func finish_combat() -> void:
	var c := combat
	if c == null or not c.over:
		return
	c.finalize()
	var s: Dictionary = data.stats
	s.kills += c.stats.kills
	s.damage_dealt += c.stats.damage_dealt
	s.cards_played += c.stats.cards_played
	combat = null
	if not c.won and not c.escaped:
		end_run(false)
		return
	if c.escaped:
		data.room = null
		sync()
		return
	for id in data.relics:
		RelicDB.on_combat_won(id, self)
	var kind: String = data.room.kind
	if kind == "elite":
		s.elites += 1
	if kind == "boss":
		s.bosses += 1
	data.room = {"type": "reward", "kind": kind, "rewards": roll_rewards(kind)}
	sync()

func roll_rewards(kind: String) -> Array:
	var rewards := []
	var gold := rng.range_i(95, 105) if kind == "boss" else (rng.range_i(25, 35) if kind == "elite" else rng.range_i(10, 20))
	rewards.append({"type": "gold", "amount": gold + int(relic_sum("bonus_gold"))})
	if rng.range_i(0, 99) < data.potion_chance or kind == "elite":
		data.potion_chance = maxi(0, data.potion_chance - 10)
		rewards.append({"type": "potion", "id": random_potion_id()})
	else:
		data.potion_chance = mini(100, data.potion_chance + 10)
	if kind == "elite":
		var id := random_relic_id()
		if id != "":
			rewards.append({"type": "relic", "id": id})
	if kind == "boss" and data.act < FINAL_ACT:
		var pool := RelicDB.by_rarity("boss").filter(func(r): return not has_relic(r))
		rewards.append({"type": "boss_relic", "ids": rng.sample(pool, 3)})
	rewards.append({"type": "cards", "choices": roll_card_choices(kind)})
	return rewards

func claim_reward(index: int, choice = null) -> bool:
	var room = data.room
	if room == null or room.type != "reward":
		return false
	var r: Dictionary = room.rewards[index]
	if r.get("claimed", false):
		return false
	match r.type:
		"gold": gain_gold(r.amount)
		"potion":
			if not add_potion(r.id):
				return false
		"relic": add_relic(r.id)
		"boss_relic":
			if not r.ids.has(choice):
				return false
			add_relic(choice)
		"cards":
			if choice == null or choice < 0 or choice >= r.choices.size():
				return false
			var c: Dictionary = r.choices[choice]
			add_card_to_deck(c.id, c.up)
	r["claimed"] = true
	sync()
	return true

func leave_rewards() -> void:
	var room = data.room
	if room == null or room.type != "reward":
		return
	if room.kind == "boss":
		if data.act >= FINAL_ACT:
			end_run(true)
		else:
			next_act()
		return
	data.room = null
	sync()

func next_act() -> void:
	data.act += 1
	data.pos = null
	data.path = []
	data.act_fights = 0
	data.last_encounters = []
	data.map = MapGen.generate(rng)
	heal(ceili((data.max_hp - data.hp) * 0.75))
	data.room = {"type": "act_intro"}
	sync()

func dismiss_room() -> void:
	data.room = null
	sync()

# ───────────── Rest ─────────────
func can_rest() -> bool:
	return not relic_flag("no_rest")

func rest_heal_amount() -> int:
	return ceili(data.max_hp * 0.3)

func rest() -> bool:
	var room = data.room
	if room == null or room.type != "rest" or room.done or not can_rest():
		return false
	heal(rest_heal_amount())
	room.done = true
	room["result"] = "rested"
	sync()
	return true

func smith(uid: String) -> bool:
	var room = data.room
	if room == null or room.type != "rest" or room.done:
		return false
	upgrade_card(uid)
	room.done = true
	room["result"] = "smithed"
	sync()
	return true

# ───────────── Treasure ─────────────
func open_treasure() -> void:
	var room = data.room
	if room == null or room.type != "treasure" or room.opened:
		return
	room.opened = true
	gain_gold(room.gold)
	if room.relic != "":
		add_relic(room.relic)
	else:
		gain_gold(75)
	sync()

# ───────────── Shop ─────────────
func price(base: int) -> int:
	return roundi(base * (1.0 - relic_sum("shop_discount")))

func remove_price() -> int:
	return price(data.remove_cost)

func roll_shop() -> Dictionary:
	var cards := []
	var taken := []
	for type in ["attack", "attack", "skill", "skill", "power"]:
		var rarity: String = rng.weighted([["common", 55], ["uncommon", 35], ["rare", 10]])
		var pool := CardDB.reward_pool().filter(func(id): return CardDB.CARDS[id].type == type and CardDB.CARDS[id].rarity == rarity and not taken.has(id))
		if pool.is_empty():
			pool = CardDB.reward_pool().filter(func(id): return CardDB.CARDS[id].type == type and not taken.has(id))
		var id: String = rng.pick(pool)
		taken.append(id)
		var base: int = {"common": 50, "uncommon": 75, "rare": 150}[CardDB.CARDS[id].rarity]
		cards.append({"id": id, "price": roundi(base * (0.9 + rng.next() * 0.2)), "sold": false})
	var sale := rng.range_i(0, cards.size() - 1)
	cards[sale].price = roundi(cards[sale].price / 2.0)
	cards[sale]["sale"] = true

	var relic_ids := []
	for i in 2:
		var rid := random_relic_id(relic_ids)
		if rid != "":
			relic_ids.append(rid)
	var shop_pool := RelicDB.by_rarity("shop").filter(func(r): return not has_relic(r) and not relic_ids.has(r))
	if not shop_pool.is_empty():
		relic_ids.append(rng.pick(shop_pool))
	var relic_price := {"common": 150, "uncommon": 240, "rare": 300, "shop": 160}
	var relics := relic_ids.map(func(rid): return {"id": rid, "price": roundi(relic_price[RelicDB.RELICS[rid].rarity] * (0.92 + rng.next() * 0.16)), "sold": false})

	var potions := []
	for i in 3:
		var pid := random_potion_id()
		var pbase: int = {"common": 50, "uncommon": 75, "rare": 100}[PotionDB.POTIONS[pid].rarity]
		potions.append({"id": pid, "price": roundi(pbase * (0.95 + rng.next() * 0.1)), "sold": false})
	return {"cards": cards, "relics": relics, "potions": potions, "remove_used": false}

func buy(kind: String, index: int) -> Dictionary:
	var room = data.room
	if room == null or room.type != "shop":
		return {"ok": false}
	var item: Dictionary = room.stock[kind][index]
	if item.sold:
		return {"ok": false}
	var cost := price(item.price)
	if data.gold < cost:
		return {"ok": false, "reason": "Not enough Gold"}
	if kind == "potions" and not data.potions.has(null):
		return {"ok": false, "reason": "Potion slots full"}
	data.gold -= cost
	item.sold = true
	match kind:
		"cards": add_card_to_deck(item.id)
		"relics": add_relic(item.id)
		"potions": add_potion(item.id)
	sync()
	return {"ok": true}

func buy_removal(uid: String) -> Dictionary:
	var room = data.room
	if room == null or room.type != "shop" or room.stock.remove_used:
		return {"ok": false}
	var cost := remove_price()
	if data.gold < cost:
		return {"ok": false, "reason": "Not enough Gold"}
	data.gold -= cost
	data.remove_cost += 25
	room.stock.remove_used = true
	remove_card(uid)
	sync()
	return {"ok": true}

# ───────────── Events ─────────────
func event_options() -> Array:
	var room = data.room
	if room == null or room.type != "event":
		return []
	return EventDB.options(room.id, self)

func choose_event_option(i: int):
	var room = data.room
	var opts := event_options()
	if i < 0 or i >= opts.size() or opts[i].disabled or room.result != null:
		return null
	var res := EventDB.choose(room.id, i, self)
	room.result = {"text": res.text, "select": res.select}
	sync()
	return room.result

# ───────────── Card selection ─────────────
## The card choice the player still owes (remove/upgrade/...), or {} if none.
func pending_select() -> Dictionary:
	var room = data.room
	if room == null:
		return {}
	if room.type == "event" and room.result != null and room.result.select != null and not room.result.get("select_done", false):
		return room.result.select
	if room.type == "blessing" and room.has("select") and not room.get("select_done", false):
		return room.select
	return {}

func selectable_cards(purpose: String) -> Array:
	if purpose == "upgrade":
		return data.deck.filter(func(c): return CardDB.can_upgrade(c))
	if purpose == "duplicate":
		return data.deck.filter(func(c): return CardDB.CARDS[c.id].type != "curse")
	return data.deck.duplicate()

func apply_select(uid: String) -> bool:
	var sel := pending_select()
	if sel.is_empty():
		return false
	var card = find_card(uid)
	if card != null:
		match sel.purpose:
			"remove": remove_card(uid)
			"upgrade": upgrade_card(uid)
			"duplicate": add_card_to_deck(card.id, card.up)
			"transform":
				remove_card(uid)
				var rarity: String = rng.weighted([["common", 50], ["uncommon", 38], ["rare", 12]])
				var nid := random_card(rarity, [card.id])
				add_card_to_deck(nid)
				sel["result_card"] = nid
	finish_select()
	return true

func finish_select() -> void:
	var room = data.room
	if room.type == "event":
		room.result["select_done"] = true
	elif room.type == "blessing":
		data.room = null
	sync()

# ───────────── End ─────────────
func end_run(victory: bool) -> void:
	data.over = true
	data.won = victory
	data.room = {"type": "game_over", "won": victory}
	sync()

func score() -> int:
	var s: Dictionary = data.stats
	return s.floors * 5 + s.kills * 2 + s.elites * 25 + s.bosses * 75 + (250 if data.won else 0) + floori(s.gold_earned / 10.0)
