extends Node
## Player settings (user://settings.cfg) and input bindings, including gamepad.

const PATH := "user://settings.cfg"

var fullscreen := false
var vsync := true
var master_volume := 0.8
var music_volume := 0.6
var sfx_volume := 0.8
var screen_shake := true
var fast_animations := false

signal changed

func _ready() -> void:
	_register_inputs()
	load_settings()
	apply()

func load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(PATH) != OK:
		return
	fullscreen = cfg.get_value("video", "fullscreen", fullscreen)
	vsync = cfg.get_value("video", "vsync", vsync)
	master_volume = cfg.get_value("audio", "master", master_volume)
	music_volume = cfg.get_value("audio", "music", music_volume)
	sfx_volume = cfg.get_value("audio", "sfx", sfx_volume)
	screen_shake = cfg.get_value("game", "screen_shake", screen_shake)
	fast_animations = cfg.get_value("game", "fast_animations", fast_animations)

func save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("video", "fullscreen", fullscreen)
	cfg.set_value("video", "vsync", vsync)
	cfg.set_value("audio", "master", master_volume)
	cfg.set_value("audio", "music", music_volume)
	cfg.set_value("audio", "sfx", sfx_volume)
	cfg.set_value("game", "screen_shake", screen_shake)
	cfg.set_value("game", "fast_animations", fast_animations)
	cfg.save(PATH)

func apply() -> void:
	if DisplayServer.get_name() != "headless":
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen else DisplayServer.WINDOW_MODE_WINDOWED)
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if vsync else DisplayServer.VSYNC_DISABLED)
	_set_bus("Master", master_volume)
	_set_bus("Music", music_volume)
	_set_bus("SFX", sfx_volume)
	changed.emit()

func _set_bus(bus: String, v: float) -> void:
	var idx := AudioServer.get_bus_index(bus)
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, linear_to_db(maxf(v, 0.0001)))
		AudioServer.set_bus_mute(idx, v <= 0.001)

## Animation time multiplier.
func anim(t: float) -> float:
	return t * (0.5 if fast_animations else 1.0)

func _register_inputs() -> void:
	_action("end_turn", [KEY_E], [JOY_BUTTON_Y])
	_action("cancel", [KEY_ESCAPE], [JOY_BUTTON_B])
	_action("view_deck", [KEY_D], [JOY_BUTTON_BACK])
	_action("view_map", [KEY_M], [])
	_action("pause", [], [JOY_BUTTON_START])
	_action("confirm", [KEY_ENTER, KEY_SPACE], [JOY_BUTTON_A])
	_action("nav_left", [KEY_LEFT, KEY_A], [JOY_BUTTON_DPAD_LEFT])
	_action("nav_right", [KEY_RIGHT], [JOY_BUTTON_DPAD_RIGHT])
	_action("nav_up", [KEY_UP, KEY_W], [JOY_BUTTON_DPAD_UP])
	_action("nav_down", [KEY_DOWN, KEY_S], [JOY_BUTTON_DPAD_DOWN])
	_action("potion", [KEY_P], [JOY_BUTTON_X])
	_action("toggle_fullscreen", [KEY_F11], [])
	# Left stick navigation.
	for pair in [["nav_left", JOY_AXIS_LEFT_X, -1.0], ["nav_right", JOY_AXIS_LEFT_X, 1.0], ["nav_up", JOY_AXIS_LEFT_Y, -1.0], ["nav_down", JOY_AXIS_LEFT_Y, 1.0]]:
		var ev := InputEventJoypadMotion.new()
		ev.axis = pair[1]
		ev.axis_value = pair[2]
		InputMap.action_add_event(pair[0], ev)

func _action(name: String, keys: Array, buttons: Array) -> void:
	if not InputMap.has_action(name):
		InputMap.add_action(name, 0.5)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k
		InputMap.action_add_event(name, ev)
	for b in buttons:
		var jb := InputEventJoypadButton.new()
		jb.button_index = b
		InputMap.action_add_event(name, jb)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_fullscreen"):
		fullscreen = not fullscreen
		apply()
		save_settings()
