const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

const API_LINK = "https://www.areu.lombardia.it/api/jsonws/areu-eventi-regione-portlet.regioneeventijson/statistiche-regione";
const TOKEN_LINK = "https://www.areu.lombardia.it/web/home/missioni-aat-real-time";
const TOKEN_KEY = "Liferay.authToken=";
const TOKEN_LENGTH = 8;
const SECONDS = 120;
const AAT = "MILANO";

let auth = "";

// TEST CMD = dbus-run-session -- gnome-shell --nested --wayland 2>&1 >/dev/null | grep 'carissimi.eu'

let _httpSession;
const AREUIndicator = new Lang.Class({
  Name: 'AREUIndicator',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "AREU Indicator", false);

	let box = new St.BoxLayout();

    this.buttonText = new St.Label({
		style_class: "areu-msb-text",
      	text: _("--"),
      	y_align: Clutter.ActorAlign.CENTER
    });

	this.icon = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/ambulance.svg`),
		style_class: "areu-msb-icon",
	});

    box.add_actor(this.icon);
	box.add_actor(this.buttonText);

	this.actor.add_child(box);

	this._refreshToken(this._loadData);
	this._refresh();
  },

  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(SECONDS, Lang.bind(this, this._refresh));
    return true;
  },

  _refreshToken: function(_callback) {
	_httpSession = new Soup.Session();
	let message = Soup.Message.new('GET', TOKEN_LINK);
	_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
		if (message.status_code !== 200){
			return;
		}
		let response = message.response_body.data;
		auth = response.substring(response.indexOf(TOKEN_KEY)+TOKEN_KEY.length+1);
		auth = auth.substring(0, TOKEN_LENGTH);
		global.log("areustatus@carissimi.eu -> Got new token: " + auth);
		this._loadData();
		}
	)
	);
	
  },

  _loadData: function () {
	if(auth !== "") {
		global.log("areustatus@carissimi.eu -> Token is: " + auth);

		let params = {
			p_auth : auth
		};
		_httpSession = new Soup.Session();
		let message = Soup.form_request_new_from_hash('GET', API_LINK, params);

		_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
				if (message.status_code !== 200){
					this._refreshToken(this._refresh());
					return;
				}
				let json = JSON.parse(message.response_body.data);
				this._refreshUI(json);
			}
		)
		);
	}
	
  },

  _refreshUI: function (json) {

	const PERIOD = "in_corso";
	
	let ret;
	for(let i = 0; i<json[PERIOD].length;i++){
		if(json[PERIOD][i].aat == AAT.toUpperCase()){
		ret = json[PERIOD][i];
		break;
		}
	}

	global.log("areustatus@carissimi.eu -> updated data (last update " + ret.aggiornato_alle + ")");

	this.buttonText.set_text(ret.msb);

  },

  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (_httpSession !== undefined)
      _httpSession.abort();
    _httpSession = undefined;

    if (this._timeout)
      Mainloop.source_remove(this._timeout);
    this._timeout = undefined;

    this.menu.removeAll();
  }
});

let areuMenu;

function init() {
}

function enable() {
	areuMenu = new AREUIndicator;
	//Main.panel.addToStatusArea('areu-indicator', areuMenu);
	Main.panel._addToPanelBox('areu-indicator', areuMenu, 1, Main.panel._centerBox);
}

function disable() {
	areuMenu.stop();
	areuMenu.destroy();
}
