class_name MapGen
## Branching act map in the spirit of Slay the Spire: several non-crossing upward
## paths through a grid, then room types assigned with placement rules.

const ROWS := 13  # floors before the boss
const COLS := 7
const PATHS := 6
const TREASURE_ROW := 6

const TYPE_WEIGHTS := [["combat", 46], ["event", 22], ["rest", 12], ["elite", 9], ["shop", 6]]

## Returns {"rows": [[node, ...], ...], "boss": node}; node = {row, col, type, next: [cols]}.
static func generate(rng: Rng) -> Dictionary:
	var nodes := {}
	var edges := []  # [row, from_col, to_col]
	var first_start := -1
	for p in PATHS:
		var col := rng.range_i(0, COLS - 1)
		if p == 1:
			while col == first_start:
				col = rng.range_i(0, COLS - 1)
		if p == 0:
			first_start = col
		for r in ROWS:
			var key := "%d-%d" % [r, col]
			if not nodes.has(key):
				nodes[key] = {"row": r, "col": col, "type": "", "next": []}
			if r == ROWS - 1:
				break
			var valid := []
			for nc in [col - 1, col, col + 1]:
				if nc >= 0 and nc < COLS and not _crosses(edges, r, col, nc):
					valid.append(nc)
			var next_col: int = rng.pick(valid) if not valid.is_empty() else col
			edges.append([r, col, next_col])
			if not nodes[key].next.has(next_col):
				nodes[key].next.append(next_col)
			col = next_col

	var parents := {}
	for n in nodes.values():
		for nc in n.next:
			var k := "%d-%d" % [n.row + 1, nc]
			if not parents.has(k):
				parents[k] = []
			parents[k].append(n)

	var rows := []
	for r in ROWS:
		var row := nodes.values().filter(func(n): return n.row == r)
		row.sort_custom(func(a, b): return a.col < b.col)
		rows.append(row)
	for row in rows:
		for n in row:
			n.type = _pick_type(rng, n, parents.get("%d-%d" % [n.row, n.col], []))
			n.next.sort()
	return {"rows": rows, "boss": {"row": ROWS, "col": COLS / 2, "type": "boss", "next": []}}

static func _crosses(edges: Array, r: int, from: int, to: int) -> bool:
	for e in edges:
		if e[0] != r:
			continue
		if (e[1] < from and e[2] > to) or (e[1] > from and e[2] < to):
			return true
	return false

static func _pick_type(rng: Rng, node: Dictionary, parents: Array) -> String:
	var r: int = node.row
	if r == 0:
		return "combat"
	if r == TREASURE_ROW:
		return "treasure"
	if r == ROWS - 1:
		return "rest"
	var parent_types := {}
	for p in parents:
		parent_types[p.type] = true
	var allowed := []
	for tw in TYPE_WEIGHTS:
		var t: String = tw[0]
		if r < 4 and (t == "elite" or t == "rest"):
			continue
		if r == ROWS - 2 and t == "rest":
			continue
		if r < 2 and t == "shop":
			continue
		if t != "combat" and t != "event" and parent_types.has(t):
			continue
		allowed.append(tw)
	return rng.weighted(allowed)

static func find_node(map: Dictionary, row: int, col: int):
	if row == ROWS:
		return map.boss
	if row < 0 or row >= map.rows.size():
		return null
	for n in map.rows[row]:
		if n.col == col:
			return n
	return null
