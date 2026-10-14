extends Control
## Title: logo, menu, seed entry and lifetime record.

var main
var _seed: LineEdit

func _ready() -> void:
	var box := UI.vbox(10)
	box.position = Vector2(140, 100)
	add_child(box)
	var logo := UI.label("EMBERDEEP", 128, Color("e9e1cf"), "head", HORIZONTAL_ALIGNMENT_LEFT)
	logo.add_theme_constant_override("outline_size", 12)
	logo.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.6))
	box.add_child(logo)
	box.add_child(UI.label("The last flame descends into the dark", 32, UI.MUTED, "italic"))
	var spacer := Control.new()
	spacer.custom_minimum_size.y = 40
	box.add_child(spacer)
	var menu := VBoxContainer.new()
	menu.add_theme_constant_override("separation", 6)
	box.add_child(menu)
	if Session.has_save():
		menu.add_child(_item("Continue", _continue))
	menu.add_child(_item("New Journey", _new_run))
	menu.add_child(_item("How to Play", func(): main.open_help()))
	menu.add_child(_item("Settings", func(): main.open_settings()))
	menu.add_child(_item("Codex", _codex))
	menu.add_child(_item("Quit", func(): get_tree().quit()))
	var seed_row := HBoxContainer.new()
	seed_row.add_theme_constant_override("separation", 10)
	seed_row.add_child(UI.label("Seed", 22, UI.MUTED, "head"))
	_seed = LineEdit.new()
	_seed.placeholder_text = "random"
	_seed.max_length = 16
	_seed.custom_minimum_size = Vector2(220, 40)
	_seed.add_theme_font_override("font", UI.font("head"))
	seed_row.add_child(_seed)
	var sp2 := Control.new()
	sp2.custom_minimum_size.y = 30
	box.add_child(sp2)
	box.add_child(seed_row)
	var p: Dictionary = Session.profile
	box.add_child(UI.label("Journeys %d  ·  Victories %d  ·  Deepest floor %d  ·  Best score %d" % [p.runs, p.wins, p.best_floor, p.best_score], 20, UI.MUTED))
	var ver := UI.label("v" + str(ProjectSettings.get_setting("application/config/version")), 18, Color(UI.MUTED, 0.6))
	ver.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	ver.position = Vector2(-120, -40)
	add_child(ver)
	await get_tree().process_frame
	if menu.get_child_count() > 0:
		menu.get_child(0).grab_focus()

func _item(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text.to_upper()
	b.flat = true
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.add_theme_font_size_override("font_size", 34)
	b.add_theme_color_override("font_color", Color("b9ae9a"))
	b.add_theme_color_override("font_hover_color", Color("fff2d6"))
	b.add_theme_color_override("font_focus_color", Color("fff2d6"))
	b.add_theme_constant_override("outline_size", 6)
	b.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.6))
	var empty := StyleBoxEmpty.new()
	for st in ["normal", "hover", "pressed", "focus"]:
		b.add_theme_stylebox_override(st, empty)
	b.custom_minimum_size = Vector2(420, 54)
	b.mouse_entered.connect(func():
		b.grab_focus()
		Audio.play("hover", 0.1, -10.0))
	b.focus_entered.connect(func(): b.text = "—  " + text.to_upper())
	b.focus_exited.connect(func(): b.text = text.to_upper())
	b.pressed.connect(func():
		Audio.play("click")
		cb.call())
	return b

func _continue() -> void:
	if Session.continue_run():
		main.route()
	else:
		Session.delete_save()
		main.toast("The save could not be read.")
		main.show_screen("title")

func _new_run() -> void:
	var seed_text := _seed.text.strip_edges().to_upper()
	Session.new_run(seed_text if seed_text != "" else Rng.random_seed_string())
	main.route()

func _codex() -> void:
	var cards := []
	for id in CardDB.reward_pool():
		cards.append({"uid": id, "id": id, "up": false})
	main.open_deck(cards, "Codex — All Cards")
