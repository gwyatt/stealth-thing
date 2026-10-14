extends PanelContainer
## How to play.

const TEXT := """[center][font_size=40][color=#d6b47a]HOW TO PLAY[/color][/font_size][/center]

You are the [b]Lanternkeeper[/b], carrying the last flame down through three acts of the Deep. Each act ends with a great foe. Defeat the Ember Tyrant to win.

[color=#d6b47a]THE MAP[/color]
Choose a path through each act. [b]Monsters[/b] give gold and cards. [b]Elites[/b] are deadly but carry relics. [b]Campfires[/b] let you heal or upgrade a card. [b]Merchants[/b] sell cards, relics, potions and card removal. [b]Unknown[/b] rooms hold strange encounters. [b]Treasure[/b] holds a relic.

[color=#d6b47a]COMBAT[/color]
Each turn you have [b]3 Energy[/b] and draw [b]5 cards[/b]. Enemies show their [b]intent[/b] above their heads. [b]Block[/b] absorbs damage until your next turn.

[color=#d6b47a]LIGHT[/color]
Your own resource. Many cards create [color=#e0a060]Light[/color]; others grow stronger with it or spend it for great effects. Light persists between turns (max 10), but 1 Light wanes at the end of each turn.

[color=#d6b47a]BURN[/color]
Burning creatures lose HP at the start of their turn, ignoring Block, then the Burn fades by 1.

[color=#d6b47a]CONTROLS[/color]
Mouse: click a card, then a target.  Keys: [b]1–9[/b] pick a card, [b]←/→[/b] change target, [b]Enter[/b] confirm, [b]E[/b] end turn, [b]D[/b] deck, [b]Esc[/b] menu.
Gamepad: D-pad to choose, [b]A[/b] confirm, [b]B[/b] back, [b]Y[/b] end turn, [b]X[/b] potions, [b]Start[/b] menu.

[color=#8a7f6e][i]Your journey is saved automatically between rooms.[/i][/color]"""

func _ready() -> void:
	add_theme_stylebox_override("panel", UI.panel_style())
	custom_minimum_size = Vector2(980, 0)
	var box := UI.vbox(18)
	add_child(box)
	var r := UI.rich(TEXT, 24)
	r.custom_minimum_size = Vector2(920, 0)
	box.add_child(r)
	box.add_child(UI.center_box(UI.button("Got it", func(): get_tree().get_first_node_in_group("main").close_overlay())))
	box.get_child(1).custom_minimum_size = Vector2(0, 70)
