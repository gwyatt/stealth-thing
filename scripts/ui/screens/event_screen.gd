extends Control
## "?" events and the opening blessing. Handles follow-up card selection.

var main
const SELECT_TITLES := {"remove": "Remove a Card", "upgrade": "Upgrade a Card", "duplicate": "Duplicate a Card", "transform": "Transform a Card"}

func _ready() -> void:
	var run := Session.run
	add_child(TopBar.new().setup(main))
	var room = run.data.room
	var box := UI.vbox(16)
	var is_blessing: bool = room.type == "blessing"
	var icon: String = "candle" if is_blessing else EventDB.EVENTS[room.id].icon
	box.add_child(UI.center_box(UI.icon_rect(icon, 110, UI.BRONZE_HI)))
	box.get_child(0).custom_minimum_size = Vector2(0, 120)
	box.add_child(UI.heading("The Ember Spirit" if is_blessing else EventDB.EVENTS[room.id].name, 42))
	var text: String = "At the mouth of the Deep, a warm voice rises from your lantern. \"Keeper. The dark below has swallowed every flame but yours. Take a gift before you descend.\"" if is_blessing else EventDB.EVENTS[room.id].text
	var t := UI.label(text, 26, Color("cfc5b2"), "italic", HORIZONTAL_ALIGNMENT_CENTER)
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size.x = 820
	box.add_child(t)

	if is_blessing:
		if room.done:
			_after_choice()
			return
		for o in room.options:
			box.add_child(_option("", o.label, false, func():
				run.choose_blessing(o.id)
				Audio.play("blessing")
				_after_choice()))
	elif room.result == null:
		var opts := run.event_options()
		for i in opts.size():
			var o: Dictionary = opts[i]
			var idx: int = i
			box.add_child(_option(o.label, o.desc, o.disabled, func():
				run.choose_event_option(idx)
				Audio.play("click")
				_after_choice()))
	else:
		var r := UI.label(room.result.text, 26, UI.TEXT, "italic", HORIZONTAL_ALIGNMENT_CENTER)
		r.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		r.custom_minimum_size.x = 820
		box.add_child(r)
		var sel = room.result.get("select")
		if sel != null and sel.has("result_card"):
			box.add_child(UI.label("It became %s." % CardDB.CARDS[sel.result_card].name, 24, UI.BRONZE_HI, "body", HORIZONTAL_ALIGNMENT_CENTER))
		var c := UI.center_box(UI.button("Continue", func():
			run.dismiss_room()
			main.route()))
		c.custom_minimum_size.y = 80
		box.add_child(c)
	add_child(UI.center_box(UI.panel(box, 920)))

func _option(label: String, desc: String, disabled: bool, cb: Callable) -> Button:
	var b := Button.new()
	b.custom_minimum_size = Vector2(840, 62)
	b.disabled = disabled
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	var r := UI.rich(("[color=#d6b47a][b]%s[/b][/color]   " % label.to_upper() if label != "" else "") + desc, 24)
	r.set_anchors_preset(Control.PRESET_FULL_RECT)
	r.offset_left = 24
	r.offset_top = 14
	r.modulate = Color(1, 1, 1, 0.4) if disabled else Color.WHITE
	b.add_child(r)
	b.pressed.connect(cb)
	b.mouse_entered.connect(func(): Audio.play("hover", 0.1, -12.0))
	return b

func _after_choice() -> void:
	var run := Session.run
	if run.data.over:
		main.route()
		return
	var sel := run.pending_select()
	if not sel.is_empty():
		var purpose: String = sel.purpose
		main.open_deck(run.selectable_cards(purpose), SELECT_TITLES[purpose], func(uid):
			run.apply_select(uid)
			Audio.play("smith")
			main.route(), purpose == "upgrade", "Skip", func():
			run.finish_select()
			main.route())
		return
	main.route()
