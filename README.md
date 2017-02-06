# The FFZ Add-On Pack

The FrankerFaceZ Add-On Pack, or FFZ Add-On Pack / FFZ:AP for short, is an extension for the already existing popular Twitch extension [FrankerFaceZ](https://www.frankerfacez.com/).

Formerly known as BetterTTV Emotes for FrankerFaceZ (BTTV4FFZ), FFZ:AP aims to be exactly that, but better.

FFZ:AP is written to be modular, so adding new add-ons is relatively easy.  
Have a look into the [template add-on file](src/addons/_template.js) to see the structure, or the [BetterTTV add-on file](src/addons/bttv.js) to see a working implementation.

Currently it only supports BetterTTV as an add-on, though MaiWaifu and GameWisp are already heavily being worked on.

## Download / Website

If you haven't come here for the code, you probably want to download the extension!

Just follow [this link](http://ffzap.lordmau5.com/) and it should give you the suggested download :)

It currently supports Chrome, Firefox and Userscripts (Tampermonkey, Greasemonkey, ...)

## Development

Do you want to help make FFZ:AP better by fixing bugs you found in an add-on?  
Do you want to make a new add-on entirely?

You'll need the recommended version of [NodeJS](https://nodejs.org/) installed.  
Afterwards, download the repository to a local folder.
Once that is done, open a command prompt or terminal in the folder and run:  
`npm install`  
After NPM finished the installation, just run `grunt dev`, which will start a local server on port 3000 and listen to changes in the add-ons to build a minified version.  
In your browser, open up the console and set `localStorage.ffz_ap_debug_mode` to `true`, then (re-)load a Twitch website.

If everything worked properly, the console should print:  
`FFZ:AP: Development Server is present.`

Now you can just edit away. The grunt task is recompiling the script and you just need to refresh the Twitch page once it's done.

## Stay up to date!

Do you want to stay up to date with the newest things happening?  
Make sure to follow the [official FFZ:AP Twitter account](https://www.twitter.com/FFZ_Addon_Pack) or join the [official Discord server](https://discord.me/ffz-ap).

## Credits
**mieDax**: _For the kick-ass logo we got!_  
**Wolsk**: _For the developer / supporter badge!_
**Jugachi**: _For reporting a ton of bugs during the lifespan of BTTV4FFZ, being an early FFZ:AP tester and being an early Gamewisp sub emote tester!_
