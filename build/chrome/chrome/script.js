function start() {
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
start();