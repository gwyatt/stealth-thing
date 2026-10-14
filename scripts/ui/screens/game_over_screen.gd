extends Control

var main

func _ready() -> void:
	var run := Session.run
	var won: bool = run.data.won
	Session.record_run_end()
	if won:
		SteamService.unlock("TYRANT_FELLED")
		if run.data.deck.size() <= 15:
			SteamService.unlock("MINIMALIST")
	Audio.music("victory" if won else "defeat")
	var box := UI.vbox(14)
	box.add_child(UI.center_box(UI.icon_rect("crown" if won else "skull", 96, UI.GOLD if won else Color("6a5a4a"))))
	box.get_child(0).custom_minimum_size = Vector2(0, 100)
	box.add_child(UI.heading("The Flame Endures" if won else "Extinguished", 64, Color("e8cf8a") if won else Color("9b1414")))
	var line := "The Ember Tyrant falls, and its stolen fire returns to the world above." if won else "You fell on floor %d of %s." % [run.data.floor, EnemyDB.ACT_NAMES[run.data.act]]
	box.add_child(UI.label(line, 26, Color("cfc5b2"), "italic", HORIZONTAL_ALIGNMENT_CENTER))
	var s: Dictionary = run.data.stats
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 60)
	for row in [["Score", str(run.score())], ["Floors climbed", str(s.floors)], ["Enemies slain", str(s.kills)], ["Elites slain", str(s.elites)],
			["Great foes slain", str(s.bosses)], ["Damage dealt", str(s.damage_dealt)], ["Cards played", str(s.cards_played)], ["Gold earned", str(s.gold_earned)], ["Seed", run.data.seed]]:
		grid.add_child(UI.label(row[0], 24, UI.MUTED))
		grid.add_child(UI.label(row[1], 24, UI.BRONZE_HI, "head", HORIZONTAL_ALIGNMENT_RIGHT))
	box.add_child(UI.center_box(grid))
	box.get_child(box.get_child_count() - 1).custom_minimum_size = Vector2(0, 330)
	var btns := UI.hbox(18)
	btns.add_child(UI.button("View Deck", func(): main.open_deck()))
	btns.add_child(UI.button("Main Menu", func():
		Session.run = null
		main.show_screen("title")))
	box.add_child(btns)
	add_child(UI.center_box(UI.panel(box, 820)))
