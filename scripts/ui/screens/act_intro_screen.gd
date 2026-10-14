extends Control

var main
const FLAVOR := {
	2: "The crypt gives way to a cavern choked with luminous rot. Spores drift like snow.",
	3: "Heat rises from below. At the bottom of the world, something sits upon a throne of embers.",
}

func _ready() -> void:
	var run := Session.run
	var act: int = run.data.act
	var box := UI.vbox(20)
	box.add_child(UI.label("ACT " + ["", "I", "II", "III"][act], 30, UI.MUTED, "head", HORIZONTAL_ALIGNMENT_CENTER))
	var title := UI.heading(EnemyDB.ACT_NAMES[act], 72, Color("e9e1cf"))
	box.add_child(title)
	var f := UI.label(FLAVOR.get(act, ""), 28, UI.TEXT, "italic", HORIZONTAL_ALIGNMENT_CENTER)
	f.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	f.custom_minimum_size.x = 900
	box.add_child(f)
	box.add_child(UI.label("You recover some of your strength.", 22, UI.MUTED, "body", HORIZONTAL_ALIGNMENT_CENTER))
	var b := UI.center_box(UI.button("Descend", func():
		run.dismiss_room()
		main.route()))
	b.custom_minimum_size.y = 90
	box.add_child(b)
	add_child(UI.center_box(box))
	box.modulate.a = 0
	create_tween().tween_property(box, "modulate:a", 1.0, 1.4)
	Audio.play("gong")
