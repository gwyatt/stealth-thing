// Branching act map, generated in the spirit of Slay the Spire: several non-crossing
// upward paths through a grid, then room types assigned with placement rules.

export const MAP_ROWS = 13; // floors before the boss
export const MAP_COLS = 7;
const PATHS = 6;
export const TREASURE_ROW = 6;

const TYPE_WEIGHTS = [
  ['combat', 46],
  ['event', 22],
  ['rest', 12],
  ['elite', 9],
  ['shop', 6],
];

export function generateMap(rng) {
  const nodes = {}; // key "r-c" -> node
  const edges = new Set(); // "r-c>c2"
  const key = (r, c) => `${r}-${c}`;

  let firstStart = -1;
  for (let p = 0; p < PATHS; p++) {
    let col = rng.int(0, MAP_COLS - 1);
    if (p === 1) {
      while (col === firstStart) col = rng.int(0, MAP_COLS - 1);
    }
    if (p === 0) firstStart = col;
    for (let r = 0; r < MAP_ROWS; r++) {
      if (!nodes[key(r, col)]) nodes[key(r, col)] = { row: r, col, type: null, next: [] };
      if (r === MAP_ROWS - 1) break;
      const options = [col - 1, col, col + 1].filter((c) => c >= 0 && c < MAP_COLS);
      const valid = options.filter((nc) => !crosses(edges, r, col, nc));
      const nc = valid.length ? rng.pick(valid) : col;
      edges.add(`${r}-${col}>${nc}`);
      const n = nodes[key(r, col)];
      if (!n.next.includes(nc)) n.next.push(nc);
      col = nc;
    }
  }

  // Parents lookup for placement rules.
  const parents = {};
  for (const n of Object.values(nodes)) {
    for (const nc of n.next) {
      const k = key(n.row + 1, nc);
      (parents[k] = parents[k] || []).push(n);
    }
  }

  const rows = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    rows.push(Object.values(nodes).filter((n) => n.row === r).sort((a, b) => a.col - b.col));
  }

  for (const row of rows) {
    for (const n of row) {
      n.type = pickType(rng, n, parents[key(n.row, n.col)] || []);
      n.next.sort((a, b) => a - b);
    }
  }

  return { rows, boss: { row: MAP_ROWS, col: Math.floor(MAP_COLS / 2), type: 'boss', next: [] } };
}

function crosses(edges, r, from, to) {
  for (const e of edges) {
    const [rc, dest] = e.split('>');
    const [er, ec] = rc.split('-').map(Number);
    if (er !== r) continue;
    const d = Number(dest);
    if ((ec < from && d > to) || (ec > from && d < to)) return true;
  }
  return false;
}

function pickType(rng, node, parents) {
  const r = node.row;
  if (r === 0) return 'combat';
  if (r === TREASURE_ROW) return 'treasure';
  if (r === MAP_ROWS - 1) return 'rest';
  const parentTypes = new Set(parents.map((p) => p.type));
  const allowed = TYPE_WEIGHTS.filter(([t]) => {
    if (r < 4 && (t === 'elite' || t === 'rest')) return false;
    if (r === MAP_ROWS - 2 && t === 'rest') return false;
    if (r < 2 && t === 'shop') return false;
    // Avoid back-to-back special rooms.
    if (t !== 'combat' && t !== 'event' && parentTypes.has(t)) return false;
    return true;
  });
  return rng.weighted(allowed);
}

export function findNode(map, row, col) {
  if (row === MAP_ROWS) return map.boss;
  return (map.rows[row] || []).find((n) => n.col === col) || null;
}
