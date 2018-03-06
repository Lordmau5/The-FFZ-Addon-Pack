/* global FrankerFaceZ, fetch */

import Socket from './socket';
import Sub from './sub';

class GameWisp extends FrankerFaceZ.utilities.module.Module {
	constructor(...args) {
		super(...args);

		this.inject('settings');
		this.inject('chat');
		this.inject('chat.emotes');
		this.inject('chat.badges');
		this.inject('site');

		this.settings.add('ffzap.gamewisp.global_emoticons', {
			default: true,

			ui: {
				path: 'Add-Ons > FFZ:AP > GameWisp >> Emoticons',
				title: 'Global Emoticons',
				description: 'Enable to show global GameWisp emoticons.',
				component: 'setting-check-box',
			},

			changed: () => this.updateGlobalEmotes(),
		});

		this.settings.add('ffzap.gamewisp.sub_emoticons', {
			default: true,

			ui: {
				path: 'Add-Ons > FFZ:AP > GameWisp >> Emoticons',
				title: 'Subscriber Emoticons',
				description: 'Enable to show GameWisp subscriber emoticons.',
				component: 'setting-check-box',
			},

			changed: () => {
				if (this.chat.context.get('ffzap.gamewisp.sub_emoticons')) {
					this.socket.connect();
					
					const rooms = Object.keys(this.chat.rooms);
					for (let i = 0; i < rooms.length; i++) {
						const room = this.chat.rooms[rooms[i]];
						if (room) this.roomAdd(room);
					}
				} else {
					for (const username in this.subs) {
						if ({}.hasOwnProperty.call(this.subs, username)) {
							this.subs[username].unload();
						}
					}
					this.subs = {};
				}
			},
		});

		this.settings.add('ffzap.gamewisp.sub_badges', {
			default: true,

			ui: {
				path: 'Add-Ons > FFZ:AP > GameWisp >> Badges',
				title: 'Subscriber Badges',
				description: 'Enable to show GameWisp subscriber badges.',
				component: 'setting-check-box',
			},

			changed: () => {
				if (this.chat.context.get('ffzap.gamewisp.sub_badges')) {
					this.socket.connect();

					for (const username in this.subs) {
						if ({}.hasOwnProperty.call(this.subs, username)) {
							this.subs[username].reloadBadges();
						}
					}
				}
			},
		});

		this.settings.add('ffzap.gamewisp.badges_override_twitch', {
			default: true,

			ui: {
				path: 'Add-Ons > FFZ:AP > GameWisp >> Badges',
				title: 'Subscriber Badges Override Twitch Badges',
				description: 'Enable to let GameWisp subscriber badges override the Twitch subscriber badges.',
				component: 'setting-check-box',
			},

			changed: enabled => {
				if (this.chat.context.get('ffzap.gamewisp.sub_badges')) {
					for (const badge in this.sub_badges) {
						if ({}.hasOwnProperty.call(this.sub_badges, badge)) {
							const _badge = this.sub_badges[badge];
							_badge.ffz_data.replaces = enabled ? 'subscriber' : undefined;
							_badge.ffz_data.slot = enabled ? 25 : 26;
						}
					}

					for (const username in this.subs) {
						if ({}.hasOwnProperty.call(this.subs, username)) {
							this.subs[username].reloadBadges();
						}
					}
				}	
			},
		});

		// this.settings.add('ffzap.gamewisp.sub_button', {
		// 	default: true,

		// 	ui: {
		// 		path: 'Add-Ons > FFZ:AP > GameWisp >> Metadata',
		// 		title: 'Subscribe Button',
		// 		description: 'Enable to show a GameWisp sub button underneath the stream.',
		// 		component: 'setting-check-box',
		// 	},

		// 	changed: () => this.updateMetadata(),
		// });


		this.socket = false;
		this.sub_emotes = {};
		this.sub_badges = {};
		this.channels = [];
		this.subbed_to = {};
		this.subs = {};
	}

	onLoad() { // eslint-disable-line class-methods-use-this
		const msgpack = document.createElement('script');
		msgpack.type = 'text/javascript';
		msgpack.src = 'https://cdnjs.cloudflare.com/ajax/libs/msgpack-lite/0.1.26/msgpack.min.js';
		document.head.appendChild(msgpack);
	}

	onEnable() {
		this.log.debug('FFZ:AP\'s GameWisp module was enabled successfully.');

		this.on('chat:room-add', this.roomAdd);
		this.on('chat:room-remove', this.roomRemove);

		this.socket = new Socket(this, this.getSocketEvents());
		this.updateGlobalEmotes();

		if (this.chat.context.get('ffzap.gamewisp.sub_emoticons') || this.chat.context.get('ffzap.gamewisp.sub_badges')) {
			this.socket.connect();
		}

		this.badges.loadBadgeData('addon--ffzap.gamewisp--badges-subscriber', {
			id: 'gamewisp-subscriber',
			title: 'GameWisp Subscriber',
			image: 'https://cdn.ffzap.com/gamewisp/icon_16x.png',
			no_invert: true
		});

		const rooms = Object.keys(this.chat.rooms);
		for (let i = 0; i < rooms.length; i++) {
			const room = this.chat.rooms[rooms[i]];
			if (room) this.roomAdd(room);
		}

		// Sub Button - currently disabled
		/*

		let metadata = {
			subscribe: {
				refresh: false,
				order: 97,
				host_order: 49,
				button: true,

				static_label: '<img src="https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png"/>',
				label: (view, channel, isHosting) => {
				if (!this.isEnabled() || !this.enable_sub_button) {
					return '';
				}

				let label = '';
				let id = channel.get('id');
				if (this.subbed_to[id]) {
					label = this.subbed_to[id].subbed ? 'Visit Channel' : 'Subscribe';

					if (ffz.get_user() && ffz.get_user().login === id) {
					label = 'Visit Channel';
					}
				}

				return label;
				},

				disabled: (view, channel, isHosting) => {
				if (!this.isEnabled() || !this.enable_sub_button) {
					return true;
				}

				// TODO: Disable when tiers get published to the socket and user is on highest tier?

				// var id = channel.get('id');
				// return GameWisp.vars.subbed_to[id];
				return !this.isEnabled() || !this.enable_sub_button;
				},

				click: (event, button, view, channel, isHosting) => {
				if (!this.isEnabled()) {
					return;
				}

				let id = channel.get('id');
				if (this.subbed_to[id]) {
					window.open(this.subbed_to[id].gwData.url, '_blank');
				}
				}
			}
			};
			api.register_metadata('gamewisp-subscribe', metadata.subscribe);

			api.add_badge('gamewisp-subscriber', {
			name: 'gw-sub',
			title: 'GameWisp Subscriber',
			image: 'https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png',
			no_invert: true
			});
		}

		*/
	}

	roomAdd(room) {
		this.socket.joinRoom(room.login);
	}

	roomRemove(room) {
		const index = this.channels.indexOf(room.login);
		if (index !== -1) {
			this.channels.splice(index);
		}

		if (this.subbed_to[room.login]) {
			this.subbed_to[room.login] = null;
		}

		this.socket.leaveRoom(room.login);
	}

	async updateGlobalEmotes(attempts = 0) {
		const realID = 'addon--ffzap.gamewisp--emotes-global';
		this.emotes.removeDefaultSet('addon--ffzap.gamewisp', realID);
		this.emotes.unloadSet(realID);

		if (!this.chat.context.get('ffzap.gamewisp.global_emoticons')) {
			return;
		}

		const response = await fetch('https://api.gamewisp.com/pub/v1/emote/global');
		if (response.ok) {
			const json = await response.json();
			
			const globalEmotes = [];

			const emotes = json.data;
			for (let i = 0; i < emotes.length; i++) {
				const _emote = emotes[i];
		
				const emote = {
					urls: {
						1: _emote.image_asset.data.content.small,
						2: _emote.image_asset.data.content.medium,
						4: _emote.image_asset.data.content.large
					},
					name: _emote.shortcode,
					id: _emote.image_asset.data.id,
					width: 28,
					height: 28,
					require_spaces: true
				};
		
				globalEmotes.push(emote);
			}
		
			const set = {
				emoticons: globalEmotes,
				title: 'Global Emoticons',
				source: 'GameWisp',
				icon: 'https://cdn.ffzap.com/ffz-ap/gamewisp/icon_16x.png',
				sort: 101,
				_type: 1,
			};
			this.emotes.addDefaultSet('addon--ffzap.gamewisp', realID, set);
		} else {
			if (response.status === 404) return;

			const newAttempts = (attempts || 0) + 1;
			if (newAttempts < 12) {
				this.log.error('Failed to fetch global emotes. Trying again in 5 seconds.');
				setTimeout(this.updateGlobalEmotes.bind(this, newAttempts), 5000);
			}
		}
	}

	addEmote(id, code, channel, gwChannel, url) {
		if (this.sub_emotes[id]) {
			return this.sub_emotes[id];
		}

		const baseUrl = url.replace(/_(\d*)x(\d*)\.png/, '');
		this.sub_emotes[id] = {
			urls: {
				1: url,
				2: `${baseUrl}_56x56.png`,
				4: `${baseUrl}_112x112.png`
			},
			name: code,
			width: 28,
			height: 28,
			require_spaces: false,
			gw_channel: gwChannel,
			id: `${channel}-${code}`
		};

		return this.sub_emotes[id];
	}

	getEmote(id) {	
		return this.sub_emotes[id] || false;
	}

	addBadge(id, twitchChannel, gwChannel, name, tier, url) {	
		if (this.sub_badges[id]) {
			return this.sub_badges[id];
		}
	
		if (twitchChannel == null) {
			this.log.error('Tried to add a badge with an undefined twitch channel!', [id, twitchChannel, gwChannel, tier, url]);
			return;
		}

		const baseUrl = url.replace(/_(\d*)x(\d*)\.png/, '');
		this.sub_badges[id] = {
			twitch_channel: twitchChannel,
			gw_channel: gwChannel,
			name,
			tier,
			ffz_data: {
				id: 'gamewisp-subscriber',
				image: url,
				title: name,
				slot: (this.chat.context.get('ffzap.gamewisp.badges_override_twitch') ? 25 : 26),
				urls: {
					1: url,
					2: `${baseUrl}_36x36.png`,
					4: `${baseUrl}_72x72.png`
				},
				replace_mode: 'keep_title',
				replaces: (this.chat.context.get('ffzap.gamewisp.badges_override_twitch') ? 'subscriber' : undefined)
			}
		};
	
		return this.sub_badges[id];
	}
	
	getBadge(id) {	
		return this.sub_badges[id] || false;
	}

	getSocketEvents() {
		return {
			initialize_room: data => {
				if (data.gameWispChannel && data.gameWispChannel.isLaunched) {
					this.subbed_to[data.room] = {
						subbed: data.isGameWispSub,
						gwData: data.gameWispChannel
					};
				}

				if (data.emotes) {
					for (let i = 0; i < data.emotes.length; i++) {
						const _emote = data.emotes[i];
						if (!_emote.name) {
							this.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
						}
					}
				}

				if (data.badges) {
					for (let i = 0; i < data.badges.length; i++) {
						const _badge = data.badges[i];

						// ID, Channel, Tier data, URL
						this.addBadge(_badge.id, _badge.twitch_channel, _badge.channel, _badge.name || _badge.code, _badge.tier, _badge.url);
					}
				}

				let users = data.userStore;

				if (users) {
					for (const username in users) {
						if (users.hasOwnProperty(username)) {
							const _emoteIds = users[username];
							if (_emoteIds.length > 0) {
								if (this.subs[username]) {
									this.subs[username].emote_ids = _emoteIds;
									this.subs[username].loadEmotes();
								} else {
									this.subs[username] = new Sub(this, username, _emoteIds, null);
								}
							}
						}
					}
				}

				users = data.userStoreBadges;
				if (users) {
					for (const username in users) {
						if (users.hasOwnProperty(username)) {
							const badge = users[username];
							if (this.subs[username]) {
								this.subs[username].addUserBadge(badge);
								this.subs[username].reloadBadges();
							} else {
								this.subs[username] = new Sub(this, username, null, badge);
							}
						}
					}
				}

				// api.update_metadata('gamewisp-subscribe');
			},
			update_room: data => {
				if (data.emotes) {
					for (let i = 0; i < data.emotes.length; i++) {
						const _emote = data.emotes[i];
						if (!_emote.name) {
							this.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
						}
					}
				}

				const user = data.user;

				if (user && user.emoteIDs && user.emoteIDs.length > 0) {
					const _emoteIds = user.emoteIDs;
					if (this.subs[user.name]) {
						this.subs[user.name].emote_ids = _emoteIds;
						this.subs[user.name].loadEmotes();
					} else {
						this.subs[user.name] = new Sub(this, user.name, _emoteIds, null);
					}
				}
			},
			leave_room: () => {}
		};
	}
}

FrankerFaceZ.get().register('addon.ffzap.gamewisp', GameWisp).enable();