extends VBoxContainer
## Grid of cards in a scroll area. Optionally pickable (remove/upgrade/...).

var main

func setup(cards: Array, title: String, on_pick: Callable, upgrade_preview: bool, cancel_text: String, on_cancel: Callable) -> void:
	add_theme_constant_override("separation", 14)
	custom_minimum_size = Vector2(1500, 0)
	add_child(UI.heading(title, 40))
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(1500, 760)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	var grid := HFlowContainer.new()
	grid.add_theme_constant_override("h_separation", 26)
	grid.add_theme_constant_override("v_separation", 30)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.alignment = FlowContainer.ALIGNMENT_CENTER
	scroll.add_child(grid)
	var order := {"attack": 0, "skill": 1, "power": 2, "status": 3, "curse": 4}
	var sorted := cards.duplicate()
	sorted.sort_custom(func(a, b):
		var sa := CardDB.stats(a)
		var sb := CardDB.stats(b)
		if order[sa.type] != order[sb.type]:
			return order[sa.type] < order[sb.type]
		return sa.name < sb.name)
	if sorted.is_empty():
		grid.add_child(UI.label("No cards.", 26, UI.MUTED, "italic"))
	for c in sorted:
		var shown: Dictionary = c.duplicate()
		if upgrade_preview:
			shown.up = true
		var holder := Control.new()
		holder.custom_minimum_size = CardView.SIZE + Vector2(10, 10)
		var view := CardView.new().setup(shown)
		view.position = Vector2(5, 5)
		holder.add_child(view)
		if on_pick.is_valid():
			var btn := Button.new()
			btn.flat = true
			btn.set_anchors_preset(Control.PRESET_FULL_RECT)
			btn.mouse_filter = Control.MOUSE_FILTER_STOP
			btn.tooltip_text = view.tooltip_text
			var uid: String = c.uid
			btn.pressed.connect(func():
				Audio.play("card")
				main.close_overlay()
				on_pick.call(uid))
			btn.mouse_entered.connect(func(): create_tween().tween_property(view, "scale", Vector2(1.06, 1.06), 0.1))
			btn.mouse_exited.connect(func(): create_tween().tween_property(view, "scale", Vector2.ONE, 0.1))
			btn.focus_entered.connect(func(): view.focused = true)
			btn.focus_exited.connect(func(): view.focused = false)
			holder.add_child(btn)
		grid.add_child(holder)
	add_child(UI.center_box(UI.button(cancel_text, func():
		main.close_overlay()
		if on_cancel.is_valid():
			on_cancel.call())))
	get_child(get_child_count() - 1).set_anchors_preset(Control.PRESET_TOP_LEFT)
	get_child(get_child_count() - 1).custom_minimum_size = Vector2(0, 70)
