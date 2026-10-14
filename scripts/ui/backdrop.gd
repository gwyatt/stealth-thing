class_name Backdrop
extends Node2D
## Layered parallax scene (far / mid / near), ground fog and floating particles.

var far := Sprite2D.new()
var mid := Sprite2D.new()
var near_layer: CanvasLayer
var near := Sprite2D.new()
var fog := ColorRect.new()
var dim := ColorRect.new()
var particles := CPUParticles2D.new()
var scene := ""
var _size := Vector2(1920, 1080)

const FOG := {"crypt": Color(0.55, 0.68, 0.75), "warrens": Color(0.4, 0.75, 0.62), "throne": Color(0.85, 0.35, 0.15), "title": Color(0.5, 0.52, 0.6), "campfire": Color(0.4, 0.3, 0.25), "vellum": Color(0, 0, 0)}
const MOTES := {"crypt": Color(0.8, 0.9, 1.0, 0.7), "warrens": Color(0.75, 1.0, 0.85, 0.8), "throne": Color(1.0, 0.65, 0.3, 0.9), "title": Color(1.0, 0.7, 0.35, 0.8), "campfire": Color(1.0, 0.6, 0.25, 0.9), "vellum": Color(0, 0, 0, 0)}

func _ready() -> void:
	for s in [far, mid]:
		s.centered = true
		add_child(s)
	fog.material = ShaderMaterial.new()
	fog.material.shader = load("res://shaders/fog.gdshader")
	fog.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(fog)
	_setup_particles()
	add_child(particles)
	dim.color = Color(0, 0, 0, 0)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(dim)
	near_layer = CanvasLayer.new()
	near_layer.layer = 1
	near.centered = true
	near_layer.add_child(near)
	add_child(near_layer)
	get_viewport().size_changed.connect(_layout)
	_layout()

func _setup_particles() -> void:
	particles.amount = 45
	particles.lifetime = 9.0
	particles.preprocess = 9.0
	particles.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	particles.direction = Vector2(0.2, -1)
	particles.spread = 25.0
	particles.gravity = Vector2(0, -6)
	particles.initial_velocity_min = 8.0
	particles.initial_velocity_max = 30.0
	particles.scale_amount_min = 0.5
	particles.scale_amount_max = 1.6
	var grad := Gradient.new()
	grad.set_color(0, Color(1, 1, 1, 0))
	grad.add_point(0.15, Color(1, 1, 1, 1))
	grad.add_point(0.8, Color(1, 1, 1, 0.8))
	grad.set_color(grad.get_point_count() - 1, Color(1, 1, 1, 0))
	particles.color_ramp = grad
	var img := Image.create(16, 16, false, Image.FORMAT_RGBA8)
	for y in 16:
		for x in 16:
			var d := Vector2(x - 7.5, y - 7.5).length() / 7.5
			img.set_pixel(x, y, Color(1, 1, 1, clampf(1.0 - d, 0, 1) ** 2))
	particles.texture = ImageTexture.create_from_image(img)

func _layout() -> void:
	_size = get_viewport().get_visible_rect().size
	var center := _size / 2
	for s in [far, mid, near]:
		s.position = center
		if s.texture != null:
			var k := maxf(_size.x * 1.06 / s.texture.get_width(), _size.y * 1.06 / s.texture.get_height())
			s.scale = Vector2(k, k)
	fog.position = Vector2(-_size.x * 0.1, _size.y * 0.5)
	fog.size = Vector2(_size.x * 1.2, _size.y * 0.45)
	dim.position = Vector2.ZERO
	dim.size = _size
	particles.position = Vector2(_size.x / 2, _size.y * 0.9)
	particles.emission_rect_extents = Vector2(_size.x / 2, _size.y * 0.4)

func set_scene(name: String, dim_amount := 0.0, fog_density := 0.35) -> void:
	if name != scene:
		scene = name
		far.texture = UI.tex("res://assets/art/scenes/%s_far.png" % name)
		mid.texture = UI.tex("res://assets/art/scenes/%s_mid.png" % name)
		near.texture = UI.tex("res://assets/art/scenes/%s_near.png" % name)
		(fog.material as ShaderMaterial).set_shader_parameter("fog_color", FOG.get(name, Color.GRAY))
		particles.color = MOTES.get(name, Color.WHITE)
		particles.emitting = MOTES.get(name, Color.WHITE).a > 0
		_layout()
	(fog.material as ShaderMaterial).set_shader_parameter("density", fog_density)
	create_tween().tween_property(dim, "color:a", dim_amount, 0.4)

func _process(_delta: float) -> void:
	# Gentle mouse parallax.
	var m := (get_viewport().get_mouse_position() / _size - Vector2(0.5, 0.5)) if _size.x > 0 else Vector2.ZERO
	var c := _size / 2
	far.position = far.position.lerp(c - m * 10.0, 0.05)
	mid.position = mid.position.lerp(c - m * 24.0, 0.05)
	near.position = near.position.lerp(c - m * 46.0, 0.05)
