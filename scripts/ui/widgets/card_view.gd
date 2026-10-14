class_name CardView
extends Control
## A playing card: painted frame, engraved art, cost gem and rules text.

signal clicked(view: CardView)
signal hovered(view: CardView, inside: bool)

const SIZE := Vector2(220, 310)
const RARITY_BORDER := {"uncommon": Color("8fa0ae"), "rare": Color("e0b860")}

var inst: Dictionary
var stats: Dictionary
var combat = null
var playable := true
var selected := false:
	set(v):
		selected = v
		_refresh_state()
var focused := false:
	set(v):
		focused = v
		_refresh_state()

var _glow: Panel
var _text: RichTextLabel

func setup(card_inst: Dictionary, combat_ref = null, price := -1, cant_afford := false) -> CardView:
	inst = card_inst
	combat = combat_ref
	stats = CardDB.stats(inst)
	custom_minimum_size = SIZE
	size = SIZE
	pivot_offset = SIZE / 2
	mouse_filter = Control.MOUSE_FILTER_STOP
	_build(price, cant_afford)
	mouse_entered.connect(func(): hovered.emit(self, true))
	mouse_exited.connect(func(): hovered.emit(self, false))
	return self

func _build(price: int, cant_afford: bool) -> void:
	var s := stats
	var type_col: Color = UI.TYPE_COLOR.get(s.type, UI.TEXT)
	_glow = Panel.new()
	var gsb := StyleBoxFlat.new()
	gsb.bg_color = Color(0, 0, 0, 0)
	gsb.set_corner_radius_all(14)
	gsb.border_color = RARITY_BORDER.get(s.rarity, Color(0, 0, 0, 0))
	gsb.set_border_width_all(2 if RARITY_BORDER.has(s.rarity) else 0)
	gsb.shadow_color = Color(0, 0, 0, 0.75)
	gsb.shadow_size = 14
	gsb.shadow_offset = Vector2(0, 6)
	_glow.add_theme_stylebox_override("panel", gsb)
	_glow.position = Vector2(-1, -1)
	_glow.size = SIZE + Vector2(2, 2)
	_glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_glow)

	var frame := TextureRect.new()
	frame.texture = UI.tex("res://assets/art/ui/card_%s.png" % s.type)
	frame.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	frame.size = SIZE
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(frame)

	# Art: a soft halo plus the engraved emblem, tinted by card type.
	var halo := UI.icon_rect(s.get("art", "rune"), 120, Color(type_col, 0.22))
	halo.position = Vector2(50, 43)
	halo.size = Vector2(120, 120)
	add_child(halo)
	var art := UI.icon_rect(s.get("art", "rune"), 96, type_col.lerp(Color.WHITE, 0.15))
	art.position = Vector2(62, 55)
	art.size = Vector2(96, 96)
	add_child(art)

	var name_l := UI.label(s.name, 17, Color("9fd47a") if s.upgraded else Color("eadfca"), "head", HORIZONTAL_ALIGNMENT_CENTER)
	name_l.position = Vector2(22, 14)
	name_l.size = Vector2(176, 28)
	name_l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	name_l.add_theme_constant_override("outline_size", 4)
	name_l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	add_child(name_l)

	var type_l := UI.label(s.type.to_upper(), 11, Color(1, 1, 1, 0.8), "head", HORIZONTAL_ALIGNMENT_CENTER)
	type_l.position = Vector2(75, 160)
	type_l.size = Vector2(70, 18)
	type_l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	add_child(type_l)

	_text = UI.rich("", 16, HORIZONTAL_ALIGNMENT_CENTER)
	_text.fit_content = false
	_text.position = Vector2(26, 184)
	_text.size = Vector2(168, 104)
	_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	add_child(_text)
	refresh_text()

	if s.cost >= 0:
		var gem := TextureRect.new()
		gem.texture = UI.tex("res://assets/art/ui/cost_gem.png")
		gem.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		gem.position = Vector2(-14, -14)
		gem.size = Vector2(50, 50)
		gem.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(gem)
		var cl := UI.label(str(s.cost), 26, Color("fff2d6"), "head_bold", HORIZONTAL_ALIGNMENT_CENTER)
		cl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		cl.size = Vector2(50, 50)
		cl.add_theme_constant_override("outline_size", 6)
		cl.add_theme_color_override("font_outline_color", Color(0.25, 0.06, 0.02))
		gem.add_child(cl)
	if s.light_cost > 0:
		var lg := UI.icon_rect("lantern", 34, Color("ffd27a"))
		lg.position = Vector2(-8, 36)
		lg.size = Vector2(34, 34)
		add_child(lg)
		var ll := UI.label(str(s.light_cost), 18, Color.WHITE, "head_bold", HORIZONTAL_ALIGNMENT_CENTER)
		ll.position = Vector2(14, 54)
		ll.add_theme_constant_override("outline_size", 5)
		ll.add_theme_color_override("font_outline_color", Color.BLACK)
		add_child(ll)
	if price >= 0:
		var pr := UI.gold_row(price, 24, UI.BAD if cant_afford else UI.BRONZE_HI)
		pr.position = Vector2(70, SIZE.y + 6)
		pr.size = Vector2(80, 30)
		add_child(pr)
	tooltip_text = UI.keyword_tooltip(s)

func refresh_text() -> void:
	_text.text = UI.card_bbcode(stats, combat)

func set_playable(p: bool) -> void:
	playable = p
	modulate = Color(1, 1, 1) if p else Color(0.55, 0.52, 0.5)

func _refresh_state() -> void:
	if _glow == null:
		return
	var sb: StyleBoxFlat = _glow.get_theme_stylebox("panel")
	if selected or focused:
		sb.border_color = UI.EMBER_HI
		sb.set_border_width_all(3)
		sb.shadow_color = Color(0.9, 0.42, 0.12, 0.65)
		sb.shadow_size = 26
		sb.shadow_offset = Vector2.ZERO
	else:
		sb.border_color = RARITY_BORDER.get(stats.rarity, Color(0, 0, 0, 0))
		sb.set_border_width_all(2 if RARITY_BORDER.has(stats.rarity) else 0)
		sb.shadow_color = Color(0, 0, 0, 0.75)
		sb.shadow_size = 14
		sb.shadow_offset = Vector2(0, 6)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(self)
		accept_event()
