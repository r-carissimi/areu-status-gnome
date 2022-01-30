/*
This is the main file for areustatus@carissimi.eu
For general infos see metadata.json
For style directives refer to stylesheet.css
*/

/* Imports */
const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

/* Constants declaration */
//AREU JSON API link
const API_LINK = "https://www.areu.lombardia.it/api/jsonws/areu-eventi-regione-portlet.regioneeventijson/statistiche-regione";
//Link to get the token (is just the AREU stats website)
const TOKEN_LINK = "https://www.areu.lombardia.it/web/home/missioni-aat-real-time";
//What to search to find the token
const TOKEN_KEY = "Liferay.authToken=";
//Token string length
const TOKEN_LENGTH = 8;
//Refresh time in seconds
const SECONDS = 120;
//AAT (province) you want to show
const AAT = "MILANO";

//Global variable for the current token
let auth = "";
//Is needed for the HTTP fetcher
let _httpSession;

// TEST CMD = dbus-run-session -- gnome-shell --nested --wayland 2>&1 >/dev/null | grep 'carissimi.eu'

/* The class that represents the button, extends PanelMenu.Button */
const AREUIndicator = new Lang.Class({
  Name: 'AREUIndicator',
  Extends: PanelMenu.Button,

  /* Is the constructor for the button */
  _init: function () {
	//Calls the super constructor
    this.parent(0.0, "AREU Indicator", false);

	//Creates the box that joins the icon and the label
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

	//Adds icon and label to the box
    box.add_actor(this.icon);
	box.add_actor(this.buttonText);

	//Add the box to the button
	this.actor.add_child(box);

	//Generates a new token
	this._refreshToken(this._loadData);

	//Starts the label-updating cycle
	this._refresh();
  },

  /* Refreshes the data in the button */
  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
	//Generates the timer
    this._timeout = Mainloop.timeout_add_seconds(SECONDS, Lang.bind(this, this._refresh));
    return true;
  },

  /* Refreshes the token, fetched from the AREU's website */
  _refreshToken: function(_callback) {
	//Fetches a token from the AREU API's
	_httpSession = new Soup.Session();
	let message = Soup.Message.new('GET', TOKEN_LINK);
	_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
		if (message.status_code !== 200){
			//Nothing is done if page is not correctly fetched
			return;
		}
		//Extracts the token from the page source
		let response = message.response_body.data;
		auth = response.substring(response.indexOf(TOKEN_KEY)+TOKEN_KEY.length+1);
		auth = auth.substring(0, TOKEN_LENGTH);
		//Logs the data
		global.log("areustatus@carissimi.eu -> Got new token: " + auth);
		//Updates the data
		this._loadData();
		}
	)
	);
	
  },

  /* Loads the data from the website and updates the UI */
  _loadData: function () {
	//Fetches the data only if there's a token
	if(auth !== "") {
		global.log("areustatus@carissimi.eu -> Token is: " + auth);

		//Fetches the data from the API
		let params = {
			p_auth : auth
		};
		_httpSession = new Soup.Session();
		let message = Soup.form_request_new_from_hash('GET', API_LINK, params);

		_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
				if (message.status_code !== 200){
					//If data is not fetched correctly it tries to refresh the token
					this._refreshToken(this._refresh());
					return;
				}
				//Updates the UI
				let json = JSON.parse(message.response_body.data);
				this._refreshUI(json);
			}
		)
		);
	}
	
  },

  /* Updates the UI with the JSON data */
  _refreshUI: function (json) {

	//We want to select only the real time data
	const PERIOD = "in_corso";
	
	//Finds the right AAT (province), it's associated to an index
	let ret;
	for(let i = 0; i<json[PERIOD].length;i++){
		if(json[PERIOD][i].aat == AAT.toUpperCase()){
		ret = json[PERIOD][i];
		break;
		}
	}

	global.log("areustatus@carissimi.eu -> updated data (last update " + ret.aggiornato_alle + ")");

	//Sets the button text to the number of ambulances out in service
	this.buttonText.set_text(ret.msb);

  },

  /* Deletes the updating cycle */
  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  /* Stops the button refresh cycle */
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

//Variable for the button object
let areuMenu;

/* This is run when you install the extension */
function init() {
}

/* This is run when you enable the extension */
function enable() {
	areuMenu = new AREUIndicator;
	//Main.panel.addToStatusArea('areu-indicator', areuMenu);
	Main.panel._addToPanelBox('areu-indicator', areuMenu, 1, Main.panel._centerBox);
}

/* This is run when you disable the extension */
function disable() {
	areuMenu.stop();
	areuMenu.destroy();
}
