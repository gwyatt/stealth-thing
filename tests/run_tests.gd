extends SceneTree
## Headless test runner:  godot --headless --path . -s res://tests/run_tests.gd
## Discovers test_* methods in every tests/test_*.gd file. Exits non-zero on failure.

var _failures := 0
var _passes := 0
var _current := ""

func _initialize() -> void:
	var dir := DirAccess.open("res://tests")
	var files := []
	for f in dir.get_files():
		if f.begins_with("test_") and f.ends_with(".gd"):
			files.append(f)
	files.sort()
	for f in files:
		var script: GDScript = load("res://tests/" + f)
		var suite = script.new()
		suite.set("runner", self)
		for m in script.get_script_method_list():
			if not String(m.name).begins_with("test_"):
				continue
			_current = "%s::%s" % [f.get_basename(), m.name]
			var before := _failures
			suite.call(m.name)
			if _failures == before:
				_passes += 1
				print("  ok   ", _current)
	print("\n%d passed, %d failed" % [_passes, _failures])
	quit(1 if _failures > 0 else 0)

func check(cond: bool, msg := "") -> void:
	if not cond:
		_failures += 1
		printerr("  FAIL ", _current, "  ", msg)

func eq(a, b, msg := "") -> void:
	check(a == b, "%s (expected %s, got %s)" % [msg, str(b), str(a)])
