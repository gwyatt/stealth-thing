class_name CreatureView
extends Node2D
## A lit, normal-mapped creature in the combat world, with idle breathing,
## hit flashes, lunges and a burning dissolve on death.

## On-screen height (px) of a creature with size 1.0.
const BASE_HEIGHT := 350.0

var creature_id := ""
var sprite := Sprite2D.new()
var glow := Sprite2D.new()
var shadow := Sprite2D.new()
var facing_left := true
var art_size := Vector2.ZERO
var _t := randf() * 10.0
var _dying := false

func setup(id: String, scale_mult := 1.0) -> CreatureView:
	creature_id = id
	var base := "res://assets/art/creatures/%s" % id
	var ct := CanvasTexture.new()
	ct.diffuse_texture = UI.tex(base + ".png")
	ct.normal_texture = UI.tex(base + "_n.png")
	sprite.texture = ct
	sprite.centered = true
	art_size = ct.diffuse_texture.get_size() if ct.diffuse_texture != null else Vector2(200, 240)
	var k := BASE_HEIGHT * scale_mult / maxf(art_size.y - 48.0, 1.0)
	sprite.scale = Vector2(k, k)
	sprite.offset = Vector2(0, -art_size.y / 2 + 24)
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/dissolve.gdshader")
	sprite.material = mat

	shadow.texture = _shadow_texture()
	shadow.scale = Vector2(art_size.x * k / 128.0 * 0.9, 0.35)
	shadow.modulate = Color(0, 0, 0, 0.75)
	add_child(shadow)
	add_child(sprite)

	glow.texture = UI.tex(base + "_glow.png")
	glow.centered = true
	glow.scale = sprite.scale
	glow.offset = sprite.offset
	var gm := CanvasItemMaterial.new()
	gm.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	gm.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	glow.material = gm
	add_child(glow)
	return self

func height() -> float:
	return (art_size.y - 48) * sprite.scale.y

func width() -> float:
	return (art_size.x - 48) * sprite.scale.x

static var _shadow_tex: Texture2D
static func _shadow_texture() -> Texture2D:
	if _shadow_tex == null:
		var g := GradientTexture2D.new()
		g.fill = GradientTexture2D.FILL_RADIAL
		g.fill_from = Vector2(0.5, 0.5)
		g.fill_to = Vector2(1, 0.5)
		var gr := Gradient.new()
		gr.set_color(0, Color(0, 0, 0, 1))
		gr.set_color(1, Color(0, 0, 0, 0))
		g.gradient = gr
		g.width = 128
		g.height = 128
		_shadow_tex = g
	return _shadow_tex

func _process(delta: float) -> void:
	if _dying:
		return
	_t += delta
	var breathe := sin(_t * 1.6) * 0.012
	sprite.scale.y = sprite.scale.x * (1.0 + breathe)
	glow.scale.y = sprite.scale.y
	glow.modulate.a = 0.75 + sin(_t * 2.3) * 0.25

func flash_hit(strength := 1.0) -> void:
	var mat := sprite.material as ShaderMaterial
	mat.set_shader_parameter("flash", 0.8 * strength)
	var tw := create_tween()
	tw.tween_method(func(v): mat.set_shader_parameter("flash", v), 0.8 * strength, 0.0, 0.25)
	var dir := 1.0 if facing_left else -1.0
	var home := sprite.position
	var tw2 := create_tween()
	tw2.tween_property(sprite, "position", home + Vector2(14 * dir, 0), 0.05)
	tw2.tween_property(sprite, "position", home, 0.18).set_trans(Tween.TRANS_BACK)

func lunge() -> void:
	var dir := -1.0 if facing_left else 1.0
	var tw := create_tween()
	tw.tween_property(sprite, "position:x", 60.0 * dir, Settings.anim(0.12)).set_ease(Tween.EASE_OUT)
	tw.tween_property(sprite, "position:x", 0.0, Settings.anim(0.25)).set_trans(Tween.TRANS_QUAD)
	var tw2 := create_tween()
	tw2.tween_property(glow, "position:x", 60.0 * dir, Settings.anim(0.12))
	tw2.tween_property(glow, "position:x", 0.0, Settings.anim(0.25))

func set_highlight(on: bool) -> void:
	modulate = Color(1.25, 1.12, 1.0) if on else Color(1, 1, 1)

func die() -> void:
	_dying = true
	var mat := sprite.material as ShaderMaterial
	var tw := create_tween().set_parallel(true)
	tw.tween_method(func(v): mat.set_shader_parameter("progress", v), 0.0, 1.0, Settings.anim(1.2))
	tw.tween_property(glow, "modulate:a", 0.0, Settings.anim(0.4))
	tw.tween_property(shadow, "modulate:a", 0.0, Settings.anim(1.2))
	var embers := CPUParticles2D.new()
	embers.amount = 60
	embers.lifetime = 1.6
	embers.one_shot = true
	embers.explosiveness = 0.3
	embers.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	embers.emission_rect_extents = Vector2(width() / 3, height() / 3)
	embers.position = Vector2(0, -height() / 2)
	embers.direction = Vector2(0, -1)
	embers.spread = 40
	embers.gravity = Vector2(0, -60)
	embers.initial_velocity_min = 20
	embers.initial_velocity_max = 90
	embers.scale_amount_min = 2
	embers.scale_amount_max = 5
	embers.color = Color(1.0, 0.6, 0.25)
	var mat2 := CanvasItemMaterial.new()
	mat2.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	mat2.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	embers.material = mat2
	add_child(embers)
	embers.emitting = true

func revive() -> void:
	_dying = false
	(sprite.material as ShaderMaterial).set_shader_parameter("progress", 0.0)
	glow.modulate.a = 1.0
	shadow.modulate.a = 0.75
