/*
This is the preference window source.
You can find it using "extensions" app and clicking
on the gear icon.
*/

const {GObject, Gtk} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const PrefsWidget = new GObject.Class({
    Name: 'PrefsWidget',

    _init: function(params = {}) {
        this.parent(params);
        this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.areustatus');

        this.builder = new Gtk.Builder();
        this.builder.add_from_file(Me.path + '/prefs.ui');

        //Set active text
        this.builder.get_object('position_selector').set_active(this.settings.get_int('position'));
        this.builder.get_object('aat_selector').set_active(this.settings.get_int('aat'));

        //Set action when changed
		this.builder.get_object('aat_selector').connect('changed', this._AATchanged.bind(this));
        this.builder.get_object('position_selector').connect('changed', this._positionChanged.bind(this));

        this.widget = this.builder.get_object('prefs-container');
    },
    
    /* Changes the settings when AAT selector changes */
	_AATchanged: function(combo) {
		let selected = combo.get_active();
		this.settings.set_int('aat', selected);
	},

	/* Changes the settings when position selector changes */
	_positionChanged: function(combo){
		let selected = combo.get_active();
		this.settings.set_int('position', selected);
	}
});

function init() {

}

function buildPrefsWidget() {
    let settings = new PrefsWidget()
    let widget = settings.widget;

	widget.show();
	return widget;
}
