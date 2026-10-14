extends Node
## Sound effects and music. Files live in assets/audio/{sfx,music}; missing files are skipped.

const SFX_DIR := "res://assets/audio/sfx/"
const MUSIC_DIR := "res://assets/audio/music/"

var _sfx := {}
var _players: Array[AudioStreamPlayer] = []
var _music_a := AudioStreamPlayer.new()
var _music_b := AudioStreamPlayer.new()
var _current_music := ""

func _ready() -> void:
	_ensure_bus("Music")
	_ensure_bus("SFX")
	for i in 10:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_players.append(p)
	for m in [_music_a, _music_b]:
		m.bus = "Music"
		add_child(m)

func _ensure_bus(name: String) -> void:
	if AudioServer.get_bus_index(name) == -1:
		AudioServer.add_bus()
		var idx := AudioServer.bus_count - 1
		AudioServer.set_bus_name(idx, name)
		AudioServer.set_bus_send(idx, "Master")

func _stream(dir: String, name: String) -> AudioStream:
	var key := dir + name
	if not _sfx.has(key):
		var path := "%s%s.wav" % [dir, name]
		if not ResourceLoader.exists(path):
			path = "%s%s.ogg" % [dir, name]
		_sfx[key] = load(path) if ResourceLoader.exists(path) else null
	return _sfx[key]

func play(name: String, pitch_jitter := 0.06, volume_db := 0.0) -> void:
	var s := _stream(SFX_DIR, name)
	if s == null:
		return
	for p in _players:
		if not p.playing:
			p.stream = s
			p.pitch_scale = 1.0 + randf_range(-pitch_jitter, pitch_jitter)
			p.volume_db = volume_db
			p.play()
			return

func music(name: String, fade := 1.5) -> void:
	if name == _current_music:
		return
	_current_music = name
	var s := _stream(MUSIC_DIR, name)
	var old := _music_a if _music_a.playing else _music_b
	var nxt := _music_b if old == _music_a else _music_a
	if old.playing:
		var tw := create_tween()
		tw.tween_property(old, "volume_db", -40.0, fade)
		tw.tween_callback(old.stop)
	if s != null:
		nxt.stream = s
		nxt.volume_db = -40.0
		nxt.play()
		create_tween().tween_property(nxt, "volume_db", 0.0, fade)
