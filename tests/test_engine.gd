extends RefCounted

const Bot := preload("res://tests/bot.gd")
var runner

func _combat(enemies: Array, deck: Array = []) -> Combat:
	var run := RunState.new_run("TEST")
	run.data.room = null
	if not deck.is_empty():
		run.data.deck = []
		for id in deck:
			run.add_card_to_deck(id)
	run.data.relics = []
	var c := Combat.new(run, enemies, 42)
	c.start()
	return c

func _fill(id: String, n: int) -> Array:
	var a := []
	for i in n:
		a.append(id)
	return a

func test_rng_is_deterministic() -> void:
	var a := Rng.new(123)
	var b := Rng.new(123)
	for i in 50:
		runner.eq(a.next(), b.next())
	var s := a.state
	var x := a.range_i(0, 1000)
	a.state = s
	runner.eq(a.range_i(0, 1000), x, "state restore")

func test_content_is_well_formed() -> void:
	for id in CardDB.CARDS:
		var c: Dictionary = CardDB.CARDS[id]
		runner.check(c.has("name") and c.has("type") and c.has("rarity") and c.has("text"), id)
	for act in EnemyDB.ENCOUNTERS.values():
		for pool in act.values():
			for enc in pool:
				for id in enc:
					runner.check(EnemyDB.ENEMIES.has(id), id)
	for id in EnemyDB.ENEMIES:
		runner.check(not EnemyDB.ENEMIES[id].moves.is_empty(), id)
	for id in RelicDB.RELICS:
		runner.check(RelicDB.RELICS[id].has("desc"), id)
	runner.check(CardDB.reward_pool().size() >= 30, "reward pool size")

func test_map_rows_connect() -> void:
	for s in range(1, 30):
		var map := MapGen.generate(Rng.new(s))
		runner.eq(map.rows.size(), MapGen.ROWS)
		for n in map.rows[0]:
			runner.eq(n.type, "combat")
		for n in map.rows[MapGen.TREASURE_ROW]:
			runner.eq(n.type, "treasure")
		for n in map.rows[MapGen.ROWS - 1]:
			runner.eq(n.type, "rest")
		for r in MapGen.ROWS - 1:
			for n in map.rows[r]:
				runner.check(not n.next.is_empty(), "dead end at row %d" % r)
				for c in n.next:
					runner.check(MapGen.find_node(map, r + 1, c) != null, "missing child")
		for r in 4:
			for n in map.rows[r]:
				runner.check(n.type != "elite" and n.type != "rest", "early elite/rest")

func test_damage_vulnerable_and_block() -> void:
	var c := _combat(["ghoul"], _fill("strike", 10))
	var e: Dictionary = c.alive()[0]
	var hp: int = e.hp
	c.play_card(c.hand[0].uid, e.uid)
	runner.eq(e.hp, hp - 6, "strike")
	c.apply(e, "vulnerable", 1)
	c.play_card(c.hand[0].uid, e.uid)
	runner.eq(e.hp, hp - 15, "vulnerable")
	e.block = 5
	c.play_card(c.hand[0].uid, e.uid)
	runner.eq(e.block, 0)
	runner.eq(e.hp, hp - 19, "block absorbs")
	runner.eq(c.player.energy, 0)

func test_light_caps_and_wanes() -> void:
	var c := _combat(["ghoul"], _fill("stoke", 10))
	c.gain_light(20)
	runner.eq(c.player.light, 10)
	c.end_turn()
	runner.eq(c.player.light, 9)

func test_burn_ticks_and_decays() -> void:
	var c := _combat(["ghoul"], _fill("guard", 10))
	var e: Dictionary = c.alive()[0]
	c.apply(e, "burn", 4)
	var hp: int = e.hp
	c.end_turn()
	runner.eq(e.hp, hp - 4)
	runner.eq(e.statuses.burn, 3)

func test_enrage_punishes_skills() -> void:
	var c := _combat(["gravewarden"], _fill("guard", 10))
	c.end_turn()
	var e: Dictionary = c.alive()[0]
	runner.eq(e.statuses.get("enrage", 0), 2)
	c.play_card(c.hand[0].uid)
	runner.eq(e.statuses.get("strength", 0), 2)

func test_killing_all_enemies_wins() -> void:
	var c := _combat(["crypt_rat"], _fill("strike", 10))
	var e: Dictionary = c.alive()[0]
	e.hp = 3
	c.play_card(c.hand[0].uid, e.uid)
	runner.check(c.over and c.won)

func test_upgraded_cards() -> void:
	var s := CardDB.stats({"id": "strike", "up": true})
	runner.eq(s.v.d, 9)
	runner.eq(s.name, "Strike+")

func test_every_card_can_be_played() -> void:
	for id in CardDB.CARDS:
		if CardDB.CARDS[id].get("unplayable", false):
			continue
		for up in [false, true]:
			var c := _combat(["ghoul", "crypt_rat"], _fill("guard", 10))
			c.player.energy = 9
			c.player.light = 5
			c.hand = [{"uid": "x", "id": id, "up": up}]
			var res := c.play_card("x", c.alive()[0].uid)
			runner.check(res.ok, "%s%s: %s" % [id, "+" if up else "", res.get("reason", "")])

func test_every_potion_can_be_used() -> void:
	for id in PotionDB.POTIONS:
		var c := _combat(["ghoul", "crypt_rat"], _fill("guard", 10))
		c.run.data.potions[0] = id
		var res := c.use_potion(0, c.alive()[0].uid)
		runner.check(res.ok, id)

func test_every_relic_runs_its_hooks() -> void:
	for id in RelicDB.RELICS:
		var run := RunState.new_run("RELIC")
		run.data.room = null
		run.add_relic(id)
		var c := Combat.new(run, ["ghoul"], 7)
		c.start()
		for t in 4:
			if c.over:
				break
			Bot.play_turn(c)
		runner.check(true, id)

func test_every_event_option() -> void:
	for id in EventDB.EVENTS:
		var probe := RunState.new_run("EV")
		var n := EventDB.options(id, probe).size()
		for i in n:
			var run := RunState.new_run("EV%d" % i)
			run.data.room = {"type": "event", "id": id, "result": null}
			run.data.gold = 500
			if run.event_options()[i].disabled:
				continue
			var res = run.choose_event_option(i)
			runner.check(res != null and res.text is String, "%s#%d" % [id, i])
			var sel := run.pending_select()
			if not sel.is_empty():
				run.apply_select(run.selectable_cards(sel.purpose)[0].uid)

func test_save_round_trip() -> void:
	var run := RunState.new_run("SAVE")
	run.choose_blessing(run.data.room.options[0].id)
	if not run.pending_select().is_empty():
		run.apply_select(run.data.deck[0].uid)
	var n: Dictionary = run.available_nodes()[0]
	run.enter_node(n.row, n.col)
	var json := JSON.stringify(run.to_dict())
	var copy := RunState.from_dict(JSON.parse_string(json))
	runner.eq(JSON.stringify(copy.to_dict()), json, "data identical")
	runner.eq(copy.rng.state, run.rng.state, "rng state")
	runner.check(copy.data.floor is int, "ints restored")

func test_combat_is_reproducible_from_save() -> void:
	var run := RunState.new_run("REPRO")
	run.choose_blessing("gold")
	var n: Dictionary = run.available_nodes()[0]
	run.enter_node(n.row, n.col)
	var saved := JSON.stringify(run.to_dict())
	var a := RunState.from_dict(JSON.parse_string(saved)).start_combat()
	var b := RunState.from_dict(JSON.parse_string(saved)).start_combat()
	runner.eq(a.hand.map(func(x): return x.uid), b.hand.map(func(x): return x.uid))
	runner.eq(a.enemies.map(func(x): return x.hp), b.enemies.map(func(x): return x.hp))

func test_bot_completes_full_runs() -> void:
	var wins := 0
	for i in 40:
		var run := Bot.play_run(RunState.new_run("BOT%d" % i))
		runner.check(run.data.over, "run %d finished" % i)
		if run.data.won:
			wins += 1
			runner.eq(run.data.act, 3)
	print("    bot wins: %d / 40" % wins)
