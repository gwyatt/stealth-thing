# Emberdeep

A dark-fantasy roguelike deckbuilder in the spirit of *Slay the Spire*, built as a native
desktop game with **Godot 4.7** for release on **Steam** (Windows, Linux, macOS, Steam Deck).

You are the **Lanternkeeper**, carrying the last flame down through three acts of the
Deep to face the Ember Tyrant.

## Play it locally

1. Install **Godot 4.7.2** (standard build, not .NET): <https://godotengine.org/download>
2. Either open the editor, *Import* this folder (`project.godot`) and press **F5**, or run:

```bash
godot --path /path/to/emberdeep
```

Saves go to Godot's user folder (`Emberdeep/` under your OS app-data directory).

| Input | Mouse & keyboard | Gamepad |
| --- | --- | --- |
| Play a card | Click it (then click a target) or `1`–`9` | D-pad, **A** |
| Change target | Hover an enemy, or `←` / `→` | D-pad |
| End turn | **End Turn** button or `E` | **Y** |
| Cancel / menu | Right-click or `Esc` | **B** / **Start** |
| Deck / potions | `D` / `P` | **Back** / **X** |
| Fullscreen | `F11` | |

## What's in the game

- **3 acts**: branching 13-floor maps of monsters, elites, campfires, merchants, treasure and events, each ending in a boss.
- **47 cards**, all upgradable, plus status cards and curses; **31 relics**; **12 potions**.
- **16 enemies, 8 elites, 3 bosses** with telegraphed intents (the last boss has a second phase).
- **11 events** and a starting blessing. Seeded runs, autosave, lifetime stats.
- **Light**, the signature resource: it persists between turns and wanes by 1 each turn. Cards build it, scale with it, or spend it all at once. **Burn** is the damage-over-time archetype.

### Presentation

- Characters are lit in real time: each sprite ships with a **normal map**, so the Lanternkeeper's flickering lantern (a live 2D light whose strength follows your Light) rakes across armour and faces. Eyes, flames and glass glow in a separate additive layer.
- Painted **parallax backgrounds**, drifting shader fog, dust/spores/embers, film grain and vignette.
- Death is a **burning dissolve** shader; cinematic banners for bosses, victories and defeat.
- Generated **ambient score** (one loop per act, boss, campfire, title) and ~30 sound effects.
- Full **gamepad** navigation for Steam Deck.

## Project layout

```
project.godot              engine config (1920×1080, GL Compatibility renderer)
scenes/main.tscn           single root scene
scripts/core, data, engine pure game rules: RNG, content, combat, map, run state (no nodes)
scripts/autoload/          Settings (+input map), Audio, SteamService (optional), Session (saves)
scripts/ui/                screens, widgets, backdrop, theme; dev_tour.gd (screenshot tour)
shaders/                   post-processing, fog, dissolve
assets/                    art (creatures, scenes, icons, ui), audio, fonts (OFL)
art_src/                   editable vector sources for characters and emblems
tools/art/                 Python art pipeline (sprites + normal maps, scenes, UI, store capsules)
tools/audio/               Python sound and music synthesis
tools/build/               export and screenshot-tour scripts
tests/                     headless test suite and a bot that plays full runs
steam/                     SteamPipe build configs, achievements, store art drafts
STEAM.md                   step-by-step Steam release guide
```

## Development

```bash
tools/test.sh /path/to/godot          # headless tests (engine rules + 40 full bot runs)
tools/build/tour.sh /path/to/godot    # play through every screen and save screenshots
tools/build/export.sh /path/to/godot  # release builds into build/
```

CI (`.github/workflows/ci.yml`) runs the tests on every push and exports Windows/Linux builds for `v*` tags.

### Regenerating assets

The shipped PNG/WAV/OGG files are committed, so none of this is needed to play. To change art or audio:

```bash
pip install numpy scipy pillow          # plus ffmpeg for music
python3 tools/art/render_creatures.py   # art_src/creatures/*.svg → sprites, normal maps, glow layers
python3 tools/art/render_icons.py       # art_src/emblems/*.svg → embossed icons
python3 tools/art/render_scenes.py      # painted parallax backgrounds
python3 tools/art/render_ui.py          # card frames, panels, app icon
python3 tools/art/render_capsules.py    # draft Steam capsules
python3 tools/audio/synth.py            # sound effects and music
```

The art pipeline is deliberately replaceable: drop in commissioned art using the same file names
(`<id>.png`, optional `<id>_n.png` normal map and `<id>_glow.png`) and the game picks it up.

### Adding content

- **Card**: an entry in `CardDB.CARDS` (`scripts/data/card_db.gd`) plus its effect in `CardDB.play()`.
- **Enemy**: an entry in `EnemyDB.ENEMIES` with declarative moves, a branch in `EnemyDB.ai()`, an encounter, and art in `art_src/creatures/<id>.svg`.
- **Relic / potion / event**: see the hook functions in their `*_db.gd` files.

## Licenses

Fonts: Cinzel and EB Garamond, SIL Open Font License (see `assets/fonts/`). Everything else was created for this project.
