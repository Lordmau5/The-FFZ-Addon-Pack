export default class ProUser {
    constructor(parent, username, emotesArray) {
        this.parent = parent;

        this.username = username;
        this.emotesArray = emotesArray;

        this.initialize();
    }

    initialize() {
        this._id_emotes = `addon--ffzap.betterttv--emotes-pro-${this.username}`;

        this.loadEmotes();
    }

    loadEmotes() {
        this.emotes = [];

        for (let i = 0; i < this.emotesArray.length; i++) {
            const _emote = this.emotesArray[i];
            const emote = {
                urls: {
                    1: `https://cdn.betterttv.net/emote/${_emote.id}/1x`,
                    2: `https://cdn.betterttv.net/emote/${_emote.id}/2x`,
                    4: `https://cdn.betterttv.net/emote/${_emote.id}/3x`,
                },
                id: _emote.id,
                name: _emote.code,
                width: 28,
                height: 28,
                owner: {
                    display_name: _emote.channel || '',
                    name: _emote.channel || '',
                },
                require_spaces: true,
            };

            if (_emote.imageType === 'gif') {
                if (this.parent.getAnimatedEmoteMode() === this.parent.GIF_EMOTES_MODE.DISABLED) { // If the GIF setting is set to "Disabled", ignore it.
                    continue;
                } else if (this.parent.getAnimatedEmoteMode() === this.parent.GIF_EMOTES_MODE.STATIC) { // If the GIF setting is set to "Static", route them through the cache.
                    emote.urls[1] = `https://cache.ffzap.com/${emote.urls[1]}`;
                    emote.urls[2] = `https://cache.ffzap.com/${emote.urls[2]}`;
                    emote.urls[4] = `https://cache.ffzap.com/${emote.urls[4]}`;
                }
            }
            this.emotes.push(emote);
        }

        const set = {
            emoticons: this.emotes,
            title: 'Personal Emotes',
            source: 'BetterTTV',
            icon: 'https://cdn.betterttv.net/tags/developer.png',
        };

        if (this.emotes.length) {
            this.parent.emotes.loadSetData(this._id_emotes, set, true);
            this.parent.chat.getUser(undefined, this.username).addSet('addon--ffzap.betterttv', this._id_emotes);
        } else {
            this.parent.emotes.unloadSet(this._id_emotes);
        }
    }

    unload() {
        this.parent.emotes.unloadSet(this._id_emotes);
    }
}
