extends Node
## Root of the game. Owns the canvas layers, routes between screens based on the
## run state, and provides fades, banners, toasts and modal overlays.

const SCREENS := {
	"title": preload("res://scripts/ui/screens/title_screen.gd"),
	"map": preload("res://scripts/ui/screens/map_screen.gd"),
	"combat": preload("res://scripts/ui/screens/combat_screen.gd"),
	"reward": preload("res://scripts/ui/screens/reward_screen.gd"),
	"shop": preload("res://scripts/ui/screens/shop_screen.gd"),
	"rest": preload("res://scripts/ui/screens/rest_screen.gd"),
	"event": preload("res://scripts/ui/screens/event_screen.gd"),
	"treasure": preload("res://scripts/ui/screens/treasure_screen.gd"),
	"act_intro": preload("res://scripts/ui/screens/act_intro_screen.gd"),
	"game_over": preload("res://scripts/ui/screens/game_over_screen.gd"),
}
const ACT_SCENE := {1: "crypt", 2: "warrens", 3: "throne"}
const ACT_MUSIC := {1: "act1", 2: "act2", 3: "act3"}

var backdrop: Backdrop
var world: Node2D           # combat creatures live here (lit, with CanvasModulate)
var world_layer: CanvasLayer
var ui_root: Control
var overlay_root: Control
var fade: ColorRect
var screen: Control = null
var screen_name := ""
var overlays: Array[Control] = []
var _routing := false

func _ready() -> void:
	add_to_group("main")
	RenderingServer.set_default_clear_color(UI.BG)
	var bg := CanvasLayer.new()
	bg.layer = -10
	add_child(bg)
	backdrop = Backdrop.new()
	bg.add_child(backdrop)

	world_layer = CanvasLayer.new()
	world_layer.layer = 0
	add_child(world_layer)
	world = Node2D.new()
	world_layer.add_child(world)

	ui_root = _layer_root(5)
	ui_root.theme = UI.build_theme()

	var fx := CanvasLayer.new()
	fx.layer = 10
	add_child(fx)
	var post := ColorRect.new()
	post.set_anchors_preset(Control.PRESET_FULL_RECT)
	post.mouse_filter = Control.MOUSE_FILTER_IGNORE
	post.material = ShaderMaterial.new()
	post.material.shader = load("res://shaders/post.gdshader")
	fx.add_child(post)

	overlay_root = _layer_root(20)
	overlay_root.theme = UI.theme
	overlay_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fade = ColorRect.new()
	fade.color = Color(0, 0, 0, 1)
	fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var fade_layer := CanvasLayer.new()
	fade_layer.layer = 30
	add_child(fade_layer)
	fade_layer.add_child(fade)
	create_tween().tween_property(fade, "color:a", 0.0, 1.2)

	var tour := preload("res://scripts/ui/dev_tour.gd").new()
	tour.main = self
	add_child(tour)
	show_screen("title")

func _layer_root(layer: int) -> Control:
	var cl := CanvasLayer.new()
	cl.layer = layer
	add_child(cl)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	cl.add_child(root)
	return root

# ───────────── Routing ─────────────
## Pick the screen for the current run state.
func route() -> void:
	if _routing:
		return
	var run := Session.run
	if run == null:
		show_screen("title")
		return
	var room = run.data.room
	var act: int = run.data.act
	if room == null:
		show_screen("map")
		return
	match room.type:
		"blessing": show_screen("event")
		"combat": show_screen("combat")
		"reward": show_screen("reward")
		"shop": show_screen("shop")
		"rest": show_screen("rest")
		"event": show_screen("event")
		"treasure": show_screen("treasure")
		"act_intro": show_screen("act_intro")
		"game_over": show_screen("game_over")
		_: show_screen("map")

func show_screen(name: String) -> void:
	_routing = true
	if screen != null:
		create_tween().tween_property(fade, "color:a", 1.0, Settings.anim(0.22))
		await get_tree().create_timer(Settings.anim(0.24)).timeout
		screen.queue_free()
		for c in world.get_children():
			c.queue_free()
		close_all_overlays()
	screen_name = name
	_apply_atmosphere(name)
	screen = SCREENS[name].new()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.set("main", self)
	ui_root.add_child(screen)
	create_tween().tween_property(fade, "color:a", 0.0, Settings.anim(0.35))
	_routing = false
	Session.save()

func _apply_atmosphere(name: String) -> void:
	var run := Session.run
	var act: int = run.data.act if run != null else 1
	var act_scene: String = ACT_SCENE.get(act, "crypt")
	match name:
		"title":
			backdrop.set_scene("title", 0.0, 0.3)
			Audio.music("title")
			SteamService.set_rich_presence("At the threshold")
		"map":
			backdrop.set_scene("vellum", 0.0, 0.0)
			Audio.music(ACT_MUSIC[act])
			SteamService.set_rich_presence("Act %d — %s" % [act, EnemyDB.ACT_NAMES[act]])
		"combat":
			backdrop.set_scene(act_scene, 0.0, 0.4)
			var room = run.data.room
			Audio.music("boss" if room.kind == "boss" else ACT_MUSIC[act])
		"rest":
			backdrop.set_scene("campfire", 0.0, 0.2)
			Audio.music("campfire")
		_:
			backdrop.set_scene(act_scene, 0.55, 0.3)

# ───────────── Overlays ─────────────
## Show a modal overlay. `content` is centred over a dark scrim; clicking the scrim
## closes it when `dismissable`.
func open_overlay(content: Control, dismissable := true) -> Control:
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0)
	scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	overlay_root.add_child(scrim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	scrim.add_child(center)
	center.add_child(content)
	scrim.set_meta("dismissable", dismissable)
	scrim.gui_input.connect(func(ev):
		if dismissable and ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			close_overlay(scrim))
	create_tween().tween_property(scrim, "color:a", 0.78, 0.15)
	content.modulate.a = 0
	create_tween().tween_property(content, "modulate:a", 1.0, 0.18)
	overlays.append(scrim)
	_focus_first(content)
	return scrim

func close_overlay(scrim: Control = null) -> void:
	if overlays.is_empty():
		return
	if scrim == null:
		scrim = overlays.back()
	overlays.erase(scrim)
	scrim.queue_free()
	if overlays.is_empty() and screen != null and screen.has_method("on_overlay_closed"):
		screen.on_overlay_closed()

func close_all_overlays() -> void:
	for o in overlays:
		o.queue_free()
	overlays.clear()

func has_overlay() -> bool:
	return not overlays.is_empty()

func _focus_first(node: Node) -> void:
	await get_tree().process_frame
	if not is_instance_valid(node):
		return
	for c in node.find_children("*", "BaseButton", true, false):
		if c.is_visible_in_tree() and not c.disabled and c.focus_mode != Control.FOCUS_NONE:
			c.grab_focus()
			return

# ───────────── Feedback ─────────────
func toast(text: String) -> void:
	var l := UI.label(text, 24, UI.TEXT, "italic", HORIZONTAL_ALIGNMENT_CENTER)
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", UI.panel_style(Color(0, 0, 0, 0.85), UI.LINE, 1, 2))
	p.add_child(l)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay_root.add_child(p)
	p.reset_size()
	var vs := overlay_root.get_viewport_rect().size
	p.position = Vector2((vs.x - p.size.x) / 2, 150)
	p.modulate.a = 0
	var tw := create_tween()
	tw.tween_property(p, "modulate:a", 1.0, 0.15)
	tw.tween_interval(1.4)
	tw.tween_property(p, "modulate:a", 0.0, 0.3)
	tw.tween_callback(p.queue_free)

## Wide cinematic banner ("Foe Vanquished", boss names, "Extinguished").
func banner(text: String, kind := "victory", duration := 2.2) -> void:
	var vs := overlay_root.get_viewport_rect().size
	var band := TextureRect.new()
	var grad := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0, 0, 0, 0))
	g.add_point(0.2, Color(0, 0, 0, 0.85))
	g.add_point(0.8, Color(0, 0, 0, 0.85))
	g.set_color(g.get_point_count() - 1, Color(0, 0, 0, 0))
	grad.gradient = g
	grad.width = 256
	grad.height = 4
	band.texture = grad
	band.stretch_mode = TextureRect.STRETCH_SCALE
	band.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	band.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h := 190.0
	band.size = Vector2(vs.x, h)
	band.position = Vector2(0, vs.y * (0.2 if kind == "boss" else 0.38))
	var color: Color = {"victory": Color("e8cf8a"), "death": Color("9b1414"), "boss": Color("e9e1cf")}.get(kind, UI.TEXT)
	var size: int = {"victory": 76, "death": 120, "boss": 58}.get(kind, 64)
	var l := UI.label(text.to_upper(), size, color, "head", HORIZONTAL_ALIGNMENT_CENTER)
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.set_anchors_preset(Control.PRESET_FULL_RECT)
	l.add_theme_constant_override("outline_size", 10)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.7))
	band.add_child(l)
	overlay_root.add_child(band)
	band.modulate.a = 0
	var tw := create_tween()
	tw.tween_property(band, "modulate:a", 1.0, duration * 0.18)
	tw.parallel().tween_property(l, "theme_override_font_sizes/font_size", int(size * 1.04), duration)
	tw.tween_interval(duration * 0.55)
	tw.tween_property(band, "modulate:a", 0.0, duration * 0.27)
	tw.tween_callback(band.queue_free)

func shake(strength := 10.0, duration := 0.3) -> void:
	if not Settings.screen_shake:
		return
	var tw := create_tween()
	var steps := 8
	for i in steps:
		var off := Vector2(randf_range(-1, 1), randf_range(-1, 1)) * strength * (1.0 - float(i) / steps)
		tw.tween_property(world_layer, "offset", off, duration / steps)
	tw.tween_property(world_layer, "offset", Vector2.ZERO, 0.05)

# ───────────── Global input ─────────────
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("cancel") or event.is_action_pressed("pause"):
		if has_overlay():
			if overlays.back().get_meta("dismissable", true):
				close_overlay()
		elif screen_name != "title":
			if screen != null and screen.has_method("handle_cancel") and screen.handle_cancel():
				pass
			else:
				open_pause_menu()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("view_deck") and Session.run != null and screen_name != "title" and not has_overlay():
		open_deck()
		get_viewport().set_input_as_handled()

func open_pause_menu() -> void:
	var box := UI.vbox(14)
	box.add_child(UI.heading("Paused", 44))
	box.add_child(UI.button("Resume", func(): close_overlay()))
	box.add_child(UI.button("Settings", func(): open_settings()))
	box.add_child(UI.button("How to Play", func(): open_help()))
	box.add_child(UI.button("Save & Quit to Title", func():
		Session.save()
		close_all_overlays()
		Session.run = null
		show_screen("title")))
	box.add_child(UI.button("Abandon Run", func(): confirm("Abandon this run? It counts as a defeat.", func():
		close_all_overlays()
		Session.run.combat = null
		Session.run.end_run(false)
		route())))
	open_overlay(UI.panel(box, 480))

func confirm(text: String, on_yes: Callable) -> void:
	var box := UI.vbox(18)
	box.add_child(UI.heading("Are you sure?", 36))
	var l := UI.label(text, 24, UI.TEXT, "body", HORIZONTAL_ALIGNMENT_CENTER)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 420
	box.add_child(l)
	var row := UI.hbox(16)
	row.add_child(UI.button("Yes", func():
		close_overlay()
		on_yes.call(), 160))
	row.add_child(UI.button("No", func(): close_overlay(), 160))
	box.add_child(row)
	open_overlay(UI.panel(box, 520))

func open_settings() -> void:
	open_overlay(preload("res://scripts/ui/widgets/settings_panel.gd").new())

func open_help() -> void:
	open_overlay(preload("res://scripts/ui/widgets/help_panel.gd").new())

## Deck/pile viewer. With `on_pick`, cards are selectable and the overlay closes on pick.
func open_deck(cards = null, title := "", on_pick := Callable(), upgrade_preview := false, cancel_text := "Close", on_cancel := Callable()) -> void:
	var view := preload("res://scripts/ui/widgets/deck_view.gd").new()
	view.main = self
	view.setup(cards if cards != null else Session.run.data.deck, title if title != "" else "Deck (%d)" % Session.run.data.deck.size(), on_pick, upgrade_preview, cancel_text, on_cancel)
	open_overlay(view, not on_pick.is_valid() or not on_cancel.is_valid())
