# Shipping Emberdeep on Steam

The game already runs without Steam; everything Steam-specific is optional and
isolated in `scripts/autoload/steam_service.gd`. This is the path from here to a
store release.

## 1. Steamworks account and app

1. Join Steamworks and pay the Steam Direct fee for the app.
2. Note your **App ID** and create one **depot** per platform (Windows, Linux, macOS).
3. Put the App ID in:
   - `scripts/autoload/steam_service.gd` → `APP_ID`
   - `steam_appid.txt` (development only; Steam provides it at runtime for real players)
   - `steam/app_build.vdf` and the three `steam/depot_*.vdf` files (App ID / depot IDs).

## 2. GodotSteam (Steam API)

1. In the Godot editor: *AssetLib* → search **GodotSteam GDExtension** → install. It lands in `addons/godotsteam/`.
   (Or download the GDExtension release for Godot 4.7 from godotsteam.com.)
2. Restart the editor. `SteamService` detects the `Steam` singleton automatically. With Steam running
   and `steam_appid.txt` present you will see `[Steam] Initialized for <name>` in the output.
3. Achievements: create the API names listed in `steam/achievements.md`. The game already unlocks them.
4. Rich presence: add a `#Status` token in Steamworks → *Rich Presence* with value `%status%`.

## 3. Cloud saves

Saves live in Godot's user folder (`user://`, set to an `Emberdeep` folder via
`application/config/use_custom_user_dir`). Enable **Steam Auto-Cloud** with these roots:

| OS | Root | Subdirectory | Pattern |
| --- | --- | --- | --- |
| Windows | `WinAppDataRoaming` | `Emberdeep` | `*.json` |
| Linux | `LinuxXdgDataHome` | `Emberdeep` | `*.json` |
| macOS | `MacAppSupport` | `Emberdeep` | `*.json` |

(`run.json` is the run in progress, `profile.json` the lifetime record; `settings.cfg` is intentionally per-machine.)

## 4. Build and upload

```bash
tools/build/export.sh /path/to/godot all     # → build/windows, build/linux, build/macos
steamcmd +login <builder-account> +run_app_build "$(pwd)/steam/app_build.vdf" +quit
```

Then set the build live on a branch in Steamworks → *SteamPipe → Builds*.
macOS builds must be code-signed and notarized before release (Godot's macOS export options).

## 5. Steam Deck

- The UI is laid out for 1920×1080 with `expand` stretch, so 1280×800 (16:10) gets extra vertical room rather than letterboxing.
- Full gamepad support: D-pad / left stick to navigate, A confirm, B back, Y end turn, X potions, Start menu, Back deck.
- Submit for Deck verification once a build is live.

## 6. Store page

Draft capsules generated from the game's art are in `steam/store_art/` (regenerate with
`python3 tools/art/render_capsules.py`). Replace them with commissioned key art before launch.
You also need at least 5 screenshots (`tools/build/tour.sh` captures every screen), a trailer,
a short and long description, and content survey answers.

## Pre-launch checklist

- [ ] App ID set everywhere above; `steam_appid.txt` excluded from the shipped depot (or harmless)
- [ ] GodotSteam installed; achievements and rich presence configured
- [ ] Auto-Cloud configured and tested across two machines
- [ ] Windows/Linux/macOS builds uploaded; macOS notarized
- [ ] Controller configuration published (Steam Input: "Gamepad with Mouse" template is fine)
- [ ] Store capsules, screenshots, trailer uploaded and reviewed
- [ ] Release date set; Coming Soon page live at least two weeks before launch
