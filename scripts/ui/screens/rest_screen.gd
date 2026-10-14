extends Control
## Campfire: rest or smith. The fire itself is lit live.

var main

func _ready() -> void:
	var run := Session.run
	add_child(TopBar.new().setup(main))
	_fire()
	var box := UI.vbox(16)
	var room = run.data.room
	box.add_child(UI.heading("Campfire", 44))
	if room.done:
		var msg := "You rest by the fire. Your wounds close." if room.get("result", "") == "rested" else "You temper a card in the flames."
		box.add_child(UI.label(msg, 26, UI.TEXT, "italic", HORIZONTAL_ALIGNMENT_CENTER))
		box.add_child(UI.center_box(UI.button("Continue", func():
			run.dismiss_room()
			main.route())))
	else:
		box.add_child(UI.label("Ash and old bones ring the fire. For a moment, the dark keeps its distance.", 24, UI.MUTED, "italic", HORIZONTAL_ALIGNMENT_CENTER))
		var row := UI.hbox(24)
		var rest := _choice("heart", "Rest", "Heal %d HP." % run.rest_heal_amount() if run.can_rest() else "The Hungry Lantern forbids it.", func():
			if run.rest():
				Audio.play("heal")
				main.route())
		rest.disabled = not run.can_rest()
		row.add_child(rest)
		var smith := _choice("mace", "Smith", "Upgrade a card.", func():
			main.open_deck(run.selectable_cards("upgrade"), "Upgrade a Card", func(uid):
				run.smith(uid)
				Audio.play("smith")
				main.route(), true, "Cancel"))
		smith.disabled = not run.has_upgradable()
		row.add_child(smith)
		box.add_child(row)
	var p := UI.panel(box, 720)
	p.position = Vector2(0, 0)
	var c := CenterContainer.new()
	c.set_anchors_preset(Control.PRESET_TOP_WIDE)
	c.offset_top = 150
	c.add_child(p)
	add_child(c)

func _choice(icon: String, title: String, desc: String, cb: Callable) -> Button:
	var b := Button.new()
	b.custom_minimum_size = Vector2(260, 200)
	var v := UI.vbox(8)
	v.set_anchors_preset(Control.PRESET_FULL_RECT)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(UI.center_box(UI.icon_rect(icon, 72, UI.BRONZE_HI)))
	v.get_child(0).set_anchors_preset(Control.PRESET_TOP_LEFT)
	v.get_child(0).custom_minimum_size = Vector2(260, 80)
	v.add_child(UI.label(title.to_upper(), 28, UI.TEXT, "head", HORIZONTAL_ALIGNMENT_CENTER))
	var d := UI.label(desc, 21, UI.MUTED, "body", HORIZONTAL_ALIGNMENT_CENTER)
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(d)
	b.add_child(v)
	b.pressed.connect(func():
		Audio.play("click")
		cb.call())
	return b

func _fire() -> void:
	var vs := get_viewport_rect().size
	var fire := CPUParticles2D.new()
	fire.position = Vector2(vs.x / 2, vs.y * 0.86)
	fire.amount = 90
	fire.lifetime = 1.1
	fire.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	fire.emission_rect_extents = Vector2(46, 6)
	fire.direction = Vector2(0, -1)
	fire.spread = 12
	fire.gravity = Vector2(0, -160)
	fire.initial_velocity_min = 40
	fire.initial_velocity_max = 110
	fire.scale_amount_min = 4
	fire.scale_amount_max = 11
	var g := Gradient.new()
	g.set_color(0, Color(1.0, 0.85, 0.5, 0.55))
	g.add_point(0.35, Color(1.0, 0.45, 0.1, 0.45))
	g.set_color(g.get_point_count() - 1, Color(0.5, 0.1, 0.02, 0.0))
	fire.color_ramp = g
	var sc := Curve.new()
	sc.add_point(Vector2(0, 0.6))
	sc.add_point(Vector2(0.3, 1.0))
	sc.add_point(Vector2(1, 0.1))
	fire.scale_amount_curve = sc
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	fire.material = mat
	fire.texture = main.backdrop.particles.texture
	add_child(fire)
	var sparks := fire.duplicate()
	sparks.amount = 40
	sparks.lifetime = 2.6
	sparks.scale_amount_min = 2
	sparks.scale_amount_max = 4
	sparks.spread = 30
	sparks.initial_velocity_max = 220
	sparks.scale_amount_curve = null
	add_child(sparks)
	move_child(fire, 0)
	move_child(sparks, 0)
