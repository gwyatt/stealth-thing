class_name UI
## Shared look & feel: palette, fonts, theme, and small widget helpers.

const BG := Color("080706")
const PANEL := Color(0.05, 0.04, 0.035, 0.9)
const LINE := Color(0.66, 0.53, 0.35, 0.4)
const LINE_STRONG := Color(0.84, 0.7, 0.48, 0.75)
const TEXT := Color("d9cfbd")
const MUTED := Color("8a7f6e")
const BRONZE := Color("a8875a")
const BRONZE_HI := Color("d6b47a")
const EMBER := Color("d9662a")
const EMBER_HI := Color("ffb35c")
const BLOOD := Color("a3281a")
const GOOD := Color("9fd47a")
const BAD := Color("e07a6a")
const STEEL := Color("8fa6b8")
const VIOLET := Color("a87ac8")
const GOLD := Color("c9a24a")

const TYPE_COLOR := {"attack": Color("c9775a"), "skill": Color("8fa6b8"), "power": Color("d6b45a"), "status": Color("8a8478"), "curse": Color("9a7ab8")}

static var _fonts := {}
static var _tex := {}
static var theme: Theme

static func font(kind: String) -> Font:
	if _fonts.has(kind):
		return _fonts[kind]
	var path: String = {
		"head": "res://assets/fonts/cinzel-latin-400-normal.woff2",
		"head_bold": "res://assets/fonts/cinzel-latin-700-normal.woff2",
		"body": "res://assets/fonts/eb-garamond-latin-400-normal.woff2",
		"body_bold": "res://assets/fonts/eb-garamond-latin-600-normal.woff2",
		"italic": "res://assets/fonts/eb-garamond-latin-400-italic.woff2",
	}[kind]
	var f: Font = load(path)
	_fonts[kind] = f
	return f

static func tex(path: String) -> Texture2D:
	if not _tex.has(path):
		_tex[path] = load(path) if ResourceLoader.exists(path) else null
	return _tex[path]

static func icon(name: String) -> Texture2D:
	var t := tex("res://assets/art/icons/%s.png" % name)
	return t if t != null else tex("res://assets/art/icons/rune.png")

static func panel_style(fill := PANEL, border := LINE, width := 1, radius := 3) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = fill
	sb.border_color = border
	sb.set_border_width_all(width)
	sb.set_corner_radius_all(radius)
	sb.shadow_color = Color(0, 0, 0, 0.6)
	sb.shadow_size = 10
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	return sb

static func build_theme() -> Theme:
	if theme != null:
		return theme
	var t := Theme.new()
	t.default_font = font("body")
	t.default_font_size = 24
	t.set_color("font_color", "Label", TEXT)
	t.set_color("default_color", "RichTextLabel", TEXT)
	t.set_font("normal_font", "RichTextLabel", font("body"))
	t.set_font("bold_font", "RichTextLabel", font("body_bold"))
	t.set_font("italics_font", "RichTextLabel", font("italic"))
	t.set_font_size("normal_font_size", "RichTextLabel", 24)
	t.set_font_size("bold_font_size", "RichTextLabel", 24)
	t.set_font_size("italics_font_size", "RichTextLabel", 24)

	var normal := panel_style(Color(0.09, 0.075, 0.06, 0.95), LINE, 1, 3)
	normal.content_margin_left = 26
	normal.content_margin_right = 26
	normal.content_margin_top = 10
	normal.content_margin_bottom = 10
	normal.shadow_size = 4
	var hover := normal.duplicate()
	hover.border_color = LINE_STRONG
	hover.bg_color = Color(0.13, 0.09, 0.06, 0.97)
	hover.shadow_color = Color(0.85, 0.4, 0.16, 0.25)
	hover.shadow_size = 12
	var pressed := hover.duplicate()
	pressed.bg_color = Color(0.06, 0.05, 0.04, 1)
	var disabled := normal.duplicate()
	disabled.bg_color = Color(0.06, 0.05, 0.045, 0.7)
	disabled.border_color = Color(LINE, 0.15)
	var focus := hover.duplicate()
	focus.draw_center = false
	focus.border_color = EMBER_HI
	focus.set_border_width_all(2)
	t.set_stylebox("normal", "Button", normal)
	t.set_stylebox("hover", "Button", hover)
	t.set_stylebox("pressed", "Button", pressed)
	t.set_stylebox("disabled", "Button", disabled)
	t.set_stylebox("focus", "Button", focus)
	t.set_font("font", "Button", font("head"))
	t.set_font_size("font_size", "Button", 22)
	t.set_color("font_color", "Button", TEXT)
	t.set_color("font_hover_color", "Button", EMBER_HI)
	t.set_color("font_focus_color", "Button", EMBER_HI)
	t.set_color("font_pressed_color", "Button", BRONZE_HI)
	t.set_color("font_disabled_color", "Button", Color(TEXT, 0.35))
	t.set_stylebox("panel", "PanelContainer", panel_style())
	t.set_stylebox("panel", "Panel", panel_style())

	var slider_bg := StyleBoxFlat.new()
	slider_bg.bg_color = Color(0, 0, 0, 0.6)
	slider_bg.border_color = LINE
	slider_bg.set_border_width_all(1)
	slider_bg.content_margin_top = 4
	slider_bg.content_margin_bottom = 4
	var slider_fill := slider_bg.duplicate()
	slider_fill.bg_color = EMBER
	t.set_stylebox("slider", "HSlider", slider_bg)
	t.set_stylebox("grabber_area", "HSlider", slider_fill)
	t.set_stylebox("grabber_area_highlight", "HSlider", slider_fill)

	var tip := panel_style(Color(0.04, 0.03, 0.03, 0.97), LINE_STRONG, 1, 2)
	t.set_stylebox("panel", "TooltipPanel", tip)
	t.set_font("font", "TooltipLabel", font("body"))
	t.set_font_size("font_size", "TooltipLabel", 21)
	t.set_color("font_color", "TooltipLabel", TEXT)
	var scroll := StyleBoxFlat.new()
	scroll.bg_color = Color(0, 0, 0, 0.3)
	t.set_stylebox("scroll", "VScrollBar", scroll)
	var grab := StyleBoxFlat.new()
	grab.bg_color = Color(BRONZE, 0.5)
	grab.set_corner_radius_all(3)
	t.set_stylebox("grabber", "VScrollBar", grab)
	t.set_stylebox("grabber_highlight", "VScrollBar", grab)
	theme = t
	return t

# ───────────── Widget helpers ─────────────
static func label(text: String, size := 24, color := TEXT, kind := "body", align := HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", font(kind))
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.horizontal_alignment = align
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

static func heading(text: String, size := 40, color := BRONZE_HI) -> Label:
	var l := label(text.to_upper(), size, color, "head", HORIZONTAL_ALIGNMENT_CENTER)
	l.add_theme_constant_override("outline_size", 6)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	return l

static func rich(bbcode: String, size := 24, align := HORIZONTAL_ALIGNMENT_LEFT) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = true
	r.scroll_active = false
	r.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	r.horizontal_alignment = align
	r.add_theme_font_size_override("normal_font_size", size)
	r.add_theme_font_size_override("bold_font_size", size)
	r.add_theme_font_size_override("italics_font_size", size)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	r.text = bbcode
	return r

static func button(text: String, callback: Callable, min_width := 260) -> Button:
	var b := Button.new()
	b.text = text.to_upper()
	b.custom_minimum_size = Vector2(min_width, 56)
	b.pressed.connect(func():
		Audio.play("click")
		callback.call())
	b.mouse_entered.connect(func(): Audio.play("hover", 0.1, -12.0))
	return b

static func icon_rect(name: String, size := 48, tint := BRONZE) -> TextureRect:
	var r := TextureRect.new()
	r.texture = icon(name)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.custom_minimum_size = Vector2(size, size)
	r.modulate = tint
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

static func relic_icon(id: String, size := 56) -> Control:
	var r: Dictionary = RelicDB.RELICS[id]
	var holder := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.07, 0.055, 0.045, 0.95)
	sb.border_color = LINE
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(int(size / 2.0))
	sb.set_content_margin_all(size * 0.14)
	holder.add_theme_stylebox_override("panel", sb)
	holder.add_child(icon_rect(r.icon, int(size * 0.72), Color(r.tint)))
	holder.tooltip_text = "%s  (%s)\n%s" % [r.name, r.rarity, r.desc]
	holder.mouse_filter = Control.MOUSE_FILTER_STOP
	return holder

static func potion_icon(id: String, size := 48) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(size, size)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var flask := icon_rect("flask", size, Color(0.75, 0.7, 0.62))
	flask.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.add_child(flask)
	var liquid := TextureRect.new()
	liquid.texture = tex("res://assets/art/icons/flask_liquid.png")
	liquid.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	liquid.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	liquid.set_anchors_preset(Control.PRESET_FULL_RECT)
	liquid.modulate = Color(PotionDB.POTIONS[id].color)
	liquid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(liquid)
	return c

static func gold_row(amount: int, size := 26, color := BRONZE_HI) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 6)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(icon_rect("coin", size, GOLD))
	h.add_child(label(str(amount), size, color, "head"))
	return h

static func center_box(child: Control) -> CenterContainer:
	var c := CenterContainer.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.add_child(child)
	return c

static func vbox(sep := 12) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	return v

static func hbox(sep := 12) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	return h

static func panel(child: Control, width := 760) -> PanelContainer:
	var p := PanelContainer.new()
	var sb := panel_style()
	sb.set_content_margin_all(34)
	p.add_theme_stylebox_override("panel", sb)
	p.custom_minimum_size.x = width
	p.add_child(child)
	return p

## Card rules text as BBCode, with combat-modified numbers coloured.
static func card_bbcode(s: Dictionary, combat = null) -> String:
	var text: String = s.text
	var v: Dictionary = s.v
	for k in v:
		var base: int = v[k]
		var val := base
		if combat != null and k == "d":
			val = combat.preview_attack(base)
		elif combat != null and k == "b":
			val = combat.preview_block(base)
		var col := "fff3dc"
		if val > base:
			col = GOOD.to_html(false)
		elif val < base:
			col = BAD.to_html(false)
		text = text.replace("{%s}" % k, "[color=#%s][b]%d[/b][/color]" % [col, val])
	for kw in CardDB.KEYWORDS:
		text = text.replace(kw, "[color=#e0a060]%s[/color]" % kw)
	return text

static func keyword_tooltip(s: Dictionary) -> String:
	var lines := []
	for kw in CardDB.KEYWORDS:
		if String(s.text).contains(kw) or (kw == "Light" and s.light_cost > 0):
			lines.append("%s: %s" % [kw, CardDB.KEYWORDS[kw]])
	return "\n".join(lines)
