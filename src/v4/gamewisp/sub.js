export default class Sub {
    constructor(parent, username, emoteIds, badge) {
        this.parent = parent;

        this.username = username;
        this.emote_ids = emoteIds;
        this.badges = [];
        if (badge) {
            this.addUserBadge(badge);
        }

        this.initialize();
    }

    initialize() {
        this._id_emotes = `addon--ffzap.gamewisp--emotes-sub-${this.username}`;

        this.loadEmotes();
        this.reloadBadges();
    }

    addUserBadge(badgeId) {
        this.badges.push(badgeId);
    }

    loadEmotes() {
        this.emotes = {};
        this.channels = [];

        if (!this.emote_ids) {
            return;
        }

        for (let i = 0; i < this.emote_ids.length; i++) {
            const emote = this.parent.getEmote(this.emote_ids[i]);
            if (emote) {
                if (!this.emotes[emote.gw_channel]) {
                    this.emotes[emote.gw_channel] = [];
                }
                this.emotes[emote.gw_channel].push(emote);
            }
        }

        if (!this.parent.chat.context.get('ffzap.gamewisp.sub_emoticons')) {
            return;
        }

        for (const i in this.emotes) {
            if (this.emotes.hasOwnProperty(i)) {
                const emotes = this.emotes[i];

                if (!this._emote_sets) {
                    this._emote_sets = [];
                }

                this._emote_sets[i] = {
                    emoticons: emotes,
                    title: i,
                    source: 'GameWisp',
                    icon: 'https://cdn.ffzap.com/gamewisp/icon_16x.png',
                    sort: 50,
                    has_prefix: 2,
                    _set_name: `${this._id_emotes}-${i}`,
                };

                if (emotes.length) {
                    this.parent.emotes.loadSetData(this._emote_sets[i]._set_name, this._emote_sets[i], true);
                    this.parent.chat.getUser(undefined, this.username).addSet('addon--ffzap.gamewisp', this._emote_sets[i]._set_name);
                } else {
                    this.parent.emotes.unloadSet(this._emote_sets[i]._set_name);
                }
            }
        }
    }

    reloadBadges() {
        if (!this.badges || this.badges.length === 0) {
            return;
        }

        for (let i = 0; i < this.badges.length; i++) {
            const id = this.badges[i];
            const badge = this.parent.getBadge(id);
            if (!badge) {
                continue;
            }
			
            const room = this.parent.chat.getRoom(undefined, badge.twitch_channel, true);
            if (!room) {
                continue;
            }

            room.getUser(undefined, this.username)
                .removeBadge('addon--ffzap.gamewisp', 'addon--ffzap.gamewisp--badges-subscriber');
			
            if (this.parent.chat.context.get('ffzap.gamewisp.sub_badges')) {
                room.getUser(undefined, this.username)
                    .addBadge('addon--ffzap.gamewisp', 'addon--ffzap.gamewisp--badges-subscriber', badge.ffz_data);
				
                if (this._emote_sets && this._emote_sets[badge.gw_channel]) {
                    const emote_set = this._emote_sets[badge.gw_channel];
                    emote_set.icon = badge.ffz_data.image;
                    if (emote_set.emoticons && emote_set.emoticons.length > 0) {
                        this.parent.emotes.loadSetData(emote_set._set_name, emote_set);
                    }
                }
            }
        }
    }

    unload() {
        for (let i = 0; i < this.channels.length; i++) {
            const room = this.parent.chat.getRoom(undefined, this.channels[i], true);
            if (!room) {
                continue;
            }

            room.getUser(undefined, this.username)
                .removeBadge('addon--ffzap.gamewisp', 'addon--ffzap.gamewisp--badges-subscriber');
        }
    }
}