/*
This is the preference window source.
You can find it using "extensions" app and clicking
on the gear icon.
*/

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const ExtensionUtils = imports.misc.extensionUtils;


function init(){

}

function buildPrefsWidget(){
	let widget = new MyPrefsWidget();
	widget.show_all();
	return widget; 
} 

const MyPrefsWidget = new GObject.Class({
	Name : "AREU Status Settings",
	GTypeName : "AREUStatusSettings",
	Extends : Gtk.Box,

	_init: function (params){
		this.parent(params);
		this.margin = 20;
		this.set_spacing(15);
		this.set_orientation(Gtk.Orientation.VERTICAL);

		this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.areustatus');

		/*
        ** AAT SELECTOR
        */
        this.aatBox = new Gtk.HBox({ spacing: 8, margin: 8, homogeneous: true });

        // Select label
        this.aat_label = new Gtk.Label({ halign : Gtk.Align.START });
        this.aat_label.set_markup("Provincia");

        // Dropdown menu
        this.modelAAT = new Gtk.ListStore();
        this.modelAAT.set_column_types([GObject.TYPE_INT, GObject.TYPE_STRING]);

        this.comboboxAAT = new Gtk.ComboBox({model: this.modelAAT });
        let redrererAAT = new Gtk.CellRendererText();
        this.comboboxAAT.pack_start(redrererAAT, true);
        this.comboboxAAT.add_attribute(redrererAAT, 'text', 1);

        this.modelAAT.set(this.modelAAT.append(), [0, 1], [0,"Bergamo"]);
        this.modelAAT.set(this.modelAAT.append(), [0, 1], [1,"Brescia"]);
        this.modelAAT.set(this.modelAAT.append(), [0, 1], [2,"Como"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [3,"Cremona"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [4,"Lecco"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [5,"Lodi"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [6,"Mantova"]);
        this.modelAAT.set(this.modelAAT.append(), [0, 1], [7,"Milano"]);
        this.modelAAT.set(this.modelAAT.append(), [0, 1], [8,"Monza"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [9,"Pavia"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [10,"Sondrio"]);
		this.modelAAT.set(this.modelAAT.append(), [0, 1], [11,"Varese"]);

        this.comboboxAAT.set_active(this.settings.get_int('aat'));
        
        // Connect changed callback
        this.comboboxAAT.connect('changed', Lang.bind(this, this._AATchanged));

        this.aatBox.pack_start(this.aat_label, true, true, 0);
        this.aatBox.pack_start(this.comboboxAAT, true, true, 0);

		/*
        ** POSITION SELECTOR
        */
        this.positionBox = new Gtk.HBox({ spacing: 8, margin: 8, homogeneous: true });

        // Select label
        this.position_label = new Gtk.Label({ halign : Gtk.Align.START });
        this.position_label.set_markup("Posizione (reload required)");

        // Dropdown menu
        this.modelPosition = new Gtk.ListStore();
        this.modelPosition.set_column_types([GObject.TYPE_INT, GObject.TYPE_STRING]);

        this.comboboxPosition = new Gtk.ComboBox({model: this.modelPosition });
        let rendererPosition = new Gtk.CellRendererText();
        this.comboboxPosition.pack_start(rendererPosition, true);
        this.comboboxPosition.add_attribute(rendererPosition, 'text', 1);

        this.modelPosition.set(this.modelPosition.append(), [0, 1], [0,"Sinistra"]);
        this.modelPosition.set(this.modelPosition.append(), [0, 1], [1,"Centro"]);
        this.modelPosition.set(this.modelPosition.append(), [0, 1], [2,"Destra"]);

        this.comboboxPosition.set_active(this.settings.get_int('position'));
        
        // Connect changed callback
        this.comboboxPosition.connect('changed', Lang.bind(this, this._positionChanged));

        this.positionBox.pack_start(this.position_label, true, true, 0);
        this.positionBox.pack_start(this.comboboxPosition, true, true, 0);

		// AAT selector
        this.pack_start(this.aatBox, false, false, 0);
		// Position selector
		this.pack_start(this.positionBox, false, false, 0);

	},

	/* Changes the settings when AAT selector changes */
	_AATchanged: function () {
		let selected = this.comboboxAAT.get_active();
		this.settings.set_int('aat', selected);
	},

	/* Changes the settings when position selector changes */
	_positionChanged: function () {
		let selected = this.comboboxPosition.get_active();
		this.settings.set_int('position', selected);
	}

});