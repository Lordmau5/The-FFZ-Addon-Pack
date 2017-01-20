// ==UserScript==
// @id          ffzap
// @name        The FrankerFaceZ Add-On Pack
// @namespace   FFZ-AP
//
// @version     2.0.1
// @updateURL   https://cdn.lordmau5.com/ffz-ap/injector.user.js
//
// @description A combination of add-ons for the Twitch extension "FrankerFaceZ"
// @author      Lordmau5
// @homepage    https://lordmau5.com/ffz-ap/
// @icon        https://cdn.lordmau5.com/ffz-ap/icon32.png
// @icon64      https://cdn.lordmau5.com/ffz-ap/icon64.png
// @icon128     https://cdn.lordmau5.com/ffz-ap/icon128.png
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

function ffzap_init() {
    var script = document.createElement('script');

    script.id = 'ffzap_script';
    script.type = 'text/javascript';
    script.src = 'https://cdn.lordmau5.com/ffz-ap/ffz-ap.min.js';

    document.head.appendChild(script);
}

ffzap_init();
