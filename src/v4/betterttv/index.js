/* global FrankerFaceZ, fetch */

const { has } = FrankerFaceZ.utilities.object;

const GIF_EMOTICONS_MODE = {
    DISABLED: 0,
    STATIC: 1,
    ANIMATED: 2,
};

class BetterTTV extends FrankerFaceZ.utilities.module.Module {
    constructor(...args) {
        super(...args);

        this.inject('settings');
        this.inject('chat');
        this.inject('chat.emotes');

        this.settings.add('ffzap.betterttv.global_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emoticons',
                title: 'Global Emoticons',
                description: 'Enable to show global BetterTTV emoticons.',
                component: 'setting-check-box',
            },

            changed: () => this.updateEmoticons(),
        });

        this.settings.add('ffzap.betterttv.override_emoticons', {
            default: false,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emoticons',
                title: 'Override Emoticons',
                description: 'Enable to show override emoticons (like D:).',
                component: 'setting-check-box',
            },

            changed: () => this.updateEmoticons(),
        });

        this.settings.add('ffzap.betterttv.channel_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emoticons',
                title: 'Channel Emoticons',
                description: 'Enable to show per-channel BetterTTV emoticons.',
                component: 'setting-check-box',
            },

            changed: () => this.updateEmoticons(),
        });

        this.settings.add('ffzap.betterttv.gif_emoticons_mode', {
            default: 1,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emoticons',
                title: 'GIF Emoticons',
                description: 'Change the mode of how GIF emoticons are showing up.',
                component: 'setting-select-box',
                data: [
                    { value: 0, title: 'Disabled' },
                    { value: 1, title: 'Enabled (Static GIF Emoticons)' },
                    { value: 2, title: 'Enabled (Animated GIF Emoticons)' },
                ],
            },

            changed: () => this.updateEmoticons(),
        });

        // this.channels = {};
        this.override_emotes = [
            ':\'(',
            'D:',
        ];
    }

    onEnable() {
        this.log.debug('FFZ:AP\'s BetterTTV module was enabled successfully.');

        this.on('chat:room-add', this.roomAdd);
        this.on('chat:room-remove', this.roomRemove);

        this.updateGlobalEmotes();

        const rooms = Object.keys(this.chat.rooms);
        for (let i = 0; i < rooms.length; i++) {
            const room = this.chat.rooms[rooms[i]];
            if (room) this.updateChannel(room);
        }
    }

    roomAdd(room) {
        this.updateChannel(room);
    }

    roomRemove(room) { // eslint-disable-line class-methods-use-this
        const realID = `addon--ffzap.betterttv--channel-${room.id}`;
        room.removeSet('addon--ffzap.betterttv', realID);
    }

    async updateGlobalEmotes(attempts = 0) {
        const realID = 'addon--ffzap.betterttv--global';
        this.emotes.removeDefaultSet('addon--ffzap.betterttv', realID);

        if (!this.chat.context.get('ffzap.betterttv.global_emoticons')) {
            return;
        }

        const response = await fetch('https://api.betterttv.net/emotes');
        if (response.ok) {
            const data = await response.json();

            const globalBttv = [];
            const overrideEmotes = [];

            const { emotes } = data;

            let i = emotes.length;
            while (i--) {
                const dataEmote = emotes[i];

                const requireSpaces = /[^A-Za-z0-9]/.test(dataEmote.regex);
                const match = /cdn.betterttv.net\/emote\/(\w+)/.exec(dataEmote.url);
                const id = match && match[1];

                const emote = {
                    urls: {
                        1: dataEmote.url,
                    },
                    name: dataEmote.regex,
                    width: dataEmote.width,
                    height: dataEmote.height,
                    require_spaces: requireSpaces,
                };

                if (id) {
                    emote.id = id;
                    emote.urls = {
                        1: `https://cdn.betterttv.net/emote/${id}/1x`,
                        2: `https://cdn.betterttv.net/emote/${id}/2x`,
                        4: `https://cdn.betterttv.net/emote/${id}/3x`,
                    };
                }

                if (this.override_emotes.indexOf(dataEmote.regex) !== -1) {
                    overrideEmotes.push(emote);
                } else {
                    if (dataEmote.imageType === 'gif') { // If the emote is a GIF
                        if (this.chat.context.get('ffzap.betterttv.gif_emoticons_mode') === 0) {
                            // If the GIF setting is set to "Disabled", ignore it.
                            continue;
                        } else if (this.chat.context.get('ffzap.betterttv.gif_emoticons_mode') === 1) {
                            // If the GIF setting is set to "Static", route them through the cache.
                            emote.urls[1] = `https://cache.ffzap.com/${emote.urls[1]}`;
                            if (id) {
                                emote.urls[2] = `https://cache.ffzap.com/${emote.urls[2]}`;
                                emote.urls[4] = `https://cache.ffzap.com/${emote.urls[4]}`;
                            }
                        }
                    }

                    if (!dataEmote.channel) {
                        globalBttv.push(emote);
                    }
                }
            }

            let setEmotes = [];

            // if (this.global_emotes) {
            setEmotes = setEmotes.concat(globalBttv);
            // }

            if (this.chat.context.get('ffzap.betterttv.override_emoticons')) {
                setEmotes = setEmotes.concat(overrideEmotes);
            }

            if (setEmotes.length === 0) {
                return;
            }

            const set = {
                emoticons: this.chat.context.get('ffzap.betterttv.global_emoticons') ? setEmotes : [],
                title: 'Global Emoticons',
                source: 'BetterTTV',
                icon: 'https://cdn.betterttv.net/tags/developer.png',
                _type: 1,
            };

            this.emotes.addDefaultSet('addon--ffzap.betterttv', realID, set);
        } else {
            if (response.status === 404) return;

            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 12) {
                this.log.error('Failed to fetch global emotes. Trying again in 5 seconds.');
                setTimeout(this.updateGlobalEmotes.bind(this, newAttempts), 5000);
            }
        }
    }

    async updateChannel(room, attempts = 0) {
        const realID = `addon--ffzap.betterttv--channel-${room.id}`;
        room.removeSet('addon--ffzap.betterttv', realID);

        if (!this.chat.context.get('ffzap.betterttv.channel_emoticons')) {
            return;
        }

        const response = await fetch(`https://api.betterttv.net/2/channels/${room.login}`);
        if (response.ok) {
            const channelBttv = [];
            const { emotes } = await response.json();

            let i = emotes.length;
            while (i--) {
                const requireSpaces = /[^A-Za-z0-9]/.test(emotes[i].code);

                const emoteFromArray = emotes[i];
                const { id } = emoteFromArray;

                const emote = {
                    urls: {
                        1: `https://cdn.betterttv.net/emote/${id}/1x`,
                        2: `https://cdn.betterttv.net/emote/${id}/2x`,
                        4: `https://cdn.betterttv.net/emote/${id}/3x`,
                    },
                    id,
                    name: emoteFromArray.code,
                    width: 28,
                    height: 28,
                    owner: {
                        display_name: emoteFromArray.channel || room.id,
                        name: emoteFromArray.channel,
                    },
                    require_spaces: requireSpaces,
                };

                if (emoteFromArray.imageType === 'gif') {
                    switch (this.chat.context.get('ffzap.betterttv.gif_emoticons_mode')) {
                    case GIF_EMOTICONS_MODE.DISABLED:
                        break;

                    case GIF_EMOTICONS_MODE.STATIC:
                        emote.urls[1] = `https://cache.ffzap.com/${emote.urls[1]}`;
                        emote.urls[2] = `https://cache.ffzap.com/${emote.urls[2]}`;
                        emote.urls[4] = `https://cache.ffzap.com/${emote.urls[4]}`;

                        channelBttv.push(emote);
                        break;

                    case GIF_EMOTICONS_MODE.ANIMATED:
                        channelBttv.push(emote);
                        break;

                    default:
                        channelBttv.push(emote);
                        break;
                    }
                } else {
                    channelBttv.push(emote);
                }
            }

            if (!channelBttv.length) {
                return;
            }

            const set = {
                emoticons: channelBttv,
                title: 'Channel Emoticons',
                source: 'BetterTTV',
                icon: 'https://cdn.betterttv.net/tags/developer.png',
                _type: 1,
            };

            if (channelBttv.length) {
                room.addSet('addon--ffzap.betterttv', realID, set);
            }
        } else {
            if (response.status === 404) return;

            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 12) {
                this.log.error('Failed to fetch channel emotes. Trying again in 5 seconds.');
                setTimeout(this.updateChannel.bind(this, room, newAttempts), 5000);
            }
        }
    }

    updateEmoticons() {
        this.updateGlobalEmotes();

        const chat = this.parent.resolve('chat');
        const rooms = Object.keys(chat.rooms);
        for (let i = 0; i < rooms.length; i++) {
            const roomID = rooms[i];
            this.updateChannel(chat.rooms[roomID]);
        }
    }
}

FrankerFaceZ.get().register('addon.ffzap.betterttv', BetterTTV).enable();

// class BTTV extends Addon {
//   constructor () {
//     super('BTTV');

//     this.global_emotes = true;
//     this.gif_emotes = 1;
//     this.override_emotes_enabled = false;
//     this.pro_emotes = true;
//     this.channel_emotes = true;
//     this.show_emotes_in_menu = true;

//     this.channels = {};
//     this.pro_users = {};
//     this.night_subs = {};

//     this.socket = false;
//     this.global_emotes_loaded = false;
//     this.gif_emotes_loaded = false;

//     this.override_emotes = [
//       ':\'(',
//       'D:'
//     ];

//     this.registerSelf();
//   }

//   doSettings () {
//     super.doSettings();

//     if (ffz.has_bttv) {
//       return;
//     }

//     FrankerFaceZ.settings_info.bttv_global_emotes = {
//       type: 'boolean',
//       value: this.global_emotes,
//       category: 'FFZ Add-On Pack',
//       name: '[BTTV] Global Emoticons',
//       help: 'Enable this to show global emoticons.',
//       on_update: (enabled) => {
//         this.global_emotes = enabled;

//         this.updateGlobalEmotes();
//       },
//       no_bttv: true
//     };

//     FrankerFaceZ.settings_info.bttv_gif_emotes = {
//       type: 'select',
//       value: this.gif_emotes,
//       category: 'FFZ Add-On Pack',
//       name: '[BTTV] GIF Emoticons',
//       help: 'Change the mode on how GIF emoticons work.',
//       options: {
//         0: 'Disabled',
//         1: 'Static Images',
//         2: 'Animated Images'
//       },
//       process_value: FrankerFaceZ.utils.process_int(1, 1, 2),
//       on_update: (val) => {
//         this.gif_emotes = val;

//         this.updateGlobalEmotes();
//         api.iterate_rooms();
//       },
//       no_bttv: true
//     };

//     FrankerFaceZ.settings_info.bttv_override_emotes = {
//       type: 'boolean',
//       value: this.override_emotes_enabled,
//       category: 'FFZ Add-On Pack',
//       name: '[BTTV] Enable Override Emoticons',
//       help: 'Enable this to show override emoticons (like D:).',
//       on_update: (enabled) => {
//         this.override_emotes_enabled = enabled;

//         this.updateGlobalEmotes();
//       },
//       no_bttv: true
//     };

//     FrankerFaceZ.settings_info.bttv_pro_emotes = {
//       type: 'boolean',
//       value: this.pro_emotes,
//       category: 'FFZ Add-On Pack',
//       name: '[BTTV] Enable Pro Emoticons',
//       help: 'Enable this to show Pro emoticons from yourself or other users.',
//       on_update: (enabled) => {
//         this.pro_emotes = enabled;

//         if (enabled) {
//           this.socket.connect();

//           for (let i = 0; i < this.channels.length; i++) {
//             let channel = this.channels[i];
//             this.roomAdd(channel);
//           }
//         } else {
//           for (let key in this.ProUsers) {
//             this.ProUsers[key].unload();
//           }
//           this.ProUsers = {};

//           this.socket.disconnectInternal();
//         }
//       },
//       no_bttv: true
//     };

//     FrankerFaceZ.settings_info.bttv_channel_emotes = {
//       type: 'boolean',
//       value: this.channel_emotes,
//       category: 'FFZ Add-On Pack',
//       name: '[BTTV] Enable Channel Emoticons',
//       help: 'Enable this to show per-channel emoticons.',
//       on_update: (enabled) => {
//         this.channel_emotes = enabled;

//         api.iterate_rooms();
//       },
//       no_bttv: true
//     };

//     FrankerFaceZ.settings_info.bttv_show_emotes_in_menu = {
//       type: 'boolean',
//       value: this.show_emotes_in_menu,
//       category: 'FFZ Add-On Pack',
//       name: '[BTTV] Show emoticons in Emoticon Menu',
//       help: 'Enable this to show the emoticons in the Emoticon Menu (you can still enter the emoticons manually when this is disabled)',
//       on_update: (enabled) => {
//         this.show_emotes_in_menu = enabled;

//         api.emote_sets['BTTV-Global'].hidden = !enabled;

//         for (let name in this.channels) {
//           let channel = this.channels[name];
//           api.emote_sets[channel.set_id].hidden = !enabled;
//         }
//       },
//       no_bttv: true
//     };

//     this.global_emotes = ffz.settings.get('bttv_global_emotes');
//     this.gif_emotes = ffz.settings.get('bttv_gif_emotes');
//     this.override_emotes_enabled = ffz.settings.get('bttv_override_emotes');
//     this.pro_emotes = ffz.settings.get('bttv_pro_emotes');
//     this.channel_emotes = ffz.settings.get('bttv_channel_emotes');
//     this.show_emotes_in_menu = ffz.settings.get('bttv_show_emotes_in_menu');
//   }

//   isEnabled () {
//     return super.isEnabled() && !ffz.has_bttv;
//   }

//   notifyUser () {
//     let shown = localStorage.ffz_ap_warning_bttv;
//     if (shown !== 'true') {
//       localStorage.ffz_ap_warning_bttv = 'true';
//       showMessage('You appear to have BTTV installed. FFZ:AP has a BTTV module that handles emotes as well, so BTTV is not necessary. To ensure best compatibility, consider removing BTTV.');
//     }
//   }

//   init () {
//     super.init();

//     if (!this.isEnabled()) {
//       this.log('BTTV was found! Addon disabled!');
//       this.notifyUser();
//       return;
//     }

//     this.socket = new BTTV.Socket(this, this.getSocketEvents());
//     this.addBadges();
//     if (this.global_emotes) {
//       this.updateGlobalEmotes();
//     }

//     if (this.pro_emotes) {
//       this.socket.connect();
//     }
//   }

//   roomAdd (roomId) {
//     super.roomAdd(roomId);

//     if (!this.isEnabled()) {
//       return;
//     }

//     this.updateChannel(roomId);
//   }

//   roomRemove (roomId) {
//     super.roomRemove(roomId);

//     if (!this.isEnabled()) {
//       return;
//     }

//     if (this.channels[roomId]) {
//       api.unload_set(this.channels[roomId].set_id);
//       this.channels[roomId] = null;
//     }

//     if (this.pro_emotes) {
//       this.socket.partChannel(roomId);
//     }
//   }

//   roomMessage (msg) {
//     super.roomMessage(msg);

//     if (!this.isEnabled()) {
//       return;
//     }

//     if (this.pro_emotes && ffz.get_user() && msg.from === ffz.get_user().login) {
//       this.socket.broadcastMe(msg.room);
//     }
//   }

//   bttvInitialized () {
//     super.bttvInitialized();

//     this.notifyUser();

//     if (this.pro_emotes) {
//       for (let key in this.ProUsers) {
//         this.ProUsers[key].unload();
//       }
//       this.ProUsers = {};

//       this.vars.socket.disconnectInternal();
//     }

//     this.updateGlobalEmotes();
//     api.iterate_rooms();
//   }

//   isOverrideEmote (emoteCode) {
//     this.extDebug('isOverrideEmote', emoteCode);

//     return this.override_emotes.indexOf(emoteCode) !== -1;
//   }

//   addBadges (attempts) {
//     this.extDebug('addBadges', attempts);

//     $.getJSON('https://api.betterttv.net/2/badges')
//     .done((data) => {
//       let types = [];
//       let _types = data.types;
//       let _users = data.badges;

//       let badgeBase = {
//         id: 'bttv',
//         image: 'https://cdn.betterttv.net/assets/icons/badge-dev.svg',
//         title: 'BetterTTV',
//         no_invert: true
//       };
//       api.add_badge('bttv', badgeBase);

//       let i = _types.length;
//       while (i--) {
//         let _type = _types[i];

//         let type = $.extend({}, badgeBase);
//         type.name = 'bttv-' + _type.name;
//         type.title = _type.description;
//         type.image = _type.svg;

//         types[_type.name] = type;
//       }

//       i = _users.length;
//       while (i--) {
//         let _user = _users[i];

//         if (types[_user.type]) {
//           this.debug('Adding badge "' + types[_user.type].name + '" for user "' + _user.name + '".');
//           api.user_add_badge(_user.name, 21, types[_user.type]);
//         }
//       }
//     }).fail((data) => {
//       if (data.status === 404) {
//         return;
//       }

//       attempts = (attempts || 0) + 1;
//       if (attempts < 12) {
//         this.log('Failed to fetch badges. Trying again in 5 seconds.');
//         return setTimeout(this.addBadges.bind(this, attempts), 5000);
//       }
//     });
//   }

//   updateGlobalEmotes (attempts) {
//     this.extDebug('updateGlobalEmotes', attempts);

//     this.global_emotes_loaded = false;
//     api.unregister_global_set('BTTV-Global');

//     if (!this.global_emotes) {
//       return;
//     }

//     $.getJSON('https://api.betterttv.net/emotes')
//     .done((data) => {
//       let globalBttv = [];
//       let overrideEmotes = [];
//       let nightSubEmotes = [];

//       let _emotes = data.emotes;

//       let i = _emotes.length;
//       while (i--) {
//         let requireSpaces = /[^A-Za-z0-9]/.test(_emotes[i].regex);

//         let _emote = _emotes[i];
//         let match = /cdn.betterttv.net\/emote\/(\w+)/.exec(_emote.url);
//         let id = match && match[1];

//         let emote = {
//           urls: {
//             1: _emote.url
//           },
//           name: _emote.regex,
//           width: _emote.width,
//           height: _emote.height,
//           require_spaces: requireSpaces
//         };

//         if (id) {
//           emote.id = id;
//           emote.urls = {
//             1: 'https://cdn.betterttv.net/emote/' + id + '/1x',
//             2: 'https://cdn.betterttv.net/emote/' + id + '/2x',
//             4: 'https://cdn.betterttv.net/emote/' + id + '/3x'
//           };
//         }

//         if (this.isOverrideEmote(_emote.regex)) {
//           overrideEmotes.push(emote);
//         } else {
//           if (_emote.imageType === 'gif') { // If the emote is a GIF
//             if (this.gif_emotes === 0) { // If the GIF setting is set to "Disabled", ignore it.
//               continue;
//             } else if (this.gif_emotes === 1) { // If the GIF setting is set to "Static", route them through the cache.
//               emote.urls[1] = 'https://cache.ffzap.com/' + emote.urls[1];
//               if (id) {
//                 emote.urls[2] = 'https://cache.ffzap.com/' + emote.urls[2];
//                 emote.urls[4] = 'https://cache.ffzap.com/' + emote.urls[4];
//               }
//             }
//           }

//           if (_emote.channel && _emote.channel === 'night') {
//             nightSubEmotes.push(emote);
//           } else {
//             globalBttv.push(emote);
//           }
//         }
//       }

//       let set;
//       if (nightSubEmotes.length > 0) {
//         set = {
//           emoticons: nightSubEmotes,
//           title: 'Night (Legacy)',
//           source: 'BetterTTV',
//           icon: 'https://cdn.betterttv.net/tags/developer.png',
//           sort: 50
//         };

//         api.load_set('BTTV-Night-Sub', set);
//       }

//       let emotes = [];

//       if (this.global_emotes) {
//         emotes = emotes.concat(globalBttv);
//       }

//       if (this.override_emotes_enabled) {
//         emotes = emotes.concat(overrideEmotes);
//       }

//       if (emotes.length === 0) {
//         return;
//       }

//       set = {
//         emoticons: emotes,
//         title: 'Global Emoticons',
//         source: 'BetterTTV',
//         icon: 'https://cdn.betterttv.net/tags/developer.png',
//         sort: 101
//       };
//       api.register_global_set('BTTV-Global', set);
//       api.emote_sets['BTTV-Global'].hidden = !this.show_emotes_in_menu;

//       this.global_emotes_loaded = true;
//     }).fail((data) => {
//       if (data.status === 404) {
//         return;
//       }

//       attempts = (attempts || 0) + 1;
//       if (attempts < 12) {
//         this.log('Failed to fetch global emotes. Trying again in 5 seconds.');
//         return setTimeout(this.updateGlobalEmotes.bind(this, attempts), 5000);
//       }
//     });
//   }

//   updateChannel (roomId, attempts) {
//     this.extDebug('updateChannel', [roomId, attempts]);

//     if (this.pro_emotes) {
//       this.socket.joinChannel(roomId);
//     }

//     if (this.channels[roomId]) {
//       api.unregister_room_set(roomId, this.channels[roomId].set_id);
//     }

//     $.getJSON('https://api.betterttv.net/2/channels/' + roomId)
//     .done((data) => {
//       let channelBttv = [];
//       let emotes = data.emotes;

//       let i = emotes.length;
//       while (i--) {
//         let requireSpaces = /[^A-Za-z0-9]/.test(emotes[i].code);

//         let _emote = emotes[i];
//         let id = _emote.id;

//         let emote = {
//           urls: {
//             1: 'https://cdn.betterttv.net/emote/' + id + '/1x',
//             2: 'https://cdn.betterttv.net/emote/' + id + '/2x',
//             4: 'https://cdn.betterttv.net/emote/' + id + '/3x'
//           },
//           id: id,
//           name: _emote.code,
//           width: 28,
//           height: 28,
//           owner: {
//             display_name: _emote.channel || roomId,
//             name: _emote.channel
//           },
//           require_spaces: requireSpaces
//         };

//         if (_emote.imageType === 'gif') {
//           switch (this.gif_emotes) {
//             case 0:
//               continue;
//             case 1:
//               emote.urls[1] = 'https://cache.ffzap.com/' + emote.urls[1];
//               emote.urls[2] = 'https://cache.ffzap.com/' + emote.urls[2];
//               emote.urls[4] = 'https://cache.ffzap.com/' + emote.urls[4];

//               channelBttv.push(emote);
//               break;
//             case 2:
//               channelBttv.push(emote);
//           }
//         } else {
//           channelBttv.push(emote);
//         }
//       }

//       if (!channelBttv.length) {
//         return;
//       }

//       this.channels[roomId] = {
//         set_id: 'BTTV-Channel-' + roomId
//       };

//       let set = {
//         emoticons: channelBttv,
//         title: 'Channel Emoticons',
//         source: 'BetterTTV',
//         icon: 'https://cdn.betterttv.net/tags/developer.png'
//       };

//       if (channelBttv.length && this.channel_emotes) {
//         api.register_room_set(roomId, this.channels[roomId].set_id, set); // Load normal emotes
//         api.emote_sets[this.channels[roomId].set_id].hidden = !this.show_emotes_in_menu;
//       }
//     }).fail((data) => {
//       if (data.status === 404) {
//         return;
//       }

//       attempts = (attempts || 0) + 1;
//       if (attempts < 12) {
//         this.log('Failed to fetch channel emotes. Trying again in 5 seconds.');
//         return setTimeout(this.updateChannel.bind(this, roomId, attempts), 5000);
//       }
//     });
//   }

//   getSocketEvents () {
//     this.extDebug('getSocketEvents');

//     return {
//       lookup_user: (subscription) => {
//         if (!subscription.pro || !this.pro_emotes) {
//           return;
//         }

//         if (subscription.pro && subscription.emotes) {
//           if (this.pro_users[subscription.name]) {
//             this.pro_users[subscription.name].emotes_array = subscription.emotes;
//             this.pro_users[subscription.name].loadEmotes();
//           } else {
//             this.pro_users[subscription.name] = new BTTV.ProUser(this, subscription.name, subscription.emotes);
//           }
//         }

//         if (subscription.subscribed) { // Night's subs
//           if (!(this.night_subs[subscription.name])) {
//             this.night_subs[subscription.name] = true;
//             api.user_add_set(subscription.name, 'BTTV-Night-Sub');
//           }
//         }
//       }
//     };
//   }
// }

// BTTV.ProUser = class {
//   constructor (_bttv, username, emotesArray) {
//     this._bttv = _bttv;

//     this.username = username;
//     this.emotesArray = emotesArray;

//     this.initialize();
//   }

//   initialize () {
//     this._id_emotes = 'BTTV-ProUser-' + this.username;

//     this.loadEmotes();
//   }

//   loadEmotes () {
//     this.emotes = [];

//     for (let i = 0; i < this.emotesArray.length; i++) {
//       let _emote = this.emotesArray[i];
//       let emote = {
//         urls: {
//           1: 'https://cdn.betterttv.net/emote/' + _emote.id + '/1x',
//           2: 'https://cdn.betterttv.net/emote/' + _emote.id + '/2x',
//           4: 'https://cdn.betterttv.net/emote/' + _emote.id + '/3x'
//         },
//         id: _emote.id,
//         name: _emote.code,
//         width: 28,
//         height: 28,
//         owner: {
//           display_name: _emote.channel || '',
//           name: _emote.channel || ''
//         },
//         require_spaces: true
//       };

//       if (_emote.imageType === 'gif') {
//         if (this._bttv.gif_emotes === 0) { // If the GIF setting is set to "Disabled", ignore it.
//           continue;
//         } else if (this._bttv.gif_emotes === 1) { // If the GIF setting is set to "Static", route them through the cache.
//           emote.urls[1] = 'https://cache.ffzap.com/' + emote.urls[1];
//           emote.urls[2] = 'https://cache.ffzap.com/' + emote.urls[2];
//           emote.urls[4] = 'https://cache.ffzap.com/' + emote.urls[4];
//         }
//       }
//       this.emotes.push(emote);
//     }

//     let set = {
//       emoticons: this.emotes,
//       title: 'Personal Emoticons',
//       source: 'BetterTTV',
//       icon: 'https://cdn.betterttv.net/tags/developer.png'
//     };

//     if (this.emotes.length) {
//       api.load_set(this._id_emotes, set);
//       api.user_add_set(this.username, this._id_emotes);
//     } else {
//       api.unload_set(this._id_emotes);
//     }
//   }

//   unload () {
//     this._bttv.debug('Unloading user! (User: ' + this.username + ')');

//     api.unload_set(this._id_emotes);
//   }
// };

// BTTV.Socket = class {
//   constructor (_bttv, events) {
//     this._bttv = _bttv;

//     this.socket = false;
//     this._looked_up_users = [];
//     this._connected = false;
//     this._connecting = false;
//     this._connect_attempts = 1;
//     this._joined_channels = [];
//     this._connection_buffer = [];
//     this._events = events;
//   }

//   connect () {
//     if (!ffz.get_user()) {
//       return;
//     }

//     if (this._connected || this._connecting) {
//       return;
//     }
//     this._connecting = true;

//     this._bttv.log('Socket: Connecting to socket server...');

//     this.socket = new WebSocket('wss://sockets.betterttv.net/ws');

//     this.socket.onopen = () => {
//       this._bttv.log('Socket: Connected to socket server.');

//       this._connected = true;
//       this._connect_attempts = 1;

//       if (this._connection_buffer.length > 0) {
//         let i = this._connection_buffer.length;
//         while (i--) {
//           let channel = this._connection_buffer[i];
//           this.joinChannel(channel);
//           this.broadcastMe(channel);
//         }
//         this._connection_buffer = [];
//       }

//       if (this.reconnecting) {
//         this.reconnecting = false;
//         api.iterate_rooms();
//       }
//     };

//     this.socket.onerror = () => {
//       this._bttv.log('Socket: Error from socket server.');

//       this._connect_attempts++;
//       this.reconnect();
//     };

//     this.socket.onclose = () => {
//       if (!this._connected || !this.socket) {
//         return;
//       }

//       this._bttv.log('Socket: Lost connection to socket server...');

//       this._connect_attempts++;
//       this.reconnect();
//     };

//     this.socket.onmessage = (message) => {
//       let evt;

//       try {
//         evt = JSON.parse(message.data);
//       } catch (e) {
//         this._bttv.debug('Socket: Error parsing message', e);
//       }

//       if (!evt || !(this._events[evt.name])) {
//         return;
//       }

//       this._bttv.debug('Socket: Received event', evt);

//       this._events[evt.name](evt.data);
//     };
//   }

//   reconnect () {
//     this.disconnect();

//     if (this._connecting === false) {
//       return;
//     }
//     this._connecting = false;

//     this._bttv.log('Socket: Trying to reconnect to socket server...');

//     setTimeout(() => {
//       this.reconnecting = true;
//       this.connect();
//     }, Math.random() * (Math.pow(2, this._connect_attempts) - 1) * 10000);
//   }

//   disconnect () {
//     if (this.socket) {
//       try {
//         this.socket.close();
//       } catch (e) {}
//     }

//     delete this.socket;

//     this._connected = false;
//     this._connecting = false;
//   }

//   disconnectInternal () {
//     this.disconnect();

//     this._bttv.log('Socket: Disconnected from socket server.');
//   }

//   emit (event, data) {
//     if (!this._connected || !this.socket) {
//       return;
//     }

//     this.socket.send(JSON.stringify({
//       name: event,
//       data: data
//     }));
//   }

//   broadcastMe (channel) {
//     if (!this._connected) {
//       return;
//     }
//     if (!ffz.get_user()) {
//       return;
//     }

//     this.emit('broadcast_me', {
//       name: ffz.get_user().login,
//       channel: channel
//     });
//   }

//   joinChannel (channel) {
//     if (!this._connected) {
//       if (!this._connection_buffer.includes(channel)) {
//         this._connection_buffer.push(channel);
//       }
//       return;
//     }

//     if (!channel.length) {
//       return;
//     }

//     if (this._joined_channels[channel]) {
//       this.partChannel(channel);
//     }

//     this.emit('join_channel', {
//       name: channel
//     });
//     this._joined_channels[channel] = true;
//   }

//   partChannel (channel) {
//     if (!this._connected) {
//       return;
//     }
//     if (!channel.length) {
//       return;
//     }

//     if (this._joined_channels[channel]) {
//       this.emit('part_channel', {
//         name: channel
//       });
//     }
//     this._joined_channels[channel] = false;
//   }
// };

// new BTTV(); // eslint-disable-line
