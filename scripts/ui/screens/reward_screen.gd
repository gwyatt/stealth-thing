extends Control
## Post-combat spoils.

var main
var _list: VBoxContainer
var _bar: TopBar

func _ready() -> void:
	_bar = TopBar.new().setup(main)
	add_child(_bar)
	var run := Session.run
	var room = run.data.room
	var box := UI.vbox(14)
	var title := "Spoils of a Great Foe" if room.kind == "boss" else ("Spoils of the Hunt" if room.kind == "elite" else "Spoils")
	box.add_child(UI.heading(title, 44))
	_list = UI.vbox(10)
	box.add_child(_list)
	var leave_text := "Descend Deeper" if room.kind == "boss" and run.data.act < RunState.FINAL_ACT else ("Claim Victory" if room.kind == "boss" else "Proceed")
	var c := UI.center_box(UI.button(leave_text, func():
		run.leave_rewards()
		main.route()))
	c.custom_minimum_size.y = 80
	box.add_child(c)
	add_child(UI.center_box(UI.panel(box, 720)))
	_rebuild()

func _rebuild() -> void:
	var run := Session.run
	for ch in _list.get_children():
		ch.queue_free()
	var rewards: Array = run.data.room.rewards
	var any := false
	for i in rewards.size():
		var r: Dictionary = rewards[i]
		if r.get("claimed", false):
			continue
		any = true
		var idx: int = i
		match r.type:
			"gold":
				_list.add_child(_item(UI.icon_rect("coin", 44, UI.GOLD), "%d Gold" % r.amount, "", func(): _claim(idx, null, "gold")))
			"potion":
				var full: bool = not run.data.potions.has(null)
				_list.add_child(_item(UI.potion_icon(r.id, 44), PotionDB.POTIONS[r.id].name + (" (slots full)" if full else ""), PotionDB.POTIONS[r.id].desc, func(): _claim(idx, null, "potion")))
			"relic":
				_list.add_child(_item(UI.relic_icon(r.id, 48), RelicDB.RELICS[r.id].name, RelicDB.RELICS[r.id].desc, func(): _claim(idx, null, "relic")))
			"boss_relic":
				_list.add_child(_item(UI.icon_rect("crown", 44, UI.GOLD), "Choose a Boss Relic", "", func(): _boss_relics(idx)))
			"cards":
				_list.add_child(_item(UI.icon_rect("cards", 44, UI.BRONZE_HI), "Add a card to your deck", "", func(): _card_choice(idx)))
	if not any:
		_list.add_child(UI.label("Nothing left to collect.", 24, UI.MUTED, "italic", HORIZONTAL_ALIGNMENT_CENTER))
	_bar.refresh()
	await get_tree().process_frame
	main._focus_first(self)

func _item(icon: Control, text: String, tip: String, cb: Callable) -> Button:
	var b := Button.new()
	b.custom_minimum_size = Vector2(640, 70)
	b.tooltip_text = tip
	var h := UI.hbox(16)
	h.alignment = BoxContainer.ALIGNMENT_BEGIN
	h.set_anchors_preset(Control.PRESET_FULL_RECT)
	h.offset_left = 18
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(icon)
	h.add_child(UI.label(text, 26))
	b.add_child(h)
	b.pressed.connect(cb)
	b.mouse_entered.connect(func(): Audio.play("hover", 0.1, -12.0))
	return b

func _claim(i: int, choice, kind: String) -> void:
	if not Session.run.claim_reward(i, choice):
		main.toast("Your potion slots are full.")
		Audio.play("error")
		return
	Audio.play("gold" if kind == "gold" else "pickup")
	Session.save()
	_check_achievements()
	_rebuild()

func _check_achievements() -> void:
	if Session.run.data.relics.size() >= 10:
		SteamService.unlock("COLLECTOR")

func _card_choice(i: int) -> void:
	var r: Dictionary = Session.run.data.room.rewards[i]
	var box := UI.vbox(24)
	box.add_child(UI.heading("Choose a Card", 44))
	var row := UI.hbox(40)
	for ci in r.choices.size():
		var c: Dictionary = r.choices[ci]
		var view := CardView.new().setup({"uid": "reward%d" % ci, "id": c.id, "up": c.up})
		var idx: int = ci
		view.clicked.connect(func(_v):
			main.close_overlay()
			Audio.play("card")
			_claim(i, idx, "card"))
		view.mouse_entered.connect(func(): view.create_tween().tween_property(view, "scale", Vector2(1.08, 1.08), 0.1))
		view.mouse_exited.connect(func(): view.create_tween().tween_property(view, "scale", Vector2.ONE, 0.1))
		view.focus_mode = Control.FOCUS_ALL
		view.focus_entered.connect(func(): view.focused = true)
		view.focus_exited.connect(func(): view.focused = false)
		view.gui_input.connect(func(ev):
			if ev.is_action_pressed("confirm"):
				view.clicked.emit(view))
		row.add_child(view)
	box.add_child(row)
	var c := UI.center_box(UI.button("Skip", func(): main.close_overlay()))
	c.custom_minimum_size.y = 80
	box.add_child(c)
	main.open_overlay(box)

func _boss_relics(i: int) -> void:
	var r: Dictionary = Session.run.data.room.rewards[i]
	var box := UI.vbox(24)
	box.add_child(UI.heading("Choose a Boss Relic", 44))
	var row := UI.hbox(24)
	for id in r.ids:
		var def: Dictionary = RelicDB.RELICS[id]
		var b := Button.new()
		b.custom_minimum_size = Vector2(320, 300)
		var v := UI.vbox(10)
		v.set_anchors_preset(Control.PRESET_FULL_RECT)
		v.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var ic := UI.center_box(UI.relic_icon(id, 96))
		ic.custom_minimum_size = Vector2(0, 110)
		ic.set_anchors_preset(Control.PRESET_TOP_LEFT)
		v.add_child(ic)
		v.add_child(UI.label(def.name, 26, UI.GOLD, "head", HORIZONTAL_ALIGNMENT_CENTER))
		var d := UI.label(def.desc, 21, UI.TEXT, "body", HORIZONTAL_ALIGNMENT_CENTER)
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.custom_minimum_size.x = 290
		v.add_child(d)
		b.add_child(v)
		var rid: String = id
		b.pressed.connect(func():
			main.close_overlay()
			_claim(i, rid, "relic"))
		row.add_child(b)
	box.add_child(row)
	var c := UI.center_box(UI.button("Back", func(): main.close_overlay()))
	c.custom_minimum_size.y = 80
	box.add_child(c)
	main.open_overlay(box)
