/*
This is the main file for areustatus@carissimi.eu
For general infos see metadata.json
For style directives refer to stylesheet.css
*/

/*

If you want to test the extension in a sanboxed environment that 
displays only this estension's logs please use the following command

dbus-run-session -- gnome-shell --nested --wayland 2>&1 >/dev/null | grep 'carissimi.eu'

*/

/* Imports */
const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
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

/* The class that represents the button, extends PanelMenu.Button */
const AREUIndicator = new Lang.Class({
  Name: 'AREUIndicator',
  Extends: PanelMenu.Button,

  /* Is the constructor for the button */
  _init: function () {
	//Calls the super constructor
    this.parent(0.0, "AREU Indicator", false);

	//Creates the box that joins the icon and the label
	this._createButton();

	//Creates the menu
	this._createMenu();

	//Generates a new token
	this._refreshToken(this._loadData);

	//Starts the label-updating cycle
	this._refresh();
  },

  /* Initializes the button in the top bar */
  _createButton: function () {
	let box = new St.BoxLayout();

    this.buttonText = new St.Label({
		style_class: "button-text",
      	text: _("--"),
      	y_align: Clutter.ActorAlign.CENTER
    });

	this.icon = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/ambulance.svg`),
		style_class: "button-icon",
	});

	//Adds icon and label to the box
    box.add_actor(this.icon);
	box.add_actor(this.buttonText);

	//Add the box to the button
	this.actor.add_child(box);
  },

  /* Initializes the menu */
  _createMenu: function () {
	// Color codes submenu
	let colorCodes = new PopupMenu.PopupSubMenuMenuItem('Codici colore');

	// Create a counter for all color codes
	this.textRed = new St.Label({
		style_class: "menu-text menu-updatable color-counter",
      	text: _("0"),
    });
	let iconRed = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/red-dot.svg`),
		style_class: "icon color-codes-icon",
	});
	let boxRed = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxRed.add_actor(iconRed);
	boxRed.add_actor(this.textRed);

	this.textYellow = new St.Label({
		style_class: "menu-text menu-updatable color-counter",
      	text: _("0"),
    });
	let iconYellow = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/yellow-dot.svg`),
		style_class: "icon color-codes-icon",
	});
	let boxYellow = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxYellow.add_actor(iconYellow);
	boxYellow.add_actor(this.textYellow);

	this.textGreen = new St.Label({
		style_class: "menu-text menu-updatable color-counter",
      	text: _("0"),
    });
	let iconGreen = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/green-dot.svg`),
		style_class: "icon color-codes-icon",
	});
	let boxGreen = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxGreen.add_actor(iconGreen);
	boxGreen.add_actor(this.textGreen);

	this.textWhite = new St.Label({
		style_class: "menu-text menu-updatable color-counter",
      	text: _("0"),
    });
	let iconWhite = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/white-dot.svg`),
		style_class: "icon color-codes-icon",
	});
	let boxWhite = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxWhite.add_actor(iconWhite);
	boxWhite.add_actor(this.textWhite);

	// Add each color to the menu
	colorCodes.menu.box.add(boxRed);
	colorCodes.menu.box.add(boxYellow);
	colorCodes.menu.box.add(boxGreen);
	colorCodes.menu.box.add(boxWhite);

	//Vehicles indicator
	let vehicles = new PopupMenu.PopupSubMenuMenuItem('Mezzi');

	this.textMSB = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameMSB = new St.Label({
		style_class: "menu-text",
      	text: _("MSB: "),
    });
	let iconMSB = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/ambulance.svg`),
		style_class: "icon vehicles-icon",
	});
	let boxMSB = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxMSB.add_actor(iconMSB);
	boxMSB.add_actor(nameMSB);
	boxMSB.add_actor(this.textMSB);

	this.textMSI = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameMSI = new St.Label({
		style_class: "menu-text",
      	text: _("MSI: "),
    });
	let iconMSI = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/msi.svg`),
		style_class: "icon vehicles-icon",
	});
	let boxMSI = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxMSI.add_actor(iconMSI);
	boxMSI.add_actor(nameMSI);
	boxMSI.add_actor(this.textMSI);

	this.textMSA = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameMSA = new St.Label({
		style_class: "menu-text",
      	text: _("MSA: "),
    });
	let iconMSA = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/msa.svg`),
		style_class: "icon vehicles-icon",
	});
	let boxMSA = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxMSA.add_actor(iconMSA);
	boxMSA.add_actor(nameMSA);
	boxMSA.add_actor(this.textMSA);

	this.textELI = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameELI = new St.Label({
		style_class: "menu-text",
      	text: _("ELI: "),
    });
	let iconELI = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/eli.svg`),
		style_class: "icon vehicles-icon",
	});
	let boxELI = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxELI.add_actor(iconELI);
	boxELI.add_actor(nameELI);
	boxELI.add_actor(this.textELI);

	vehicles.menu.box.add(boxMSB);	
	vehicles.menu.box.add(boxMSI);
	vehicles.menu.box.add(boxMSA);
	vehicles.menu.box.add(boxELI);
	
	//Reasons indicator
	let reasons = new PopupMenu.PopupSubMenuMenuItem('Motivi');

	this.textMedicoAcuto = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameMedicoAcuto = new St.Label({
		style_class: "menu-text",
      	text: _("Medico Acuto: "),
    });
	let iconMedicoAcuto = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/medico_acuto.png`),
		style_class: "icon reason-icon",
	});
	let boxMedicoAcuto = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxMedicoAcuto.add_actor(iconMedicoAcuto);
	boxMedicoAcuto.add_actor(nameMedicoAcuto);
	boxMedicoAcuto.add_actor(this.textMedicoAcuto);

	this.textCaduta = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameCaduta = new St.Label({
		style_class: "menu-text",
      	text: _("Caduta: "),
    });
	let iconCaduta = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/caduta.png`),
		style_class: "icon reason-icon",
	});
	let boxCaduta = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxCaduta.add_actor(iconCaduta);
	boxCaduta.add_actor(nameCaduta);
	boxCaduta.add_actor(this.textCaduta);

	this.textIncidenteStradale = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameIncidenteStradale = new St.Label({
		style_class: "menu-text",
      	text: _("Incidente: "),
    });
	let iconIncidenteStradale = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/inc_stradale.png`),
		style_class: "icon reason-icon",
	});
	let boxIncidenteStradale = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxIncidenteStradale.add_actor(iconIncidenteStradale);
	boxIncidenteStradale.add_actor(nameIncidenteStradale);
	boxIncidenteStradale.add_actor(this.textIncidenteStradale);

	this.textInfortunio = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameInfortunio = new St.Label({
		style_class: "menu-text",
      	text: _("Infortunio: "),
    });
	let iconInfortunio = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/infortunio.png`),
		style_class: "icon reason-icon",
	});
	let boxInfortunio = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxInfortunio.add_actor(iconInfortunio);
	boxInfortunio.add_actor(nameInfortunio);
	boxInfortunio.add_actor(this.textInfortunio);

	this.textEventoViolento = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameEventoViolento = new St.Label({
		style_class: "menu-text",
      	text: _("Evento Violento: "),
    });
	let iconEventoViolento = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/evento_violento.png`),
		style_class: "icon reason-icon",
	});
	let boxEventoViolento = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxEventoViolento.add_actor(iconEventoViolento);
	boxEventoViolento.add_actor(nameEventoViolento);
	boxEventoViolento.add_actor(this.textEventoViolento);

	this.textIntossicazione = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("0"),
    });
	let nameIntossicazione = new St.Label({
		style_class: "menu-text",
      	text: _("Intossicazione: "),
    });
	let iconIntossicazione = new St.Icon({
		gicon: Gio.icon_new_for_string(`${Me.path}/icons/intossicazione.png`),
		style_class: "icon reason-icon",
	});
	let boxIntossicazione = new St.BoxLayout({
		style_class: "menu-item"
	});
	boxIntossicazione.add_actor(iconIntossicazione);
	boxIntossicazione.add_actor(nameIntossicazione);
	boxIntossicazione.add_actor(this.textIntossicazione);

	reasons.menu.box.add(boxMedicoAcuto);
	reasons.menu.box.add(boxCaduta);
	reasons.menu.box.add(boxIncidenteStradale);
	reasons.menu.box.add(boxInfortunio);
	reasons.menu.box.add(boxEventoViolento);
	reasons.menu.box.add(boxIntossicazione);	

	// Add the "last update" indicator
	let lastUpdateIndicator = new St.Label({
		style_class: "menu-text",
      	text: _("Last update: "),
    });
	this.lastUpdateHour = new St.Label({
		style_class: "menu-text menu-updatable",
      	text: _("never"),
    });
	let lastUpdate = new St.BoxLayout({
		style_class: "menu-item last-update"
	});
	lastUpdate.add_actor(lastUpdateIndicator);
	lastUpdate.add_actor(this.lastUpdateHour);
	
	// Assemble all menu items
	this.menu.addMenuItem(colorCodes);
	this.menu.addMenuItem(vehicles);
	this.menu.addMenuItem(reasons);
	this.menu.box.add(lastUpdate);
	
  },

  /* Updates menu text from json data */
  _updateMenu: function (json) {
	this.textRed.set_text(json.rosso);
	this.textYellow.set_text(json.giallo);
	this.textGreen.set_text(json.verde);
	this.textWhite.set_text(json.bianco);
	
	this.textMSB.set_text(json.msb);
	this.textMSI.set_text(json.msi);
	this.textMSA.set_text(json.msa);
	this.textELI.set_text(json.elisoccorso);

	this.textMedicoAcuto.set_text(json.medico_acuto);
	this.textCaduta.set_text(json.caduta);
	this.textIncidenteStradale.set_text(json.incidente_stradale);
	this.textInfortunio.set_text(json.infortunio);
	this.textEventoViolento.set_text(json.evento_violento);
	this.textIntossicazione.set_text(json.intossicazione);

	this.lastUpdateHour.set_text(json.aggiornato_alle);
  },
  
  /* Updates button's text from a string */
  _updateButton: function (string) {
	this.buttonText.set_text(string);
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
	this._updateButton(ret.msb);
	//Sets menu text
	this._updateMenu(ret);

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
