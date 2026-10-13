# Emberdeep

A roguelike deckbuilding card game in the spirit of *Slay the Spire*. You are the **Lanternkeeper**, carrying the last flame down through three acts of the Deep to face the Ember Tyrant.

Runs entirely in the browser: vanilla JavaScript ES modules, no build step and no dependencies.

## Play

```bash
npm start          # serves the game at http://localhost:8080
```

Any static file server works (`python3 -m http.server`, GitHub Pages, …). The page must be served over HTTP, because browsers block ES modules loaded from `file://`.

**To host on GitHub Pages:** Settings → Pages → *Deploy from a branch* → pick the branch and `/ (root)`.

## The game

- **3 acts**, each a branching map of 13 floors plus a boss: monsters, elites, campfires, merchants, treasure and `?` events.
- **47 cards** (starter, common, uncommon, rare) plus status cards and curses. Every card can be upgraded.
- **31 relics**: common, uncommon, rare, shop and boss tiers.
- **12 potions**, **16 regular enemies** with telegraphed intents, **8 elites** and **3 bosses** (the last has a second phase).
- **11 events**, plus a starting blessing.
- Seeded runs (enter a custom seed on the title screen), autosave between rooms, and a lifetime record.

### Art direction

Dark, grim and quiet, in the tradition of Souls games: silhouettes lit from one side by the Lanternkeeper's lantern, glowing eyes, fog, ash and embers, iron-and-bronze UI and a film-grain/vignette pass over everything. All art is hand-authored vector code (no image files to license):

- **29 characters** — the Lanternkeeper, the merchant and every enemy and boss (`assets/art/creatures/`).
- **6 scenes** — the flooded crypt, the fungal warrens, the burning cathedral, the title vista, the campfire and the map vellum (`assets/art/scenes/`).
- **~50 engraved emblems** for card art, relics, potions, statuses, intents, map nodes and HUD icons (`src/ui/art/emblems.js`).

The SVGs are generated from `tools/art/*.js`. After editing them, run `npm run art`. To review every character at once, start the server and open `/tools/art/sheet.html?ids=player,ghoul,...`; `/tools/art/emblems.html` shows all emblems.

### Signature mechanic: Light 🏮

Light is a second resource that **persists between turns** (max 10) and **wanes by 1** at the end of each turn. Cards build it (*Kindle*, *Stoke*, *Brace*), scale off it (*Inferno Fist*, *Lantern Ward*, *Twin Suns*) or spend it all at once (*Flare*, *Supernova*). Relics and powers bend the rules: *Everburning Wick* stops it waning, *Mirror Shard* raises the cap, *Ashen Armor* turns Light into Block.

The other main archetype is **Burn**: damage over time that ignores Block, amplified by *Pyroclasm*, *Wildfire* and *Conflagration*.

### Controls

| Input | Action |
| --- | --- |
| Click a card | Play it (cards that need a target: then click an enemy) |
| `1`–`9` | Select a card; while targeting, choose an enemy |
| `E` | End turn |
| `Esc` / right-click | Cancel targeting or close a window |
| `D` / `M` | View deck / map |

## Project layout

```
index.html, css/style.css   page shell and styles
src/core/rng.js             seeded PRNG (mulberry32)
src/data/                   content: cards, relics, potions, enemies + encounters, events, statuses
src/engine/combat.js        turn-based combat rules (pure, deterministic)
src/engine/map.js           act map generation
src/engine/game.js          run state, rewards, shop, rest, events, save/load
src/ui/                     DOM rendering, input, animation, procedural sound
src/ui/art/                 emblem library and generated creature size manifest
assets/art/                 generated creature and scene SVGs
tools/art/                  art source (character and scene generators)
tools/bot.js                greedy bot that plays full runs headlessly
tools/simulate.js           balance simulator
tests/                      node:test suite
```

The engine has no DOM dependencies. Combat emits an event list that the UI drains to animate damage numbers and play sounds, so the same code runs under the bot, the tests and the browser.

### Adding content

- **Card:** add a `card(...)` entry in `src/data/cards.js` with numbers in `v`, upgrade overrides in `up`, templated `text`, and a `play(c, v, target)` function that calls the combat API (`attack`, `block`, `apply`, `gainLight`, `draw`, …).
- **Enemy:** add an `enemy(...)` in `src/data/enemies.js` with declarative `moves` and an `ai` function, then reference it in `ENCOUNTERS`.
- **Relic / potion / event:** see the hooks documented at the top of each data file.

## Development

```bash
npm test           # engine unit tests + 60 full bot runs
npm run simulate   # play 300 bot runs and print win rate and top killers
```
