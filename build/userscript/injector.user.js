// ==UserScript==
// @id          ffzap
// @name        The FrankerFaceZ Add-On Pack
// @namespace   FFZ-AP
//
// @version     3.0.1
// @updateURL   https://cdn.ffzap.download/injector.user.js
//
// @description A combination of add-ons for the Twitch extension "FrankerFaceZ"
// @author      Lordmau5
// @homepage    https://ffzap.download/
// @icon        https://cdn.ffzap.download/icon32.png
// @icon64      https://cdn.ffzap.download/icon64.png
// @icon128     https://cdn.ffzap.download/icon128.png
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
  var script = document.createElement('script');

  script.id = 'ffzap_script';
  script.type = 'text/javascript';
  if (localStorage.ffz_ap_debug_mode === 'true') {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://localhost:3000/', true);
    xhr.onload = function (e) {
      console.log('FFZ:AP: Development Server is present.');
      script.src = 'https://localhost:3000/ffz-ap.js';
      document.body.classList.add('ffz-ap-dev');
      document.head.appendChild(script);
    };
    xhr.onerror = function (e) {
      console.log('FFZ:AP: Development Server is not present. Using CDN.');
      script.src = 'https://direct.lordmau5.com/ffz-ap/ffz-ap.js?_=' + Date.now();
      document.head.appendChild(script);
    };
    return xhr.send(null);
  } else {
    script.src = 'https://cdn.ffzap.download/ffz-ap.min.js';
    document.head.appendChild(script);
  }
}

ffzapInit();
