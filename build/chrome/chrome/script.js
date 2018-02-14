/*
	All code is publicly available at:
	https://github.com/Lordmau5/The-FFZ-Addon-Pack

	This script is solely an injector for the actual script,
	which is being appended into the document head on
	*.twitch.tv.

	No injection is made into the Chrome context.
*/

const script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn.ffzap.com/ffz-ap.min.js';
document.head.appendChild(script);
