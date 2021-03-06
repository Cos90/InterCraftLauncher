const fs = require('fs');
const jetpack = require('fs-jetpack');

const minecraft = require('../minecraft/minecraft');
const profileManager = require('../minecraft/profile_manager');

const Window = require('./window').Window;

class ControlPanel extends Window {
	constructor() {
		super({
			width: 1280,
			height: 720,
			frame: true,
			minWidth: 992,
			minHeight: 500
		});

		this._isReady = false;
		this._showWhenReady = false;

		// this.window().openDevTools();
		this.window().once('ready-to-show', () => { this.init()	});

		this.listen('control_panel_done', (payload) => { this.initFinished(payload); });
		this.listen('control_panel_launch_minecraft', (payload) => { this.launchMinecraft(payload); });
		this.listen('control_panel_load_accounts', (payload) => { this.loadAccounts(); });
		this.listen('control_panel_minecraft_login', (payload) => { this.minecraftLogin(payload); });
		this.listen('view_load', (payload) => { this.loadView(payload); });

		this.setName('control_panel');
		this.setView('control_panel');
	}

	init() {
		this.send('control_panel_preload', {
			'accounts': minecraft.profileManager().accountsAvailable(),
			'profiles': minecraft.profileManager().profilesAvailable(),
		});
	}

	initFinished(payload) {
		this._isReady = true;
		if (this._showWhenReady)
			this.show();
	}

	showWhenReady() {
		if (this._isReady)
			this.show();
		else
			this._showWhenReady = true;
	}

	launchMinecraft(payload) {
		this.setLaunchEnabled(false);

		var account = minecraft.profileManager().activeAccount();
		var profile = minecraft.profileManager().profile(payload.profile);

		// Validate the access token
		minecraft.authentication().validate(account, minecraft.profileManager().clientToken(), (result) => {
			if (result) {
				// If it's valid, refresh it
				minecraft.authentication().refresh(account, minecraft.profileManager().clientToken(), (result) => {
					if (result) {
						// If everything went smoothely, launch the Minecraft instance
						minecraft.launcher().launch(profile, account, (result) => {});
					}
					this.setLaunchEnabled(true);
				});
			} else {
				this.requestMinecraftLogin(account);
				this.setLaunchEnabled(true);
			}
		});
	}

	minecraftLogin(payload) {
		minecraft.authentication().authenticate(
			payload.email,
			payload.password,
			minecraft.profileManager().clientToken(),
			(account) => {
				if (account) {
					console.log("Adding account...");
					account.setRemember(payload.remember);
					profileManager.addAccount(account);
					this.send('control_panel_minecraft_login_result', true);
					this.loadAccounts();
				} else
					this.send('control_panel_minecraft_login_result', false);
			});
	}

	requestMinecraftLogin(account) {
		console.log("Requesting minecraft login...");
		this.send('control_panel_minecraft_login_request', {
			'email': account.email(),
			'remember': account.remember(),
			'callback': 'launch'
		});
	}

	setLaunchEnabled(enabled) {
		this.send('contorl_panel_launch_button_enabled', enabled);
	}

	loadAccounts() {
		this.send('control_panel_load_accounts_result', minecraft.profileManager().accountsAvailable());
	}

	loadView(payload) {
		console.log(jetpack.cwd('./app/views').path(payload.view + '.htm'));
		fs.readFile(jetpack.cwd('./app/views').path(payload.view + '.htm'), 'utf8', (err, contents) => {
			if (err)
				console.log("ERROR: Failed to load view:", payload.view);
			payload.html = contents;
			console.log("Sending view...");
			this.send('view_result', payload);
		});
	}
}

exports.ControlPanel = ControlPanel;
