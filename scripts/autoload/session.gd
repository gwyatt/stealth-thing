extends Node
## Owns the active run, its save file and the lifetime profile.
## Saves live in user:// (Steam Auto-Cloud can sync that folder).

const SAVE_PATH := "user://run.json"
const PROFILE_PATH := "user://profile.json"

var run: RunState = null
var profile := {"runs": 0, "wins": 0, "best_floor": 0, "best_score": 0, "achievements": []}

func _ready() -> void:
	var p = _read_json(PROFILE_PATH)
	if p is Dictionary:
		for k in p:
			profile[k] = p[k]

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func new_run(seed_text: String) -> void:
	run = RunState.new_run(seed_text)
	save()

func continue_run() -> bool:
	var d = _read_json(SAVE_PATH)
	if not d is Dictionary:
		return false
	run = RunState.from_dict(d)
	return run != null

func save() -> void:
	if run == null:
		return
	if run.data.over:
		delete_save()
		return
	_write_json(SAVE_PATH, run.to_dict())

func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))

func record_run_end() -> void:
	if run == null or run.data.get("recorded", false):
		return
	run.data["recorded"] = true
	profile.runs += 1
	if run.data.won:
		profile.wins += 1
	profile.best_floor = maxi(profile.best_floor, run.data.stats.floors)
	profile.best_score = maxi(profile.best_score, run.score())
	_write_json(PROFILE_PATH, profile)
	delete_save()

func record_achievement(api_name: String) -> void:
	if not profile.achievements.has(api_name):
		profile.achievements.append(api_name)
		_write_json(PROFILE_PATH, profile)

func _read_json(path: String):
	if not FileAccess.file_exists(path):
		return null
	var f := FileAccess.open(path, FileAccess.READ)
	return JSON.parse_string(f.get_as_text())

func _write_json(path: String, value) -> void:
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string(JSON.stringify(value))
