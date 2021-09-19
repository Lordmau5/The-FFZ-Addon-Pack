// ==UserScript==
// @id          ffzap
// @name        The FrankerFaceZ Add-On Pack
// @namespace   FFZ-AP
//
// @version     3.1.2
// @updateURL   https://cdn.ffzap.com/injector.user.js
//
// @description A combination of add-ons for the Twitch extension "FrankerFaceZ"
// @author      Lordmau5
// @homepage    https://ffzap.com/
// @icon        https://cdn.ffzap.com/icon32.png
// @icon64      https://cdn.ffzap.com/icon64.png
// @icon128     https://cdn.ffzap.com/icon128.png
//
// @include     http://twitch.tv/*
// @include     https://twitch.tv/*
// @include     http://*.twitch.tv/*
// @include     https://*.twitch.tv/*
//
// @exclude     http://api.twitch.tv/*
// @exclude     https://api.twitch.tv/*
//
// @grant       none
// @run-at      document-end
// ==/UserScript==

function ffzapInit () {
	const checkFFZInterval = attempts => {
		if (window.ffz) {
			if (window.localStorage.ffz_ap_converted !== 'true') {
				const loadAddons = () => {
					window.ffz.addons.enableAddon('ffzap-core');
					window.ffz.addons.enableAddon('ffzap-bttv');
					window.ffz.addons.enableAddon('ffzap-liriklive');
					window.localStorage.ffz_ap_converted = true;
				};
	
				window.ffz.addons.on(':ready', loadAddons);
			}
		} else {
			const newAttempts = (attempts || 0) + 1;
			if (newAttempts < 60) {
				return setTimeout(checkFFZInterval.bind(this, newAttempts), 1000); // eslint-disable-line
			}
	
			console.warn(`[FFZ:AP Loader] Could not find FFZ. Injection unsuccessful. (Host: ${window.location.host})`);
		}
	};
	
	// Don't run on certain sub-domains.
	if (/^(?:player|im|chatdepot|tmi|api|spade|api-akamai|dev|)\./.test(window.location.hostname)) return;

	setTimeout(checkFFZInterval, 1000);
}

ffzapInit();
