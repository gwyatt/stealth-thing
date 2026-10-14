extends Control
## The act map, drawn on vellum. Bottom to top; the boss waits at the top.

var main
var peek := false
const ROW_H := 112.0
const NODE_NAMES := {"combat": "Monster", "elite": "Elite", "rest": "Campfire", "shop": "Merchant", "event": "Unknown", "treasure": "Treasure", "boss": "Boss"}
const NODE_ICON := {"combat": "swords", "elite": "skull_horned", "rest": "bonfire", "shop": "pouch", "event": "rune", "treasure": "chest", "boss": "crown"}
const NODE_TINT := {"combat": Color("a8987e"), "elite": Color("c0584a"), "rest": Color("e09040"), "shop": Color("c9a24a"), "event": Color("9fa6b8"), "treasure": Color("d6b47a"), "boss": Color("d04030")}

var _scroll: ScrollContainer
var _canvas: Control
var _first_available: Control = null

func _ready() -> void:
	var run := Session.run
	if not peek:
		var bar := TopBar.new().setup(main)
		add_child(bar)
	_scroll = ScrollContainer.new()
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	if peek:
		_scroll.custom_minimum_size = Vector2(900, 820)
	else:
		_scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
		_scroll.offset_top = 120
		_scroll.offset_bottom = -60
	add_child(_scroll)
	var holder := CenterContainer.new()
	holder.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll.add_child(holder)
	_canvas = Control.new()
	var h := (MapGen.ROWS + 1) * ROW_H + 160
	_canvas.custom_minimum_size = Vector2(900, h)
	_canvas.draw.connect(_draw_paths)
	holder.add_child(_canvas)

	var available := [] if peek else run.available_nodes()
	var visited := {}
	for p in run.data.path:
		visited["%d-%d" % [p.row, p.col]] = true
	var all_nodes: Array = []
	for row in run.data.map.rows:
		all_nodes.append_array(row)
	all_nodes.append(run.data.map.boss)
	for n in all_nodes:
		var is_avail := available.any(func(a): return a.row == n.row and a.col == n.col)
		var is_cur: bool = run.data.pos != null and run.data.pos.row == n.row and run.data.pos.col == n.col
		_canvas.add_child(_node_button(n, is_avail, visited.has("%d-%d" % [n.row, n.col]), is_cur))

	if not peek:
		var hint := UI.label("Choose your path.  %s awaits at its end." % EnemyDB.ENEMIES[EnemyDB.BOSS_OF_ACT[run.data.act]].name, 24, UI.MUTED, "italic", HORIZONTAL_ALIGNMENT_CENTER)
		hint.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
		hint.offset_top = -50
		add_child(hint)
	await get_tree().process_frame
	_scroll_to_current()
	if _first_available != null:
		_first_available.grab_focus()

func node_pos(n: Dictionary) -> Vector2:
	if n.type == "boss":
		return Vector2(450, 80)
	var j := sin(n.row * 12.9898 + n.col * 78.233) * 43758.5453
	j -= floor(j)
	var x: float = 70.0 + (n.col + 0.5) / MapGen.COLS * 760.0 + (j - 0.5) * 34.0
	var y: float = _canvas.custom_minimum_size.y - 70.0 - n.row * ROW_H + (fposmod(j * 7.0, 1.0) - 0.5) * 24.0
	return Vector2(x, y)

func _draw_paths() -> void:
	var run := Session.run
	var map: Dictionary = run.data.map
	var visited := {}
	for p in run.data.path:
		visited["%d-%d" % [p.row, p.col]] = true
	for row in map.rows:
		for n in row:
			var a := node_pos(n)
			var targets: Array = [map.boss] if n.row == MapGen.ROWS - 1 else n.next.map(func(c): return MapGen.find_node(map, n.row + 1, c))
			for t in targets:
				var b := node_pos(t)
				var walked: bool = visited.has("%d-%d" % [n.row, n.col]) and visited.has("%d-%d" % [t.row, t.col])
				if walked:
					_canvas.draw_line(a, b, Color(UI.EMBER, 0.9), 4.0, true)
				else:
					var steps := int(a.distance_to(b) / 14.0)
					for i in steps:
						if i % 2 == 0:
							var p0 := a.lerp(b, float(i) / steps)
							var p1 := a.lerp(b, float(i + 1) / steps)
							_canvas.draw_line(p0, p1, Color(0.66, 0.53, 0.35, 0.45), 3.0, true)

func _node_button(n: Dictionary, available: bool, visited: bool, current: bool) -> Control:
	var s := 124.0 if n.type == "boss" else 76.0
	var b := TextureButton.new()
	b.texture_normal = UI.tex("res://assets/art/ui/node_disc.png")
	b.ignore_texture_size = true
	b.stretch_mode = TextureButton.STRETCH_SCALE
	b.size = Vector2(s, s)
	b.position = node_pos(n) - Vector2(s, s) / 2
	b.pivot_offset = Vector2(s, s) / 2
	b.tooltip_text = NODE_NAMES[n.type]
	var tint: Color = NODE_TINT[n.type]
	if visited:
		tint = tint.darkened(0.55)
	var ic := UI.icon_rect(NODE_ICON[n.type], int(s * 0.62), tint)
	ic.position = Vector2(s * 0.19, s * 0.19)
	ic.size = Vector2(s * 0.62, s * 0.62)
	b.add_child(ic)
	if current:
		var ring := Panel.new()
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0, 0, 0, 0)
		sb.border_color = UI.EMBER
		sb.set_border_width_all(3)
		sb.set_corner_radius_all(int(s))
		sb.shadow_color = Color(UI.EMBER, 0.5)
		sb.shadow_size = 12
		ring.add_theme_stylebox_override("panel", sb)
		ring.position = Vector2(-5, -5)
		ring.size = Vector2(s + 10, s + 10)
		ring.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(ring)
	if available:
		b.focus_mode = Control.FOCUS_ALL
		var tw := b.create_tween().set_loops()
		tw.tween_property(b, "scale", Vector2(1.12, 1.12), 0.7).set_trans(Tween.TRANS_SINE)
		tw.tween_property(b, "scale", Vector2.ONE, 0.7).set_trans(Tween.TRANS_SINE)
		ic.modulate = tint.lightened(0.35)
		b.pressed.connect(func(): _enter(n))
		b.mouse_entered.connect(func(): Audio.play("hover", 0.1, -12.0))
		var fr := Panel.new()
		var fsb := StyleBoxFlat.new()
		fsb.bg_color = Color(0, 0, 0, 0)
		fsb.border_color = UI.EMBER_HI
		fsb.set_border_width_all(3)
		fsb.set_corner_radius_all(int(s))
		fr.add_theme_stylebox_override("panel", fsb)
		fr.position = Vector2(-6, -6)
		fr.size = Vector2(s + 12, s + 12)
		fr.mouse_filter = Control.MOUSE_FILTER_IGNORE
		fr.visible = false
		b.add_child(fr)
		b.focus_entered.connect(func(): fr.visible = true)
		b.focus_exited.connect(func(): fr.visible = false)
		if _first_available == null:
			_first_available = b
	else:
		b.focus_mode = Control.FOCUS_NONE
		b.disabled = not peek
	return b

func _enter(n: Dictionary) -> void:
	if Session.run.enter_node(n.row, n.col) == null:
		return
	Audio.play("step")
	main.route()

func _scroll_to_current() -> void:
	var target := _first_available
	if target == null:
		return
	_scroll.scroll_vertical = int(target.position.y - _scroll.size.y * 0.6)
