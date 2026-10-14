extends Control
## The merchant.

var main
var _bar: TopBar
var _content: VBoxContainer

func _ready() -> void:
	_bar = TopBar.new().setup(main)
	add_child(_bar)
	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	scroll.offset_top = 120
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	_content = UI.vbox(18)
	_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_content)
	_rebuild()

func _rebuild() -> void:
	var run := Session.run
	var stock: Dictionary = run.data.room.stock
	for c in _content.get_children():
		c.queue_free()
	var head := UI.hbox(30)
	var portrait := TextureRect.new()
	portrait.texture = UI.tex("res://assets/art/creatures/merchant.png")
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.custom_minimum_size = Vector2(230, 230)
	head.add_child(portrait)
	head.add_child(UI.label("\"Heh heh... Light's scarce down here, friend.\nEverything else has a price.\"", 28, Color("cfc5b2"), "italic"))
	_content.add_child(head)

	_content.add_child(UI.label("CARDS", 22, UI.BRONZE, "head", HORIZONTAL_ALIGNMENT_CENTER))
	var cards := UI.hbox(34)
	for i in stock.cards.size():
		var item: Dictionary = stock.cards[i]
		var holder := Control.new()
		holder.custom_minimum_size = CardView.SIZE + Vector2(0, 44)
		if item.sold:
			holder.add_child(UI.label("Sold", 24, UI.MUTED, "italic", HORIZONTAL_ALIGNMENT_CENTER))
		else:
			var price := run.price(item.price)
			var view := CardView.new().setup({"uid": "shop%d" % i, "id": item.id, "up": false}, null, price, run.data.gold < price)
			var idx: int = i
			view.clicked.connect(func(_v): _buy("cards", idx))
			view.mouse_entered.connect(func(): view.create_tween().tween_property(view, "scale", Vector2(1.06, 1.06), 0.1))
			view.mouse_exited.connect(func(): view.create_tween().tween_property(view, "scale", Vector2.ONE, 0.1))
			holder.add_child(view)
			if item.get("sale", false):
				var tag := UI.label("SALE", 18, Color("f0d0c0"), "head_bold")
				tag.position = Vector2(170, -16)
				tag.rotation = 0.15
				tag.add_theme_constant_override("outline_size", 6)
				tag.add_theme_color_override("font_outline_color", UI.BLOOD)
				holder.add_child(tag)
		cards.add_child(holder)
	_content.add_child(cards)

	var lower := UI.hbox(70)
	lower.add_child(_section("RELICS", stock.relics, "relics"))
	lower.add_child(_section("POTIONS", stock.potions, "potions"))
	var rem := UI.vbox(8)
	rem.add_child(UI.label("CARD REMOVAL", 22, UI.BRONZE, "head", HORIZONTAL_ALIGNMENT_CENTER))
	if stock.remove_used:
		rem.add_child(UI.label("Used", 22, UI.MUTED, "italic", HORIZONTAL_ALIGNMENT_CENTER))
	else:
		rem.add_child(_ware(UI.icon_rect("flame", 64, Color("c8602a")), run.remove_price(), "Remove a card from your deck.", func():
			if run.data.gold < run.remove_price():
				_deny("Not enough Gold")
				return
			main.open_deck(run.data.deck, "Remove a Card", func(uid):
				var r := run.buy_removal(uid)
				if r.ok:
					Audio.play("gold")
					_rebuild(), false, "Cancel")))
	lower.add_child(rem)
	_content.add_child(lower)
	var c := UI.center_box(UI.button("Leave", func():
		run.dismiss_room()
		main.route()))
	c.custom_minimum_size.y = 90
	_content.add_child(c)
	_bar.refresh()
	Session.save()

func _section(title: String, items: Array, kind: String) -> VBoxContainer:
	var run := Session.run
	var v := UI.vbox(8)
	v.add_child(UI.label(title, 22, UI.BRONZE, "head", HORIZONTAL_ALIGNMENT_CENTER))
	var row := UI.hbox(14)
	for i in items.size():
		var it: Dictionary = items[i]
		if it.sold:
			row.add_child(UI.label("Sold", 22, UI.MUTED, "italic"))
			continue
		var icon: Control
		var tip: String
		if kind == "relics":
			icon = UI.relic_icon(it.id, 72)
			tip = "%s\n%s" % [RelicDB.RELICS[it.id].name, RelicDB.RELICS[it.id].desc]
		else:
			icon = UI.potion_icon(it.id, 64)
			tip = "%s\n%s" % [PotionDB.POTIONS[it.id].name, PotionDB.POTIONS[it.id].desc]
		var idx: int = i
		row.add_child(_ware(icon, run.price(it.price), tip, func(): _buy(kind, idx)))
	v.add_child(row)
	return v

func _ware(icon: Control, price: int, tip: String, cb: Callable) -> Button:
	var b := Button.new()
	b.custom_minimum_size = Vector2(110, 130)
	b.tooltip_text = tip
	var v := UI.vbox(6)
	v.set_anchors_preset(Control.PRESET_FULL_RECT)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var ic := UI.center_box(icon)
	ic.set_anchors_preset(Control.PRESET_TOP_LEFT)
	ic.custom_minimum_size = Vector2(110, 80)
	v.add_child(ic)
	var pr := UI.gold_row(price, 22, UI.BAD if Session.run.data.gold < price else UI.BRONZE_HI)
	v.add_child(pr)
	b.add_child(v)
	b.pressed.connect(cb)
	return b

func _buy(kind: String, i: int) -> void:
	var r := Session.run.buy(kind, i)
	if not r.ok:
		_deny(r.get("reason", "Cannot buy that"))
		return
	Audio.play("gold")
	_rebuild()

func _deny(reason: String) -> void:
	Audio.play("error")
	main.toast(reason)
