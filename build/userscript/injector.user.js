// ==UserScript==
// @id          ffzap
// @name        The FrankerFaceZ Add-On Pack
// @namespace   FFZ-AP
//
// @version     3.1.0
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
	const ce = document.createElement.bind(document);
	const s = ce('script');
	s.type = 'text/javascript';
	s.src = 'https://cdn.ffzap.com/ffz-ap.min.js';
	document.head.appendChild(s);
}

ffzapInit();
