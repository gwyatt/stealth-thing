extends RefCounted
## A simple greedy bot that plays full runs headlessly (tests and balance simulation).

static func incoming_damage(c: Combat) -> int:
	var total := 0
	for e in c.alive():
		var info := c.intent_info(e)
		if info.has("dmg"):
			total += info.dmg * info.hits
	return total

static func score_card(c: Combat, inst: Dictionary, threat: int) -> float:
	var s := CardDB.stats(inst)
	var v: Dictionary = s.v
	var targets := c.alive()
	targets.sort_custom(func(a, b): return a.hp < b.hp)
	var target = targets[0] if not targets.is_empty() else null
	var score := 0.0
	if s.type == "power":
		score += 28.0 if c.turn <= 2 else 10.0
	if v.has("d") and target != null:
		var per := float(c.preview_attack(v.d, target if s.target == "enemy" else null) * v.get("h", 1))
		if s.target == "all":
			score += per * targets.size()
		else:
			score += maxf(0.0, minf(per, target.hp + target.block) - target.block * 0.5)
	if s.id == "inferno_fist":
		score += v.m * c.player.light
	if v.has("b"):
		var need := maxi(0, threat - c.player.block)
		score += minf(c.preview_block(v.b), need) * 1.2
	if s.id == "flare":
		score += c.player.light * v.m * targets.size() - 6
	if s.id == "supernova":
		score += c.player.light * v.m - 10
	if (s.id == "stoke" or s.id == "ignition") and c.player.light < 8:
		score += 8
	if v.has("m") and not v.has("d") and not v.has("b") and s.type != "power":
		score += v.m * 2
	if s.type == "status" or s.type == "curse":
		score = 0.5
	return score / maxf(0.6, float(s.cost))

static func play_turn(c: Combat) -> void:
	var guard := 0
	while not c.over and c.phase == "player" and guard < 40:
		guard += 1
		var threat := incoming_damage(c)
		var targets := c.alive()
		targets.sort_custom(func(a, b): return a.hp < b.hp)
		if c.player.hp < c.player.max_hp * 0.5 or c.is_boss:
			var slot := -1
			for i in c.run.data.potions.size():
				var p = c.run.data.potions[i]
				if p != null and p != "smoke_bomb":
					slot = i
					break
			if slot >= 0:
				c.use_potion(slot, targets[0].uid if not targets.is_empty() else "")
				continue
		var playable := c.hand.filter(func(h): return c.can_play(h).ok)
		if playable.is_empty():
			break
		playable.sort_custom(func(a, b): return score_card(c, a, threat) > score_card(c, b, threat))
		var best: Dictionary = playable[0]
		var s := CardDB.stats(best)
		var res := c.play_card(best.uid, targets[0].uid if s.target == "enemy" and not targets.is_empty() else "")
		if not res.ok:
			break
	if not c.over:
		c.end_turn()

static func fight(run: RunState, max_turns := 80) -> Combat:
	var c := run.start_combat()
	while not c.over and c.turn < max_turns:
		play_turn(c)
	if not c.over:
		c.player.hp = 0
		c.over = true
	run.finish_combat()
	return c

static func _pick_node(run: RunState, nodes: Array) -> Dictionary:
	var d := run.data
	var pref := func(n) -> int:
		match n.type:
			"rest": return 10 if d.hp < d.max_hp * 0.6 else 3
			"elite": return 6 if d.hp > d.max_hp * 0.7 else -5
			"shop": return 7 if d.gold > 150 else 1
			"combat", "event": return 4
		return 5
	var sorted := nodes.duplicate()
	sorted.sort_custom(func(a, b): return pref.call(a) > pref.call(b))
	return sorted[0]

const RARITY_SCORE := {"common": 1, "uncommon": 2, "rare": 3}

static func _pick_card(run: RunState, choices: Array) -> int:
	if run.data.deck.size() > 28:
		return -1
	var best := -1
	var best_score := -1.0
	var attacks: int = run.data.deck.filter(func(c): return CardDB.CARDS[c.id].type == "attack").size()
	for i in choices.size():
		var s := CardDB.stats(choices[i])
		var score: float = RARITY_SCORE[s.rarity] + (1.0 if s.type == "power" else 0.0) + (0.5 if choices[i].up else 0.0)
		if s.type == "attack" and attacks < run.data.deck.size() * 0.4:
			score += 1.0
		if score > best_score:
			best_score = score
			best = i
	return best

## Plays a whole run to completion. Returns the RunState.
static func play_run(run: RunState, max_steps := 3000) -> RunState:
	var steps := 0
	while not run.data.over and steps < max_steps:
		steps += 1
		var room = run.data.room
		if room == null:
			var nodes := run.available_nodes()
			assert(not nodes.is_empty(), "No available nodes")
			var n := _pick_node(run, nodes)
			run.enter_node(n.row, n.col)
			continue
		var sel := run.pending_select()
		if not sel.is_empty():
			var opts := run.selectable_cards(sel.purpose)
			if opts.is_empty():
				run.finish_select()
			else:
				var pick = opts[0]
				if sel.purpose == "remove":
					for c in opts:
						if c.id == "strike":
							pick = c
							break
				run.apply_select(pick.uid)
			continue
		match room.type:
			"blessing": run.choose_blessing(room.options[0].id)
			"act_intro": run.dismiss_room()
			"combat": fight(run)
			"reward":
				for i in room.rewards.size():
					var rw: Dictionary = room.rewards[i]
					match rw.type:
						"cards":
							var pick := _pick_card(run, rw.choices)
							if pick >= 0:
								run.claim_reward(i, pick)
						"boss_relic": run.claim_reward(i, rw.ids[0])
						_: run.claim_reward(i)
				run.leave_rewards()
			"rest":
				if run.data.hp < run.data.max_hp * 0.55 and run.can_rest():
					run.rest()
				else:
					var up := run.selectable_cards("upgrade")
					if not up.is_empty():
						run.smith(up[0].uid)
					elif run.can_rest():
						run.rest()
				run.dismiss_room()
			"treasure":
				run.open_treasure()
				run.dismiss_room()
			"shop":
				for i in room.stock.cards.size():
					run.buy("cards", i)
				for i in room.stock.relics.size():
					run.buy("relics", i)
				if not room.stock.remove_used:
					for c in run.data.deck:
						if c.id == "strike":
							run.buy_removal(c.uid)
							break
				run.dismiss_room()
			"event":
				if room.result == null:
					var opts := run.event_options()
					var idx := 0
					for i in opts.size():
						if not opts[i].disabled:
							idx = i
							break
					run.choose_event_option(idx)
				else:
					run.dismiss_room()
			"game_over": return run
			_: assert(false, "Bot cannot handle room " + str(room.type))
	assert(steps < max_steps, "Run did not finish")
	return run
