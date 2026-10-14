class_name Rng
extends RefCounted
## Deterministic, serializable random source (PCG32 via RandomNumberGenerator).

var _rng := RandomNumberGenerator.new()

func _init(seed_value: int = 1) -> void:
	_rng.seed = seed_value

var state: int:
	get: return _rng.state
	set(value): _rng.state = value

static func hash_seed(text: String) -> int:
	return absi(text.hash()) + 1

func next() -> float:
	return _rng.randf()

## Inclusive integer range.
func range_i(lo: int, hi: int) -> int:
	return _rng.randi_range(lo, hi)

func chance(p: float) -> bool:
	return _rng.randf() < p

func pick(arr: Array):
	if arr.is_empty():
		return null
	return arr[_rng.randi_range(0, arr.size() - 1)]

func shuffle(arr: Array) -> Array:
	for i in range(arr.size() - 1, 0, -1):
		var j := _rng.randi_range(0, i)
		var tmp = arr[i]
		arr[i] = arr[j]
		arr[j] = tmp
	return arr

## entries: [[item, weight], ...]
func weighted(entries: Array):
	var total := 0.0
	for e in entries:
		total += float(e[1])
	var roll := _rng.randf() * total
	for e in entries:
		roll -= float(e[1])
		if roll < 0.0:
			return e[0]
	return entries[entries.size() - 1][0]

func sample(arr: Array, n: int) -> Array:
	return shuffle(arr.duplicate()).slice(0, n)

static func random_seed_string() -> String:
	const CHARS := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var s := ""
	for i in 8:
		s += CHARS[randi() % CHARS.length()]
	return s
