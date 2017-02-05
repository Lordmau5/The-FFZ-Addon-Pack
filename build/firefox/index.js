var pageMod = require("sdk/page-mod");

pageMod.PageMod({
	include: "*.twitch.tv",
	contentScriptFile: './loader.js'
});
