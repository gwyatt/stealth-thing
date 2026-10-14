class_name TopBar
extends PanelContainer
## HP, gold, potions, act/floor, relics and quick buttons.

var main
var combat = null
var _hp_label: Label
var _gold_row: HBoxContainer
var _potions: HBoxContainer
var _relics: HBoxContainer

func setup(main_ref, combat_ref = null) -> TopBar:
	main = main_ref
	combat = combat_ref
	set_anchors_preset(Control.PRESET_TOP_WIDE)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.025, 0.02, 0.92)
	sb.border_color = UI.LINE
	sb.border_width_bottom = 1
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	sb.shadow_color = Color(0, 0, 0, 0.6)
	sb.shadow_size = 12
	add_theme_stylebox_override("panel", sb)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 4)
	add_child(col)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 26)
	col.add_child(row)

	var hp := UI.hbox(8)
	hp.add_child(UI.icon_rect("heart", 30, UI.BLOOD.lightened(0.15)))
	_hp_label = UI.label("", 26, Color("e0a090"), "head")
	hp.add_child(_hp_label)
	hp.tooltip_text = "Hit Points"
	hp.mouse_filter = Control.MOUSE_FILTER_PASS
	row.add_child(hp)
	_gold_row = UI.hbox(8)
	row.add_child(_gold_row)
	_potions = UI.hbox(6)
	row.add_child(_potions)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(spacer)
	var d: Dictionary = Session.run.data
	var where := UI.label("Act %d  ·  %s  ·  Floor %d" % [d.act, EnemyDB.ACT_NAMES[d.act], d.floor], 20, UI.MUTED, "head")
	row.add_child(where)
	var spacer2 := Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(spacer2)

	row.add_child(_icon_button("cards", "Deck (D)", str(d.deck.size()), func(): main.open_deck()))
	if combat == null and d.room != null:
		row.add_child(_icon_button("map", "Map", "", func(): _peek_map()))
	row.add_child(_icon_button("gear", "Menu (Esc)", "", func(): main.open_pause_menu()))

	_relics = HBoxContainer.new()
	_relics.add_theme_constant_override("separation", 6)
	col.add_child(_relics)
	refresh()
	return self

func _icon_button(icon: String, tip: String, text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.icon = UI.icon(icon)
	b.expand_icon = true
	b.text = text
	b.tooltip_text = tip
	b.custom_minimum_size = Vector2(64 if text == "" else 92, 44)
	b.add_theme_constant_override("icon_max_width", 28)
	b.add_theme_color_override("icon_normal_color", UI.BRONZE)
	b.add_theme_color_override("icon_hover_color", UI.EMBER_HI)
	var sb := UI.panel_style(Color(0.08, 0.065, 0.05, 0.9), UI.LINE, 1, 3)
	sb.set_content_margin_all(6)
	b.add_theme_stylebox_override("normal", sb)
	b.pressed.connect(func():
		Audio.play("click")
		cb.call())
	return b

func _peek_map() -> void:
	var view := preload("res://scripts/ui/screens/map_screen.gd").new()
	view.peek = true
	view.main = main
	view.custom_minimum_size = Vector2(900, 900)
	var box := UI.vbox(10)
	box.add_child(view)
	box.add_child(UI.button("Close", func(): main.close_overlay()))
	main.open_overlay(UI.panel(box, 960))

func refresh() -> void:
	var d: Dictionary = Session.run.data
	var hp: int = combat.player.hp if combat != null else d.hp
	var max_hp: int = combat.player.max_hp if combat != null else d.max_hp
	_hp_label.text = "%d / %d" % [maxi(0, hp), max_hp]
	for c in _gold_row.get_children():
		c.queue_free()
	_gold_row.add_child(UI.gold_row(d.gold, 26))
	for c in _potions.get_children():
		c.queue_free()
	for i in d.potions.size():
		var p = d.potions[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(46, 46)
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0, 0, 0, 0.45)
		sb.border_color = UI.LINE if p != null else Color(UI.LINE, 0.15)
		sb.set_border_width_all(1)
		sb.set_corner_radius_all(23)
		b.add_theme_stylebox_override("normal", sb)
		b.add_theme_stylebox_override("hover", sb)
		b.add_theme_stylebox_override("pressed", sb)
		if p == null:
			b.disabled = true
			var empty := UI.icon_rect("flask", 30, Color(1, 1, 1, 0.12))
			empty.position = Vector2(8, 8)
			b.add_child(empty)
		else:
			var ic := UI.potion_icon(p, 34)
			ic.position = Vector2(6, 6)
			b.add_child(ic)
			b.tooltip_text = "%s\n%s" % [PotionDB.POTIONS[p].name, PotionDB.POTIONS[p].desc]
			var slot: int = i
			b.pressed.connect(func(): _potion_menu(slot))
		_potions.add_child(b)
	for c in _relics.get_children():
		c.queue_free()
	for id in d.relics:
		_relics.add_child(UI.relic_icon(id, 40))

func _potion_menu(slot: int) -> void:
	var id = Session.run.data.potions[slot]
	if id == null:
		return
	var def: Dictionary = PotionDB.POTIONS[id]
	var box := UI.vbox(16)
	box.add_child(UI.potion_icon(id, 96))
	box.add_child(UI.heading(def.name, 32))
	var desc := UI.label(def.desc, 24, UI.TEXT, "body", HORIZONTAL_ALIGNMENT_CENTER)
	box.add_child(desc)
	var row := UI.hbox(14)
	var usable: bool = (combat != null and combat.phase == "player" and PotionDB.can_use(id, combat)) or (combat == null and def.get("outside", false))
	if usable:
		row.add_child(UI.button("Drink", func():
			main.close_overlay()
			if combat != null:
				main.screen.use_potion(slot)
			else:
				Session.run.use_potion_outside(slot)
				Audio.play("heal")
				Session.save()
				refresh(), 160))
	else:
		desc.text += "\n(Can only be used in combat.)" if combat == null else ""
	row.add_child(UI.button("Discard", func():
		Session.run.discard_potion(slot)
		Session.save()
		main.close_overlay()
		refresh(), 160))
	row.add_child(UI.button("Cancel", func(): main.close_overlay(), 160))
	box.add_child(row)
	main.open_overlay(UI.panel(box, 560))
