extends Node
## Developer tour: `godot --path . -- --tour=/abs/out/dir` drives the real game
## through every screen, plays some combat with a bot and saves screenshots.
## Exits with code 1 if the game reported errors (checked by the caller's log).

const Bot := preload("res://tests/bot.gd")

var main
var out_dir := ""
var autoplay_runs := 0
var _n := 0

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--tour="):
			out_dir = a.substr(7)
		if a.begins_with("--autoplay="):
			autoplay_runs = int(a.substr(11))
	if autoplay_runs > 0:
		Settings.fast_animations = true
		_autoplay.call_deferred()
		return
	if out_dir == "":
		queue_free()
		return
	DirAccess.make_dir_recursive_absolute(out_dir)
	Settings.fast_animations = true
	_run.call_deferred()

func _wait(s: float) -> void:
	await get_tree().create_timer(s).timeout

func shot(name: String) -> void:
	await _wait(0.9)
	await RenderingServer.frame_post_draw
	_n += 1
	var path := "%s/%02d_%s.png" % [out_dir, _n, name]
	get_viewport().get_texture().get_image().save_png(path)
	print("[tour] ", path)

func _set_room(room: Dictionary) -> void:
	Session.run.combat = null
	Session.run.data.room = room
	main.route()
	await _wait(0.6)

func _run() -> void:
	await _wait(1.5)
	await shot("title")
	Session.new_run("TOUR")
	main.route()
	await _wait(0.8)
	await shot("blessing")
	Session.run.choose_blessing("gold")
	Session.run.add_relic("vial_of_embers")
	Session.run.add_potion("fire_flask")
	Session.run.add_potion("liquid_light")
	main.route()
	await _wait(0.8)
	await shot("map")

	# A real fight driven through the combat screen.
	var n: Dictionary = Session.run.available_nodes()[0]
	Session.run.enter_node(n.row, n.col)
	Session.run.data.room = {"type": "combat", "kind": "normal", "enemies": ["drowned_thrall", "bone_archer", "crypt_rat"]}
	main.route()
	await _wait(1.0)
	await shot("combat_start")
	var scr = main.screen
	var cv = scr.card_views[0] if not scr.card_views.is_empty() else null
	if cv != null:
		scr._click_card(cv)
		await _wait(0.4)
		await shot("combat_targeting")
		scr._click_creature(Session.run.combat.alive()[0].uid)
		await _wait(0.8)
	await shot("combat_after_card")
	await scr.end_turn()
	await _wait(0.5)
	await shot("combat_turn2")
	# Let the bot finish the fight via the engine, then show results.
	var c: Combat = Session.run.combat
	while not c.over and c.turn < 40:
		Bot.play_turn(c)
	scr._after_action()
	await _wait(3.0)
	await shot("after_fight")

	var acts := {1: [["ghoul"], ["gravewarden"], ["drowned_king"]], 2: [["fungal_shaman", "sporeling", "myconid_brute"], ["spore_mother"], ["rot_colossus"]], 3: [["flame_cultist", "obsidian_sentry", "ember_imp"], ["phoenix_knight"], ["ember_tyrant"]]}
	for act in [1, 2, 3]:
		Session.run.data.act = act
		Session.run.data.over = false
		Session.run.data.hp = Session.run.data.max_hp
		for enc in acts[act]:
			var kind := "boss" if EnemyDB.ENEMIES[enc[0]].get("boss", false) else ("elite" if EnemyDB.ENEMIES[enc[0]].get("elite", false) else "normal")
			await _set_room({"type": "combat", "kind": kind, "enemies": enc})
			await _wait(kind == "boss" and 2.0 or 0.4)
			await shot("act%d_%s" % [act, enc[0]])
	Session.run.data.act = 1
	await _set_room({"type": "reward", "kind": "elite", "rewards": Session.run.roll_rewards("elite")})
	await shot("reward")
	main.screen._card_choice(Session.run.data.room.rewards.size() - 1)
	await shot("card_choice")
	main.close_all_overlays()
	await _set_room({"type": "shop", "stock": Session.run.roll_shop()})
	await shot("shop")
	await _set_room({"type": "rest", "done": false})
	await shot("rest")
	main.open_deck(Session.run.selectable_cards("upgrade"), "Upgrade a Card", func(_u): pass, true, "Cancel")
	await shot("smith")
	main.close_all_overlays()
	Session.run.data.act = 2
	await _set_room({"type": "event", "id": "whispering_skull", "result": null})
	await shot("event")
	await _set_room({"type": "treasure", "opened": false, "relic": "crystal_prism", "gold": 30})
	await shot("treasure")
	await _set_room({"type": "act_intro"})
	await shot("act_intro")
	main.open_pause_menu()
	await shot("pause")
	main.close_all_overlays()
	main.open_settings()
	await shot("settings")
	main.close_all_overlays()
	Session.run.data.stats.floors = 31
	Session.run.end_run(true)
	main.route()
	await _wait(0.6)
	await shot("victory")
	print("[tour] done")
	get_tree().quit(0)


# ───────────── Autoplay: bot plays whole runs through the real UI ─────────────
func _autoplay() -> void:
	await _wait(1.0)
	var wins := 0
	for r in autoplay_runs:
		Session.new_run("AUTOPLAY%d" % r)
		main.route()
		var steps := 0
		while not Session.run.data.over and steps < 4000:
			steps += 1
			await _wait(0.05)
			while main._routing:
				await _wait(0.05)
			await _step()
		if Session.run.data.won:
			wins += 1
		print("[autoplay] run %d: %s on act %d floor %d" % [r, "WON" if Session.run.data.won else "lost", Session.run.data.act, Session.run.data.floor])
		await _wait(0.6)
	print("[autoplay] done: %d/%d won" % [wins, autoplay_runs])
	get_tree().quit(0)

func _step() -> void:
	var run: RunState = Session.run
	var room = run.data.room
	if main.has_overlay():
		main.close_all_overlays()
	var sel := run.pending_select()
	if not sel.is_empty():
		var opts := run.selectable_cards(sel.purpose)
		if opts.is_empty():
			run.finish_select()
		else:
			run.apply_select(opts[0].uid)
		main.route()
		return
	if room == null:
		var nodes := run.available_nodes()
		var scr = main.screen
		if scr != null and scr.has_method("_enter"):
			scr._enter(nodes[randi() % nodes.size()])
		return
	match room.type:
		"combat":
			await _play_combat()
		"blessing":
			run.choose_blessing(room.options[0].id)
			main.route()
		"reward":
			for i in room.rewards.size():
				var rw: Dictionary = room.rewards[i]
				match rw.type:
					"cards": run.claim_reward(i, 0)
					"boss_relic": run.claim_reward(i, rw.ids[0])
					_: run.claim_reward(i)
			run.leave_rewards()
			main.route()
		"shop":
			run.buy("cards", 0)
			run.buy("potions", 0)
			run.dismiss_room()
			main.route()
		"rest":
			if run.data.hp < run.data.max_hp * 0.6 and run.can_rest():
				run.rest()
			elif run.has_upgradable():
				run.smith(run.selectable_cards("upgrade")[0].uid)
			else:
				run.rest()
			main.route()
			await _wait(0.2)
			run.dismiss_room()
			main.route()
		"treasure":
			run.open_treasure()
			main.route()
			await _wait(0.2)
			run.dismiss_room()
			main.route()
		"event":
			if room.result == null:
				var opts := run.event_options()
				for i in opts.size():
					if not opts[i].disabled:
						run.choose_event_option(i)
						break
				main.route()
			else:
				run.dismiss_room()
				main.route()
		"act_intro":
			run.dismiss_room()
			main.route()
		"game_over":
			pass

func _play_combat() -> void:
	var scr = main.screen
	if scr == null or not scr.has_method("end_turn"):
		return
	var c: Combat = Session.run.combat
	if c == null or c.over or scr.busy:
		return
	var guard := 0
	while is_instance_valid(scr) and not c.over and c.phase == "player" and guard < 12:
		guard += 1
		var playable := c.hand.filter(func(h): return c.can_play(h).ok)
		if playable.is_empty():
			break
		var threat := Bot.incoming_damage(c)
		playable.sort_custom(func(a, b): return Bot.score_card(c, a, threat) > Bot.score_card(c, b, threat))
		var cv = null
		for v in scr.card_views:
			if v.inst.uid == playable[0].uid:
				cv = v
		if cv == null:
			break
		scr._click_card(cv)
		if scr.selected_uid != "":
			var alive := c.alive()
			alive.sort_custom(func(a, b): return a.hp < b.hp)
			scr._click_creature(alive[0].uid)
		await _wait(0.15)
		while is_instance_valid(scr) and scr.busy:
			await _wait(0.05)
		if not is_instance_valid(scr):
			return
	if is_instance_valid(scr) and not c.over and c.phase == "player":
		if c.player.hp < c.player.max_hp * 0.4:
			for i in Session.run.data.potions.size():
				var p = Session.run.data.potions[i]
				if p != null and p != "smoke_bomb":
					scr.use_potion(i)
					if scr.potion_slot >= 0:
						scr._click_creature(c.alive()[0].uid)
					await _wait(0.2)
					break
		await scr.end_turn()
	while not is_instance_valid(main.screen) or main._routing or (is_instance_valid(scr) and main.screen == scr and scr.busy):
		await _wait(0.1)
