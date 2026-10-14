extends Control

var main

func _ready() -> void:
	var run := Session.run
	add_child(TopBar.new().setup(main))
	var room = run.data.room
	var box := UI.vbox(18)
	box.add_child(UI.heading("Treasure", 44))
	var chest := TextureButton.new()
	chest.texture_normal = UI.icon("chest")
	chest.ignore_texture_size = true
	chest.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	chest.custom_minimum_size = Vector2(200, 200)
	chest.self_modulate = Color("8a6a3a") if not room.opened else Color("e0b860")
	box.add_child(UI.center_box(chest))
	box.get_child(1).custom_minimum_size = Vector2(0, 210)
	if not room.opened:
		box.add_child(UI.label("An iron-bound chest, cold to the touch.", 24, UI.MUTED, "italic", HORIZONTAL_ALIGNMENT_CENTER))
		box.add_child(UI.center_box(UI.button("Open", func():
			run.open_treasure()
			Audio.play("chest")
			main.route())))
		chest.pressed.connect(func():
			run.open_treasure()
			Audio.play("chest")
			main.route())
	else:
		if room.relic != "":
			var r: Dictionary = RelicDB.RELICS[room.relic]
			var row := UI.hbox(18)
			row.add_child(UI.relic_icon(room.relic, 88))
			var t := UI.vbox(4)
			t.alignment = BoxContainer.ALIGNMENT_BEGIN
			t.add_child(UI.label(r.name, 30, UI.BRONZE_HI, "head"))
			var d := UI.label(r.desc, 22, UI.TEXT)
			d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			d.custom_minimum_size.x = 420
			t.add_child(d)
			row.add_child(t)
			box.add_child(row)
		var g := UI.gold_row(room.gold, 28)
		box.add_child(UI.center_box(g))
		box.get_child(box.get_child_count() - 1).custom_minimum_size = Vector2(0, 40)
		box.add_child(UI.center_box(UI.button("Continue", func():
			run.dismiss_room()
			main.route())))
	for c in box.get_children():
		if c is CenterContainer and c.custom_minimum_size.y == 0:
			c.custom_minimum_size.y = 70
	add_child(UI.center_box(UI.panel(box, 720)))
