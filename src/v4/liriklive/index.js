/* global FrankerFaceZ, fetch */

import Socket from './socket';

const GIF_EMOTES_MODE = {
    DISABLED: 0,
    STATIC: 1,
    ANIMATED: 2,
};

class LirikLIVE extends FrankerFaceZ.utilities.addon.Addon {
    constructor(...args) {
        super(...args);

        this.inject('settings');
        this.inject('chat');
        this.inject('chat.emotes');
        this.inject('site');

        this.settings.add('ffzap.liriklive.global_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > Lirik LIVE >> Emotes',
                title: 'Global Emotes',
                description: 'Enable to show LIRIK LIVE global emotes.',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.liriklive.gif_emotes_mode', {
            default: 2,

            ui: {
                path: 'Add-Ons > Lirik LIVE >> Emotes',
                title: 'GIF Emotes',
                description: 'Change the mode of how GIF emotes are showing up.',
                component: 'setting-select-box',
                data: [
                    { value: 0, title: 'Disabled' },
                    { value: 1, title: 'Enabled (Static GIF Emotes)' },
                    { value: 2, title: 'Enabled (Animated GIF Emotes)' },
                ],
            },
        });

        this.settings.add('ffzap.liriklive.sub_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > Lirik LIVE >> Emotes',
                title: 'Subscriber Emotes',
                description: 'Enable to show additional LIRIK LIVE subscriber emotes.',
                component: 'setting-check-box',
            },
        });

        this.chat.context.on('changed:ffzap.liriklive.global_emoticons', this.updateEmotes, this);
        this.chat.context.on('changed:ffzap.liriklive.gif_emotes_mode', this.updateEmotes, this);
        this.chat.context.on('changed:ffzap.liriklive.sub_emoticons', this.updateEmotes, this);

        this.socket = false;
        this._last_emote_id = 0;

        this.enable();
    }

    onEnable() {
        this.log.debug('FFZ:AP\'s Lirik LIVE module was enabled successfully.');

        this.updateEmotes();

        this.socket = new Socket(this);

        if (this.chat.context.get('ffzap.liriklive.sub_emoticons')) {
            this.socket.connect();
        }

        this.on('chat:room-add', this.roomAdd);
        this.on('chat:room-remove', this.roomRemove);
        this.on('chat:pre-send-message', this.preSendMessage);

        for (const room of this.chat.iterateRooms()) {
            if (room) this.roomAdd(room);
        }
    }

    roomAdd(room) {
        this.socket.joinRoom(room.id);
    }

    roomRemove(room) {
        this.socket.leaveRoom(room.id);
    }

    preSendMessage(event) {
        if (!this.chat.context.get('ffzap.liriklive.sub_emoticons')) {
            return;
        }

        const room = this.chat.getRoom(null, event.channel, true);
        if (!room || !room.id) {
            return;
        }

        this.socket.announceMessage(room.id);
    }

    updateGlobalEmotes(data) {
        const realID = 'addon--ffzap.liriklive--emotes-global';
        this.emotes.removeDefaultSet('addon--ffzap.liriklive', realID);
        this.emotes.unloadSet(realID);

        if (!this.chat.context.get('ffzap.liriklive.global_emoticons')) {
            return;
        }

        const emotes = [];

        const { global, gifs } = data;

        if (global) {
            for (const dataEmote of global) {
                const emote = {
                    id: ++this._last_emote_id,
                    name: dataEmote.code,
                    width: dataEmote.width || 28,
                    height: dataEmote.height || 28,
                };

                if (dataEmote.id) {
                    emote.urls = {
                        1: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/1.0`,
                        2: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/2.0`,
                        4: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/3.0`,
                    };
                } else {
                    emote.urls = {
                        1: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_1.png`,
                        2: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_2.png`,
                        4: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_4.png`,
                    };
                }

                emotes.push(emote);
            }
        }

        if (gifs) {
            const gifMode = this.chat.context.get('ffzap.liriklive.gif_emotes_mode');
			if (gifMode !== GIF_EMOTES_MODE.DISABLED) { // eslint-disable-line
                for (const emoteName of gifs) {
                    const emote = {
                        id: ++this._last_emote_id,
                        urls: {
                            1: `https://cdn.ffzap.com/liriklive/gifs/${emoteName}_1.gif`,
                            2: `https://cdn.ffzap.com/liriklive/gifs/${emoteName}_2.gif`,
                            4: `https://cdn.ffzap.com/liriklive/gifs/${emoteName}_4.gif`,
                        },
                        name: emoteName,
                        width: 28,
                        height: 28,
                        modifier: emoteName === 'lirikRAIN',
                    };

                    if (gifMode === GIF_EMOTES_MODE.STATIC) {
                        emote.urls[1] = `https://cache.ffzap.com/${emote.urls[1]}`;
                        emote.urls[2] = `https://cache.ffzap.com/${emote.urls[2]}`;
                        emote.urls[4] = `https://cache.ffzap.com/${emote.urls[4]}`;
                    }
	
                    emotes.push(emote);
                }
            }
        }

        if (emotes.length === 0) {
            return;
        }

        const set = {
            emoticons: emotes,
            title: 'Past Emotes',
            source: 'LIRIK LIVE',
            icon: 'https://cdn.ffzap.com/liriklive/icon.png',
            sort: 51,
            force_global: (emote_set, channel) => channel && channel.login === 'lirik',
        };

        this.emotes.addDefaultSet('addon--ffzap.liriklive', realID, set);
    }

    updateSubscriberEmotes(data) {
        const realID = 'addon--ffzap.liriklive--emotes-subscriber';
        this.emotes.unloadSet(realID);

        if (!this.chat.context.get('ffzap.liriklive.sub_emoticons')) {
            return;
        }

        const emotes = [];

        const { subscriber } = data;

        if (subscriber) {
            for (const dataEmote of subscriber) {
                const emote = {
                    id: ++this._last_emote_id,
                    name: dataEmote.code,
                    width: dataEmote.width || 28,
                    height: dataEmote.height || 28,
                };

                if (dataEmote.id) {
                    emote.urls = {
                        1: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/1.0`,
                        2: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/2.0`,
                        4: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/3.0`,
                    };
                } else {
                    emote.urls = {
                        1: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_1.png`,
                        2: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_2.png`,
                        4: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_4.png`,
                    };
                }

                emotes.push(emote);
            }
        }

        if (emotes.length === 0) {
            return;
        }

        const set = {
            emoticons: emotes,
            title: 'Subscriber Emotes',
            source: 'LIRIK LIVE',
            icon: 'https://cdn.ffzap.com/liriklive/icon.png',
            merge_id: 'addon--ffzap.liriklive--emotes-global',
        };

        this.emotes.loadSetData(realID, set);
    }

    updateRestrictedEmotes(data) {
        const realID = 'addon--ffzap.liriklive--emotes-restricted';
        this.emotes.unloadSet(realID);

        if (!this.chat.context.get('ffzap.liriklive.sub_emoticons')) {
            return;
        }

        const emotes = [];

        const { restricted } = data;

        if (restricted) {
            for (const dataEmote of restricted) {
                const emote = {
                    id: ++this._last_emote_id,
                    name: dataEmote.code,
                    width: dataEmote.width || 28,
                    height: dataEmote.height || 28,
                };

                if (dataEmote.id) {
                    emote.urls = {
                        1: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/1.0`,
                        2: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/2.0`,
                        4: `https://static-cdn.jtvnw.net/emoticons/v1/${dataEmote.id}/3.0`,
                    };
                } else {
                    emote.urls = {
                        1: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_1.png`,
                        2: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_2.png`,
                        4: `https://cdn.ffzap.com/liriklive/normal/${emote.name}_4.png`,
                    };
                }

                emotes.push(emote);
            }
        }

        if (emotes.length === 0) {
            return;
        }

        const set = {
            emoticons: emotes,
            title: 'Restricted Emotes',
            source: 'LIRIK LIVE',
            icon: 'https://cdn.ffzap.com/liriklive/icon.png',
            merge_id: 'addon--ffzap.liriklive--emotes-global',
        };

        this.emotes.loadSetData(realID, set);
    }

    async updateEmotes(attempts = 0) {
        this._last_emote_id = 0;

        if (!this.chat.context.get('ffzap.liriklive.global_emoticons') && !this.chat.context.get('ffzap.liriklive.sub_emoticons')) {
            return;
        }

        const response = await fetch('https://cdn.ffzap.com/liriklive/emotes.json');
        if (response.ok) {
            const data = await response.json();

            this.updateGlobalEmotes(data);
            this.updateSubscriberEmotes(data);
            this.updateRestrictedEmotes(data);
        } else {
            if (response.status === 404) return;

            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 12) {
                this.log.error('Failed to fetch emotes. Trying again in 5 seconds.');
                setTimeout(this.updateEmotes.bind(this, newAttempts), 5000);
            }
        }
    }
}

// FrankerFaceZ.get().register('addon.ffzap.liriklive', LirikLIVE).enable();
LirikLIVE.register('ffzap-liriklive');
