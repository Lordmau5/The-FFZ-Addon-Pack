/* eslint strict: off */
/* global window, XMLHttpRequest */
/* eslint no-console: ["error", { allow: ["warn"] }] */

'use strict';

(() => {
    const script = window.document.createElement('script');

    const checkFFZInterval = ( attempts) => { // eslint-disable-line
        if (window.FrankerFaceZ) {
            window.document.head.appendChild(script);
        } else {
            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 60) {
                return setTimeout(checkFFZInterval.bind(this, newAttempts), 1000);
            }

            console.warn(`[FFZ:AP] Could not find FFZ. Injection unsuccessful. (Host: ${window.location.host})`);
        }
    };

    // Don't run on certain sub-domains.
    if (/^(?:player|im|chatdepot|tmi|api|spade|api-akamai|dev|)\./.test(window.location.hostname)) return;

    const DEBUG = window.localStorage.ffz_ap_debug_mode === 'true' && !window.Ember;
    const SERVER = DEBUG ? '//localhost:3000' : '//cdn.ffzap.com';
    const FLAVOR = window.Ember ? 'hades' : 'demeter';

    script.id = 'ffz-ap-script';
    script.src = `${SERVER}/script/${FLAVOR}.js`;

    if (DEBUG) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', script.src, true);
        xhr.onload = () => {
            console.warn('[FFZ:AP] Development server is present.');
            setTimeout(checkFFZInterval, 1000);
        };
        xhr.onerror = () => {
            console.warn('[FFZ:AP] Development server not present. Falling back to CDN.');
            script.src = `//cdn.ffzap.com/script/${FLAVOR}.js`;
            setTimeout(checkFFZInterval, 1000);
        };
        xhr.send(null);
    } else {
        setTimeout(checkFFZInterval, 1000);
    }
})();
