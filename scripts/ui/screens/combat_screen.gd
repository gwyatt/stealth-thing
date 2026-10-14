extends Control
## Combat: a lit world of creatures plus the HUD, hand and targeting.

var main
var run: RunState
var c: Combat

var bar: TopBar
var views := {}        # uid -> CreatureView
var huds := {}         # uid -> Dictionary of HUD controls
var hand_root: Control
var card_views: Array[CardView] = []
var _seen_cards := {}
var selected_uid := ""
var potion_slot := -1
var target_index := 0
var focus_index := -1
var hover_uid := ""
var busy := false
var lantern: PointLight2D
var _lantern_base := 1.0
var _t := 0.0

var energy_label: Label
var light_label: Label
var light_pips: HBoxContainer
var pile_buttons := {}
var end_btn: Button
var hint: Label
var boss_bar: Control

const ACT_AMBIENT := {1: Color(0.92, 0.96, 1.0), 2: Color(0.9, 1.0, 0.94), 3: Color(1.0, 0.9, 0.84)}
const INTENT_ICON := {"attack": "sword", "defend": "shield", "buff": "arrow_up", "debuff": "spiral", "summon": "horn", "unknown": "rune"}
const INTENT_TINT := {"attack": Color("e0503a"), "defend": Color("8fa6b8"), "buff": Color("9fbf6a"), "debuff": Color("a87ac8"), "summon": Color("c8a86a"), "unknown": Color("9a9a9a")}
const BOSSES := ["drowned_king", "rot_colossus", "ember_tyrant"]

func _ready() -> void:
	run = Session.run
	c = run.combat if run.combat != null else run.start_combat()
	c.drain_events()
	mouse_filter = Control.MOUSE_FILTER_PASS
	_build_world()
	_build_hud()
	bar = TopBar.new().setup(main, c)
	add_child(bar)
	_layout_creatures()
	_rebuild_hand(true)
	_refresh_all()
	if c.is_boss:
		main.banner(c.enemies[0].name, "boss", 2.6)
		Audio.play("gong")
	get_viewport().size_changed.connect(func():
		_layout_creatures()
		_layout_hand())

# ───────────── World ─────────────
func _build_world() -> void:
	var world: Node2D = main.world
	var cm := CanvasModulate.new()
	cm.color = ACT_AMBIENT.get(run.data.act, Color(0.45, 0.45, 0.5))
	world.add_child(cm)
	var pv := CreatureView.new().setup("player", 1.12)
	pv.facing_left = false
	world.add_child(pv)
	views["player"] = pv
	lantern = PointLight2D.new()
	var g := GradientTexture2D.new()
	g.fill = GradientTexture2D.FILL_RADIAL
	g.fill_from = Vector2(0.5, 0.5)
	g.fill_to = Vector2(1.0, 0.5)
	var gr := Gradient.new()
	gr.set_color(0, Color(1, 1, 1, 1))
	gr.add_point(0.4, Color(1, 1, 1, 0.45))
	gr.set_color(gr.get_point_count() - 1, Color(1, 1, 1, 0))
	g.gradient = gr
	g.width = 512
	g.height = 512
	lantern.texture = g
	lantern.color = Color(1.0, 0.68, 0.36)
	lantern.texture_scale = 4.2
	lantern.height = 60.0
	world.add_child(lantern)
	# A cold or hellish fill light from the enemies' side.
	var fill := PointLight2D.new()
	fill.texture = g
	fill.texture_scale = 6.0
	fill.energy = 0.5
	fill.height = 120.0
	fill.color = {1: Color(0.55, 0.75, 0.95), 2: Color(0.5, 0.95, 0.75), 3: Color(1.0, 0.4, 0.15)}.get(run.data.act, Color.WHITE)
	fill.name = "Fill"
	world.add_child(fill)
	for e in c.enemies:
		if not e.dead:
			_add_enemy_view(e)

func _add_enemy_view(e: Dictionary) -> void:
	var def: Dictionary = EnemyDB.ENEMIES[e.id]
	var v := CreatureView.new().setup(e.id, def.get("size", 1.0))
	main.world.add_child(v)
	views[e.uid] = v
	_make_hud(e)

func _ground_y() -> float:
	return get_viewport_rect().size.y * 0.63

func _layout_creatures() -> void:
	var vs := get_viewport_rect().size
	var gy := _ground_y()
	views["player"].position = Vector2(vs.x * 0.2, gy)
	lantern.position = views["player"].position + Vector2(90, -150)
	var fill: PointLight2D = main.world.get_node("Fill")
	fill.position = Vector2(vs.x * 0.95, vs.y * 0.25)
	var alive := c.enemies.filter(func(e): return views.has(e.uid) and not e.dead)
	var n := alive.size()
	for i in n:
		var e: Dictionary = alive[i]
		var x := vs.x * 0.72 if n == 1 else lerpf(vs.x * 0.55, vs.x * 0.88, float(i) / (n - 1))
		views[e.uid].position = Vector2(x, gy)
	for uid in huds:
		_place_hud(uid)

# ───────────── HUD ─────────────
func _build_hud() -> void:
	var vs := get_viewport_rect().size
	var shade := TextureRect.new()
	var gt := GradientTexture2D.new()
	var gg := Gradient.new()
	gg.set_color(0, Color(0, 0, 0, 0))
	gg.set_color(1, Color(0, 0, 0, 0.92))
	gt.gradient = gg
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(0, 1)
	gt.width = 4
	gt.height = 64
	shade.texture = gt
	shade.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	shade.stretch_mode = TextureRect.STRETCH_SCALE
	shade.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	shade.offset_top = -380
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(shade)

	# Energy orb.
	var orb := TextureRect.new()
	orb.texture = UI.tex("res://assets/art/ui/cost_gem.png")
	orb.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	orb.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	orb.offset_left = 60
	orb.offset_top = -250
	orb.size = Vector2(130, 130)
	orb.tooltip_text = "Energy\nSpent to play cards. Refills each turn."
	add_child(orb)
	energy_label = UI.label("", 52, Color("fff2d6"), "head_bold", HORIZONTAL_ALIGNMENT_CENTER)
	energy_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	energy_label.size = Vector2(130, 130)
	energy_label.add_theme_constant_override("outline_size", 8)
	energy_label.add_theme_color_override("font_outline_color", Color(0.25, 0.06, 0.02))
	orb.add_child(energy_label)

	# Light meter.
	var lm := UI.vbox(4)
	lm.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	lm.offset_left = 40
	lm.offset_top = -110
	lm.size = Vector2(170, 70)
	lm.mouse_filter = Control.MOUSE_FILTER_STOP
	lm.tooltip_text = "Light\nPersists between turns. 1 Light wanes at the end of each turn. Max %d." % c.player.max_light
	var lrow := UI.hbox(8)
	lrow.add_child(UI.icon_rect("lantern", 36, Color("e0a64a")))
	light_label = UI.label("", 32, Color("ffe0a0"), "head")
	lrow.add_child(light_label)
	lm.add_child(lrow)
	light_pips = UI.hbox(3)
	lm.add_child(light_pips)
	add_child(lm)

	# Piles.
	var piles := [["draw", "cards", "Draw pile", Control.PRESET_BOTTOM_LEFT, 230], ["discard", "cards", "Discard pile", Control.PRESET_BOTTOM_RIGHT, -260], ["exhaust", "smoke", "Exhausted", Control.PRESET_BOTTOM_RIGHT, -140]]
	for p in piles:
		var b := Button.new()
		b.icon = UI.icon(p[1])
		b.expand_icon = true
		b.add_theme_constant_override("icon_max_width", 28)
		b.add_theme_color_override("icon_normal_color", UI.BRONZE)
		b.tooltip_text = p[2]
		b.set_anchors_preset(p[3])
		b.offset_left = p[4]
		b.offset_top = -80
		b.size = Vector2(110, 52)
		var pile: String = p[0]
		b.pressed.connect(func(): _view_pile(pile))
		add_child(b)
		pile_buttons[pile] = b

	end_btn = Button.new()
	end_btn.text = "END TURN"
	end_btn.add_theme_font_size_override("font_size", 28)
	end_btn.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	end_btn.offset_left = -300
	end_btn.offset_top = -200
	end_btn.size = Vector2(240, 84)
	var sb := UI.panel_style(Color(0.16, 0.07, 0.03, 0.95), UI.LINE_STRONG, 2, 4)
	sb.shadow_color = Color(UI.EMBER, 0.35)
	sb.shadow_size = 16
	end_btn.add_theme_stylebox_override("normal", sb)
	end_btn.pressed.connect(end_turn)
	add_child(end_btn)

	hand_root = Control.new()
	hand_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	hand_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hand_root)

	hint = UI.label("", 24, UI.TEXT, "italic", HORIZONTAL_ALIGNMENT_CENTER)
	hint.set_anchors_preset(Control.PRESET_TOP_WIDE)
	hint.offset_top = 210
	hint.add_theme_constant_override("outline_size", 6)
	hint.add_theme_color_override("font_outline_color", Color.BLACK)
	add_child(hint)

	if c.is_boss:
		boss_bar = Control.new()
		boss_bar.set_anchors_preset(Control.PRESET_CENTER_TOP)
		boss_bar.offset_left = -480
		boss_bar.offset_top = 140
		boss_bar.size = Vector2(960, 60)
		var bn := UI.label(c.enemies[0].name, 30, Color("e9e1cf"), "head")
		bn.add_theme_constant_override("outline_size", 6)
		bn.add_theme_color_override("font_outline_color", Color.BLACK)
		boss_bar.add_child(bn)
		var track := Panel.new()
		track.add_theme_stylebox_override("panel", UI.panel_style(Color(0, 0, 0, 0.8), Color(UI.LINE, 0.7), 1, 0))
		track.position = Vector2(0, 42)
		track.size = Vector2(960, 16)
		boss_bar.add_child(track)
		var fill := ColorRect.new()
		fill.name = "Fill"
		fill.color = Color("9e2418")
		fill.position = Vector2(1, 43)
		fill.size = Vector2(958, 14)
		boss_bar.add_child(fill)
		var blk := UI.label("", 22, Color("b8cce0"), "head")
		blk.name = "Block"
		blk.position = Vector2(860, 8)
		boss_bar.add_child(blk)
		add_child(boss_bar)

func _make_hud(cr: Dictionary) -> void:
	var uid: String = cr.uid
	var h := {}
	var hit := Control.new()
	hit.mouse_filter = Control.MOUSE_FILTER_STOP
	hit.mouse_entered.connect(func(): _hover_creature(uid, true))
	hit.mouse_exited.connect(func(): _hover_creature(uid, false))
	hit.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			_click_creature(uid))
	add_child(hit)
	move_child(hit, 0)
	h.hit = hit
	var name_l := UI.label(cr.name, 22, Color("e3d9c4"), "head", HORIZONTAL_ALIGNMENT_CENTER)
	name_l.add_theme_constant_override("outline_size", 6)
	name_l.add_theme_color_override("font_outline_color", Color.BLACK)
	add_child(name_l)
	h.name = name_l
	var hp := Control.new()
	hp.size = Vector2(190, 22)
	hp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var back := Panel.new()
	back.add_theme_stylebox_override("panel", UI.panel_style(Color(0, 0, 0, 0.8), Color(UI.LINE, 0.6), 1, 2))
	back.size = hp.size
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp.add_child(back)
	var fill := ColorRect.new()
	fill.color = Color("9e2418")
	fill.position = Vector2(2, 2)
	fill.size = hp.size - Vector2(4, 4)
	fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp.add_child(fill)
	var txt := UI.label("", 17, Color.WHITE, "head", HORIZONTAL_ALIGNMENT_CENTER)
	txt.size = hp.size
	txt.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	txt.add_theme_constant_override("outline_size", 5)
	txt.add_theme_color_override("font_outline_color", Color.BLACK)
	hp.add_child(txt)
	add_child(hp)
	h.hp = hp
	h.fill = fill
	h.hp_text = txt
	var statuses := HFlowContainer.new()
	statuses.custom_minimum_size = Vector2(230, 0)
	statuses.size = Vector2(230, 34)
	statuses.alignment = FlowContainer.ALIGNMENT_CENTER
	add_child(statuses)
	h.statuses = statuses
	if not cr.is_player:
		var intent := UI.hbox(4)
		intent.mouse_filter = Control.MOUSE_FILTER_STOP
		add_child(intent)
		h.intent = intent
	if cr.has("id") and BOSSES.has(cr.id):
		hp.visible = false
	huds[uid] = h

func _place_hud(uid: String) -> void:
	if not views.has(uid):
		return
	var v: CreatureView = views[uid]
	var h: Dictionary = huds[uid]
	var p := v.position
	var w := maxf(v.width(), 120.0)
	var ht := v.height()
	h.hit.position = Vector2(p.x - w / 2, p.y - ht)
	h.hit.size = Vector2(w, ht)
	h.name.size = Vector2(320, 30)
	h.name.position = Vector2(p.x - 160, p.y + 6)
	h.hp.position = Vector2(p.x - 95, p.y + 38)
	h.statuses.position = Vector2(p.x - 115, p.y + 66)
	if h.has("intent"):
		h.intent.reset_size()
		h.intent.position = Vector2(p.x - h.intent.size.x / 2, maxf(p.y - ht - 56, 215.0 if boss_bar != null else 130.0))

func _refresh_hud(cr: Dictionary) -> void:
	var uid: String = cr.uid
	if not huds.has(uid):
		return
	var h: Dictionary = huds[uid]
	var pct := clampf(float(cr.hp) / cr.max_hp, 0, 1)
	h.fill.size.x = (h.hp.size.x - 4) * pct
	h.fill.color = Color("4f6478") if cr.block > 0 else Color("9e2418")
	h.hp_text.text = ("[%d]  " % cr.block if cr.block > 0 else "") + "%d / %d" % [maxi(0, cr.hp), cr.max_hp]
	for ch in h.statuses.get_children():
		ch.queue_free()
	for k in cr.statuses:
		var n: int = cr.statuses[k]
		if n == 0:
			continue
		var info := StatusDB.info(k)
		var cell := UI.hbox(2)
		cell.mouse_filter = Control.MOUSE_FILTER_STOP
		var debuff: bool = info.kind == "debuff" or n < 0
		var col: Color = Color("ff8a3c") if k == "burn" else (Color("c88aa8") if debuff else Color("b8c890"))
		cell.add_child(UI.icon_rect(info.icon, 28, col))
		if k != "rebirth":
			cell.add_child(UI.label(str(n), 18, col, "head"))
		cell.tooltip_text = "%s\n%s" % [info.name, StatusDB.describe(k, n)]
		h.statuses.add_child(cell)
	if h.has("intent"):
		for ch in h.intent.get_children():
			ch.queue_free()
		if not cr.dead:
			var info := c.intent_info(cr)
			if not info.is_empty():
				var parts: PackedStringArray = String(info.type).split("_")
				var main_t: String = parts[0]
				h.intent.add_child(UI.icon_rect(INTENT_ICON.get(main_t, "rune"), 40, INTENT_TINT.get(main_t, Color.WHITE)))
				if info.has("dmg"):
					var dl := UI.label("%d%s" % [info.dmg, "×%d" % info.hits if info.hits > 1 else ""], 30, Color("f6e6cc"), "head_bold")
					dl.add_theme_constant_override("outline_size", 6)
					dl.add_theme_color_override("font_outline_color", Color.BLACK)
					h.intent.add_child(dl)
				if parts.size() > 1:
					h.intent.add_child(UI.icon_rect(INTENT_ICON.get(parts[1], "rune"), 28, INTENT_TINT.get(parts[1], Color.WHITE)))
				h.intent.tooltip_text = "%s\n%s" % [info.name, _intent_desc(info)]
	_place_hud(uid)

func _intent_desc(info: Dictionary) -> String:
	var d: String = {"attack": "Intends to attack", "attack_debuff": "Intends to attack and inflict a curse", "attack_defend": "Intends to attack and defend",
		"attack_buff": "Intends to attack and grow stronger", "defend": "Intends to Block", "defend_buff": "Intends to Block and grow stronger",
		"buff": "Intends to grow stronger", "debuff": "Intends to inflict a curse", "buff_debuff": "Intends to grow stronger and curse you",
		"summon": "Intends to call for aid", "unknown": "Its intent is unclear"}.get(info.type, "")
	if info.has("dmg"):
		d += " for %d%s damage" % [info.dmg, " × %d" % info.hits if info.hits > 1 else ""]
	return d + "."

func _refresh_all() -> void:
	_refresh_hud(c.player)
	for e in c.enemies:
		_refresh_hud(e)
	energy_label.text = str(c.player.energy)
	light_label.text = "%d" % c.player.light
	for ch in light_pips.get_children():
		ch.queue_free()
	for i in c.player.max_light:
		var pip := ColorRect.new()
		pip.custom_minimum_size = Vector2(11, 16)
		pip.color = Color("ffc860") if i < c.player.light else Color(0.15, 0.11, 0.08)
		pip.mouse_filter = Control.MOUSE_FILTER_IGNORE
		light_pips.add_child(pip)
	pile_buttons.draw.text = str(c.draw_pile.size())
	pile_buttons.discard.text = str(c.discard_pile.size())
	pile_buttons.exhaust.text = str(c.exhaust_pile.size())
	end_btn.disabled = busy or c.phase != "player"
	end_btn.text = "END TURN" if c.phase == "player" else "ENEMY TURN"
	_lantern_base = 0.7 + c.player.light / float(c.player.max_light) * 1.1
	if boss_bar != null:
		var boss = null
		for e in c.enemies:
			if BOSSES.has(e.id) and not e.dead:
				boss = e
		if boss != null:
			var fill: ColorRect = boss_bar.get_node("Fill")
			create_tween().tween_property(fill, "size:x", 958.0 * clampf(float(boss.hp) / boss.max_hp, 0, 1), 0.4)
			(boss_bar.get_node("Block") as Label).text = "Block %d" % boss.block if boss.block > 0 else ""
		else:
			boss_bar.visible = false
	bar.refresh()
	for cv in card_views:
		cv.set_playable(c.can_play(cv.inst).ok and not busy)
		cv.refresh_text()
	if c.player.light >= c.player.max_light:
		SteamService.unlock("LIGHTBRINGER")
	for e in c.alive():
		if e.statuses.get("burn", 0) >= 30:
			SteamService.unlock("PYROMANIAC")
	_update_hint()

func _update_hint() -> void:
	if selected_uid != "" or potion_slot >= 0:
		hint.text = "Choose a target  ·  ←/→ and Enter, or click  ·  Esc to cancel"
	else:
		hint.text = ""

# ───────────── Hand ─────────────
func _rebuild_hand(initial := false) -> void:
	for cv in card_views:
		cv.queue_free()
	card_views.clear()
	for inst in c.hand:
		var cv := CardView.new().setup(inst, c)
		cv.clicked.connect(_click_card)
		cv.hovered.connect(_hover_card)
		hand_root.add_child(cv)
		card_views.append(cv)
		if not _seen_cards.has(inst.uid):
			cv.position = Vector2(-200, get_viewport_rect().size.y)
			cv.modulate.a = 0.0
	_layout_hand(true)
	for inst in c.hand:
		_seen_cards[inst.uid] = true
	focus_index = clampi(focus_index, -1, card_views.size() - 1)

func _hand_slot(i: int, n: int) -> Dictionary:
	var vs := get_viewport_rect().size
	var spacing := minf(170.0, 1050.0 / maxf(1, n))
	var mid := (n - 1) / 2.0
	var x := vs.x / 2 + (i - mid) * spacing - CardView.SIZE.x / 2
	var y := vs.y - CardView.SIZE.y - 20 + absf(i - mid) ** 1.6 * 4.0
	return {"pos": Vector2(x, y), "rot": deg_to_rad((i - mid) * minf(4.0, 26.0 / maxf(1, n)))}

func _layout_hand(stagger := false) -> void:
	var n := card_views.size()
	for i in n:
		var cv := card_views[i]
		var slot := _hand_slot(i, n)
		var raised: bool = cv.inst.uid == selected_uid or i == focus_index or cv.inst.uid == hover_uid
		var pos: Vector2 = slot.pos
		var rot: float = slot.rot
		var sc := Vector2.ONE
		if raised:
			pos.y -= 90
			rot = 0.0
			sc = Vector2(1.18, 1.18)
		cv.z_index = 50 if raised else i
		var tw := cv.create_tween().set_parallel(true).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		var delay := i * 0.05 if stagger else 0.0
		tw.tween_property(cv, "position", pos, Settings.anim(0.25)).set_delay(delay)
		tw.tween_property(cv, "rotation", rot, Settings.anim(0.2)).set_delay(delay)
		tw.tween_property(cv, "scale", sc, Settings.anim(0.15)).set_delay(delay)
		tw.tween_property(cv, "modulate:a", 1.0, Settings.anim(0.2)).set_delay(delay)
		cv.selected = cv.inst.uid == selected_uid
		cv.focused = i == focus_index and selected_uid == ""

func _hover_card(cv: CardView, inside: bool) -> void:
	if busy:
		return
	hover_uid = cv.inst.uid if inside else ("" if hover_uid == cv.inst.uid else hover_uid)
	if inside:
		Audio.play("hover", 0.15, -16.0)
	_layout_hand()

func _click_card(cv: CardView) -> void:
	if busy or c.over:
		return
	var uid: String = cv.inst.uid
	if selected_uid == uid:
		_cancel_target()
		return
	var check := c.can_play(cv.inst)
	if not check.ok:
		Audio.play("error")
		main.toast(check.reason)
		var tw := cv.create_tween()
		tw.tween_property(cv, "position:x", cv.position.x - 10, 0.05)
		tw.tween_property(cv, "position:x", cv.position.x + 10, 0.08)
		tw.tween_property(cv, "position:x", cv.position.x, 0.05)
		return
	potion_slot = -1
	if c.needs_target(cv.inst):
		selected_uid = uid
		target_index = clampi(target_index, 0, c.alive().size() - 1)
		Audio.play("select")
		_highlight_target()
		_layout_hand()
		_update_hint()
		return
	_play(uid, "")

func _cancel_target() -> void:
	selected_uid = ""
	potion_slot = -1
	_highlight_target()
	_layout_hand()
	_update_hint()

func handle_cancel() -> bool:
	if selected_uid != "" or potion_slot >= 0:
		_cancel_target()
		return true
	return false

func _hover_creature(uid: String, inside: bool) -> void:
	if (selected_uid != "" or potion_slot >= 0) and uid != "player":
		var alive := c.alive()
		for i in alive.size():
			if alive[i].uid == uid and inside:
				target_index = i
		_highlight_target()

func _highlight_target() -> void:
	var targeting := selected_uid != "" or potion_slot >= 0
	var alive := c.alive()
	for e in c.enemies:
		if views.has(e.uid):
			views[e.uid].set_highlight(targeting and not alive.is_empty() and alive[clampi(target_index, 0, alive.size() - 1)].uid == e.uid)

func _click_creature(uid: String) -> void:
	if busy or uid == "player":
		return
	if selected_uid != "":
		var card := selected_uid
		selected_uid = ""
		_play(card, uid)
	elif potion_slot >= 0:
		var slot := potion_slot
		potion_slot = -1
		_use_potion_on(slot, uid)

# ───────────── Actions ─────────────
func _play(uid: String, target_uid: String) -> void:
	var cv: CardView = null
	for v in card_views:
		if v.inst.uid == uid:
			cv = v
	var res := c.play_card(uid, target_uid)
	if not res.ok:
		Audio.play("error")
		main.toast(res.reason)
		return
	selected_uid = ""
	_highlight_target()
	if cv != null:
		card_views.erase(cv)
		var vs := get_viewport_rect().size
		var tw := cv.create_tween().set_parallel(true)
		tw.tween_property(cv, "position", Vector2(vs.x / 2 - CardView.SIZE.x / 2, vs.y * 0.36), Settings.anim(0.18))
		tw.tween_property(cv, "rotation", 0.0, Settings.anim(0.18))
		tw.tween_property(cv, "scale", Vector2(1.1, 1.1), Settings.anim(0.18))
		tw.chain().tween_property(cv, "modulate:a", 0.0, Settings.anim(0.22))
		tw.chain().tween_callback(cv.queue_free)
	await _process_events()
	_after_action()

func use_potion(slot: int) -> void:
	if busy:
		return
	var id = run.data.potions[slot]
	if id == null:
		return
	if PotionDB.needs_target(id) and c.alive().size() > 1:
		selected_uid = ""
		potion_slot = slot
		_highlight_target()
		_update_hint()
		return
	_use_potion_on(slot, "")

func _use_potion_on(slot: int, target_uid: String) -> void:
	var res := c.use_potion(slot, target_uid)
	if not res.ok:
		main.toast(res.reason)
		return
	Audio.play("potion")
	_highlight_target()
	await _process_events()
	_after_action()

func _after_action() -> void:
	focus_index = mini(focus_index, c.hand.size() - 1)
	_rebuild_hand()
	_refresh_all()
	if c.over:
		_end_combat()

func end_turn() -> void:
	if busy or c.phase != "player" or c.over:
		return
	busy = true
	selected_uid = ""
	potion_slot = -1
	focus_index = -1
	Audio.play("end_turn")
	c.end_player_turn()
	for cv in card_views:
		var tw := cv.create_tween().set_parallel(true)
		tw.tween_property(cv, "position", Vector2(get_viewport_rect().size.x + 100, cv.position.y + 120), Settings.anim(0.3))
		tw.tween_property(cv, "modulate:a", 0.0, Settings.anim(0.3))
	await _process_events()
	_refresh_all()
	if c.over:
		_end_combat()
		return
	await get_tree().create_timer(Settings.anim(0.35)).timeout
	c.begin_enemy_phase()
	_refresh_all()
	for e in c.alive():
		if c.over or e.dead:
			continue
		var info := c.intent_info(e)
		if views.has(e.uid) and String(info.get("type", "")).begins_with("attack"):
			views[e.uid].lunge()
			await get_tree().create_timer(Settings.anim(0.12)).timeout
		c.enemy_act(e)
		await _process_events()
		_refresh_all()
		await get_tree().create_timer(Settings.anim(0.45)).timeout
		if c.over:
			break
	if not c.over:
		c.finish_enemy_phase()
		Audio.play("turn")
	busy = false
	await _process_events()
	_rebuild_hand(true)
	_refresh_all()
	if c.over:
		_end_combat()

func _end_combat() -> void:
	busy = true
	_refresh_all()
	if c.won:
		Audio.play("victory")
		main.banner("Great Foe Felled" if c.is_boss else ("Foe Vanquished" if c.is_elite else "Victory"), "victory", 2.0)
		SteamService.unlock("FIRST_BLOOD")
		if c.is_elite:
			SteamService.unlock("WARDEN_FALLS")
		for e in c.enemies:
			match e.id:
				"drowned_king": SteamService.unlock("KING_DROWNED")
				"rot_colossus": SteamService.unlock("ROT_PURGED")
		await get_tree().create_timer(Settings.anim(2.0)).timeout
	elif c.escaped:
		await get_tree().create_timer(0.3).timeout
	else:
		Audio.play("death")
		main.banner("Extinguished", "death", 3.4)
		await get_tree().create_timer(3.2).timeout
	run.finish_combat()
	main.route()

# ───────────── Event playback ─────────────
func _pos_of(uid: String) -> Vector2:
	if views.has(uid):
		var v: CreatureView = views[uid]
		return v.position - Vector2(0, v.height() * 0.6)
	return get_viewport_rect().size / 2

func _process_events() -> void:
	var events := c.drain_events()
	var delay := 0.0
	var played := {}
	for ev in events:
		var uid: String = ev.get("target", "")
		match ev.type:
			"damage":
				var amt: int = ev.amount
				if amt > 0:
					_floater(uid, "-%d" % amt, Color("ff5a44"), 54 if amt >= 15 else 44, delay)
					if views.has(uid):
						views[uid].flash_hit(1.0 if amt >= 10 else 0.6)
					if uid == "player":
						main.shake(8.0 + minf(amt, 30) * 0.5, 0.3)
					elif amt >= 15:
						main.shake(6.0, 0.2)
					_sound_once(played, "hit_big" if amt >= 15 else ("hit" if ev.attack else "burn"))
				else:
					_floater(uid, "Blocked", Color("9fb4c8"), 28, delay)
					_sound_once(played, "block")
				delay += 0.06
			"block":
				_floater(uid, "+%d Block" % ev.amount, Color("a8c0d8"), 28, delay)
				_sound_once(played, "block")
			"heal":
				if ev.amount > 0:
					_floater(uid, "+%d" % ev.amount, UI.GOOD, 38, delay)
					_sound_once(played, "heal")
			"light":
				if ev.amount > 0:
					_floater("player", "+%d Light" % ev.amount, Color("ffd98a"), 28, delay)
					_sound_once(played, "light")
			"status":
				if ev.amount > 0 and ev.key != "ritual":
					var info := StatusDB.info(ev.key)
					var debuff: bool = info.kind == "debuff"
					_floater(uid, ("▼ " if debuff else "▲ ") + info.name, Color("c8a0d8") if debuff else Color("c8d8a0"), 24, delay)
					_sound_once(played, "debuff" if debuff else "buff")
					delay += 0.04
			"death":
				if views.has(uid):
					views[uid].die()
					var h: Dictionary = huds.get(uid, {})
					for k in h:
						var ctl: Control = h[k] if h[k] is Control else null
						if ctl != null:
							ctl.create_tween().tween_property(ctl, "modulate:a", 0.0, 0.5)
					_sound_once(played, "death")
			"revive":
				if views.has(uid):
					views[uid].revive()
				_floater(uid, "Reborn", Color("ffcf7a"), 34, delay)
				_sound_once(played, "revive")
			"summon":
				var e = c.find_enemy(ev.uid)
				if e != null:
					_add_enemy_view(e)
					_layout_creatures()
					_refresh_hud(e)
				_sound_once(played, "summon")
			"enemy_move":
				_floater(ev.uid, ev.name, Color("e9e1cf"), 26, 0.0, -1.35)
			"card_played":
				_sound_once(played, "card")
			"cards_added":
				main.toast("%d %s added to your %s pile." % [ev.n, CardDB.CARDS[ev.id].name, ev.pile])
			"potion":
				_sound_once(played, "potion")
	_refresh_all()
	if delay > 0.0 or not events.is_empty():
		await get_tree().create_timer(Settings.anim(0.15 + minf(delay, 0.6))).timeout

func _sound_once(played: Dictionary, name: String) -> void:
	if not played.has(name):
		played[name] = true
		Audio.play(name)

func _floater(uid: String, text: String, color: Color, size: int, delay: float, height_mult := 1.0) -> void:
	var l := UI.label(text, size, color, "head_bold", HORIZONTAL_ALIGNMENT_CENTER)
	l.add_theme_constant_override("outline_size", 8)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	l.size = Vector2(360, 70)
	var p := _pos_of(uid)
	if height_mult != 1.0 and views.has(uid):
		p = views[uid].position - Vector2(0, views[uid].height() * height_mult)
	l.position = p - Vector2(180, 35) + Vector2(randf_range(-30, 30), 0)
	l.modulate.a = 0
	l.z_index = 100
	add_child(l)
	var tw := l.create_tween()
	tw.tween_interval(delay)
	tw.tween_property(l, "modulate:a", 1.0, 0.08)
	tw.parallel().tween_property(l, "position:y", l.position.y - 80, 1.0).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "modulate:a", 0.0, 0.35)
	tw.tween_callback(l.queue_free)

func _view_pile(pile: String) -> void:
	var cards: Array = {"draw": c.draw_pile, "discard": c.discard_pile, "exhaust": c.exhaust_pile}[pile]
	var names := {"draw": "Draw Pile (shown in no particular order)", "discard": "Discard Pile", "exhaust": "Exhausted"}
	main.open_deck(cards, names[pile])

# ───────────── Per-frame & input ─────────────
func _process(delta: float) -> void:
	_t += delta
	if lantern != null:
		var flicker := sin(_t * 9.0) * 0.06 + sin(_t * 23.0) * 0.04 + randf_range(-0.03, 0.03)
		lantern.energy = _lantern_base + flicker

func _unhandled_input(event: InputEvent) -> void:
	if main.has_overlay() or c.over:
		return
	if event.is_action_pressed("end_turn"):
		end_turn()
	elif event.is_action_pressed("potion"):
		var slot: int = run.data.potions.find(func(p): return p != null) if false else -1
		for i in run.data.potions.size():
			if run.data.potions[i] != null:
				slot = i
				break
		if slot >= 0:
			bar._potion_menu(slot)
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode >= KEY_1 and event.keycode <= KEY_9:
		var i: int = event.keycode - KEY_1
		if selected_uid != "" or potion_slot >= 0:
			var alive := c.alive()
			if i < alive.size():
				_click_creature(alive[i].uid)
		elif i < card_views.size():
			focus_index = i
			_click_card(card_views[i])
	elif event.is_action_pressed("nav_left") or event.is_action_pressed("nav_right"):
		var d := -1 if event.is_action_pressed("nav_left") else 1
		if selected_uid != "" or potion_slot >= 0:
			var n := c.alive().size()
			target_index = wrapi(target_index + d, 0, n)
			_highlight_target()
		elif not card_views.is_empty():
			focus_index = wrapi(focus_index + d, 0, card_views.size()) if focus_index >= 0 else 0
			Audio.play("hover", 0.15, -14.0)
			_layout_hand()
	elif event.is_action_pressed("confirm"):
		if selected_uid != "" or potion_slot >= 0:
			var alive := c.alive()
			if not alive.is_empty():
				_click_creature(alive[clampi(target_index, 0, alive.size() - 1)].uid)
		elif focus_index >= 0 and focus_index < card_views.size():
			_click_card(card_views[focus_index])
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_RIGHT:
		_cancel_target()
	else:
		return
	get_viewport().set_input_as_handled()
