extends PanelContainer
## Video, audio and gameplay settings.

func _ready() -> void:
	add_theme_stylebox_override("panel", UI.panel_style())
	custom_minimum_size = Vector2(640, 0)
	var box := UI.vbox(16)
	add_child(box)
	box.add_child(UI.heading("Settings", 40))
	box.add_child(_toggle("Fullscreen (F11)", Settings.fullscreen, func(v): Settings.fullscreen = v))
	box.add_child(_toggle("V-Sync", Settings.vsync, func(v): Settings.vsync = v))
	box.add_child(_slider("Master volume", Settings.master_volume, func(v): Settings.master_volume = v))
	box.add_child(_slider("Music volume", Settings.music_volume, func(v): Settings.music_volume = v))
	box.add_child(_slider("Effects volume", Settings.sfx_volume, func(v): Settings.sfx_volume = v))
	box.add_child(_toggle("Screen shake", Settings.screen_shake, func(v): Settings.screen_shake = v))
	box.add_child(_toggle("Fast animations", Settings.fast_animations, func(v): Settings.fast_animations = v))
	var close := UI.button("Done", func(): get_tree().get_first_node_in_group("main").close_overlay())
	box.add_child(UI.center_box(close))
	box.get_child(box.get_child_count() - 1).custom_minimum_size = Vector2(0, 70)

func _row(text: String, control: Control) -> HBoxContainer:
	var h := HBoxContainer.new()
	var l := UI.label(text, 24)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(l)
	h.add_child(control)
	return h

func _toggle(text: String, value: bool, setter: Callable) -> HBoxContainer:
	var c := CheckButton.new()
	c.button_pressed = value
	c.toggled.connect(func(v):
		setter.call(v)
		Settings.apply()
		Settings.save_settings())
	return _row(text, c)

func _slider(text: String, value: float, setter: Callable) -> HBoxContainer:
	var s := HSlider.new()
	s.min_value = 0
	s.max_value = 1
	s.step = 0.05
	s.value = value
	s.custom_minimum_size = Vector2(260, 30)
	s.value_changed.connect(func(v):
		setter.call(v)
		Settings.apply())
	s.drag_ended.connect(func(_c):
		Settings.save_settings()
		Audio.play("click"))
	return _row(text, s)
