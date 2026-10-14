extends Node
## Optional Steam integration. Uses the GodotSteam GDExtension when it is installed
## (Engine singleton "Steam"); otherwise every call is a silent no-op, so the game
## runs and tests identically without Steam.

const APP_ID := 480  # Spacewar test app. Replace with Emberdeep's App ID.

## Achievement API names, mirrored in steam/achievements.md.
const ACHIEVEMENTS := {
	"FIRST_BLOOD": "Win your first combat.",
	"WARDEN_FALLS": "Defeat an elite.",
	"KING_DROWNED": "Defeat the Drowned King.",
	"ROT_PURGED": "Defeat the Rot Colossus.",
	"TYRANT_FELLED": "Defeat the Ember Tyrant and win a run.",
	"LIGHTBRINGER": "Reach maximum Light in a combat.",
	"PYROMANIAC": "Have 30 or more Burn on a single enemy.",
	"COLLECTOR": "Own 10 relics in a single run.",
	"MINIMALIST": "Win a run with 15 or fewer cards in your deck.",
}

var steam = null
var available := false
var player_name := ""

func _ready() -> void:
	if not Engine.has_singleton("Steam"):
		print("[Steam] GodotSteam not installed; running without Steam.")
		return
	steam = Engine.get_singleton("Steam")
	var init: Dictionary = steam.steamInitEx(true, APP_ID)
	available = int(init.get("status", 1)) == 0
	if available:
		player_name = steam.getPersonaName()
		print("[Steam] Initialized for ", player_name)
	else:
		print("[Steam] Init failed: ", init)

func _process(_delta: float) -> void:
	if available:
		steam.run_callbacks()

func unlock(api_name: String) -> void:
	if not ACHIEVEMENTS.has(api_name):
		push_warning("Unknown achievement " + api_name)
		return
	Session.record_achievement(api_name)
	if not available:
		return
	var status: Dictionary = steam.getAchievement(api_name)
	if status.get("achieved", false):
		return
	steam.setAchievement(api_name)
	steam.storeStats()

func set_rich_presence(text: String) -> void:
	if available:
		steam.setRichPresence("steam_display", "#Status")
		steam.setRichPresence("status", text)
