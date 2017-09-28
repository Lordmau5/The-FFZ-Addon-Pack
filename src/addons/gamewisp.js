/* global $, Addon, api, ffz, FrankerFaceZ, WebSocket, msgpack */

class GameWisp extends Addon {
  constructor () {
    super('GameWisp');

    this.enable_global_emoticons = true;
    this.enable_emoticons = true;
    this.enable_sub_button = true;
    this.enable_badges = true;
    this.badges_override_twitch = true;

    this.socket = false;
    this.emotes = {};
    this.badges = {};
    this.channels = [];
    this.subbed_to = {};
    this.subs = {};

    this.registerSelf();
  }

  doSettings () {
    super.doSettings();

    FrankerFaceZ.settings_info.gamewisp_enable_global_emoticons = {
      type: 'boolean',
      value: this.enable_global_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Global Emoticons',
      help: 'Enable this to show GameWisp global emoticons.',
      on_update: (enabled) => {
        this.enable_global_emoticons = enabled;
        api.update_metadata('gamewisp-subscribe');

        this.updateGlobals();
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_emoticons = {
      type: 'boolean',
      value: this.enable_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Emoticons',
      help: 'Enable this to show GameWisp sub emoticons.',
      on_update: (enabled) => {
        this.enable_emoticons = enabled;
        api.update_metadata('gamewisp-subscribe');

        if (enabled) {
          if (!this.enable_badges) {
            this.socket.connect();

            for (let i = 0; i < this.channels.length; i++) {
              let channel = this.channels[i];
              this.socket.joinRoom(channel);
            }
          }
        } else {
          for (let username in this.subs) {
            this.subs[username].unload();
          }

          if (!this.enable_badges) {
            this.subs = {};

            this.socket.disconnectInternal();
          }
        }
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_sub_button = {
      type: 'boolean',
      value: this.enable_sub_button,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Subscribe Button',
      help: 'Enable this to show the GameWisp subscribe / visit channel button.',
      on_update: (enabled) => {
        this.enable_sub_button = enabled;
        api.update_metadata('gamewisp-subscribe');
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_badges = {
      type: 'boolean',
      value: this.enable_badges,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Badges',
      help: 'Enable this to show GameWisp subscriber badges.',
      on_update: (enabled) => {
        this.enable_badges = enabled;

        if (enabled) {
          if (!this.enable_emoticons) {
            this.socket.connect();

            for (let i = 0; i < this.channels.length; i++) {
              let channel = this.channels[i];
              this.socket.joinRoom(channel);
            }
          } else {
            for (let username in this.subs) {
              this.subs[username].reloadBadges();
            }
          }
        } else {
          for (let username in this.subs) {
            this.subs[username].reloadBadges();
          }

          if (!this.enable_emoticons) {
            this.subs = {};

            this.socket.disconnectInternal();
          }
        }
      }
    };

    FrankerFaceZ.settings_info.gamewisp_badges_override_twitch = {
      type: 'boolean',
      value: this.badges_override_twitch,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Override Twitch Sub Badges',
      help: 'When enabled, GameWisp subscriber badges override the Twitch subscriber badges.',
      on_update: (enabled) => {
        this.badges_override_twitch = enabled;

        if (this.enable_badges) {
          for (let badge in this.badges) {
            this.badges[badge].ffz_data.replaces = enabled ? 'subscriber' : undefined;
          }

          for (let username in this.subs) {
            this.debug(username);
            this.subs[username].reloadBadges();
          }
        }
      }
    };

    this.enable_global_emoticons = ffz.settings.get('gamewisp_enable_global_emoticons');
    this.enable_emoticons = ffz.settings.get('gamewisp_enable_emoticons');
    this.enable_sub_button = ffz.settings.get('gamewisp_enable_sub_button');
    this.enable_badges = ffz.settings.get('gamewisp_enable_badges');
    this.badges_override_twitch = ffz.settings.get('gamewisp_badges_override_twitch');
  }

  isEnabled () {
    return super.isEnabled && (this.enable_global_emoticons || this.enable_emoticons);
  }

  preInit () {
    super.preInit();

    let msgpack = document.createElement('script');
    msgpack.type = 'text/javascript';
    msgpack.src = 'https://rawgit.com/kawanet/msgpack-lite/master/dist/msgpack.min.js';
    document.head.appendChild(msgpack);
  }

  init () {
    super.init();

    this.updateGlobals();

    this.socket = new GameWisp.Socket(this, this.getSocketEvents());
    if (this.enable_emoticons || this.enable_badges) {
      this.socket.connect();
    }

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

  roomAdd (roomId) {
    super.roomAdd(roomId);

    if (!this.channels.includes(roomId)) {
      this.channels.push(roomId);
    }

    this.socket.joinRoom(roomId);
  }

  roomRemove (roomId) {
    super.roomRemove(roomId);

    let index = this.channels.indexOf(roomId);
    if (index !== -1) {
      this.channels.splice(index);
    }

    if (this.subbed_to[roomId]) {
      this.subbed_to[roomId] = null;
    }

    this.socket.leaveRoom(roomId);
  }

  updateGlobals () {
    this.extDebug('updateGlobals');

    api.unregister_global_set('GameWisp-Global');

    if (!this.enable_global_emoticons) {
      return;
    }

    $.getJSON('https://api.gamewisp.com/pub/v1/emote/global', { limit: 50 }, (json) => {
      let emotes = [];

      let _emotes = json.data;
      for (let i = 0; i < _emotes.length; i++) {
        let _emote = _emotes[i];

        let emote = {
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

        emotes.push(emote);
      }

      let set = {
        emoticons: emotes,
        title: 'Global Emoticons',
        source: 'GameWisp',
        icon: 'https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png',
        sort: 101
      };
      api.register_global_set('GameWisp-Global', set);
    });
  }

  addEmote (id, code, channel, gwChannel, url) {
    this.extDebug('addEmote', [id, code, channel, gwChannel, url]);

    if (this.emotes[id]) {
      return this.emotes[id];
    }

    let baseUrl = url.replace(/(\d*)x(\d*)\.png/, '');
    this.emotes[id] = {
      urls: {
        1: url,
        2: baseUrl + '56x56.png',
        4: baseUrl + '112x112.png'
      },
      name: code,
      width: 28,
      height: 28,
      require_spaces: false,
      gw_channel: gwChannel,
      id: channel + '-' + code
    };

    return this.emotes[id];
  }

  getEmote (id) {
    this.extDebug('getEmote', id);

    return this.emotes[id] || false;
  }

  addBadge (id, twitchChannel, gwChannel, name, tier, url) {
    this.extDebug('addBadge', [id, twitchChannel, gwChannel, tier, url]);

    if (this.badges[id]) {
      return this.badges[id];
    }

    if (twitchChannel == null) {
      this.error('Tried to add a badge with a undefined twitch channel!', [id, twitchChannel, gwChannel, tier, url]);
      return;
    }

    let baseUrl = url.replace(/(\d*)x(\d*)\.png/, '');
    this.badges[id] = {
      twitch_channel: twitchChannel,
      gw_channel: gwChannel,
      name: name,
      tier: tier,
      ffz_data: {
        id: 'gamewisp-subscriber',
        image: url,
        title: name,
        srcSet: 'url("' + baseUrl + '_18x18.png") 1x, url("' + baseUrl + '_36x36.png") 2x, url("' + baseUrl + '_72x72.png") 4x',
        replace_mode: 'keep_title',
        replaces: (this.badges_override_twitch ? 'subscriber' : undefined)
      }
    };

    return this.badges[id];
  }

  getBadge (id) {
    this.extDebug('getBadge', id);

    return this.badges[id] || false;
  }

  getSocketEvents () {
    this.extDebug('getSocketEvents');

    return {
      initialize_room: (data) => {
        this.debug('Initializing room! (Room: ' + data.room + ')', data);

        if (data.gameWispChannel && data.gameWispChannel.isLaunched) {
          this.subbed_to[data.room] = {
            subbed: data.isGameWispSub,
            gwData: data.gameWispChannel
          };
        }

        if (data.emotes) {
          for (let i = 0; i < data.emotes.length; i++) {
            let _emote = data.emotes[i];
            if (!_emote.name) {
              this.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
            }
          }
        }

        if (data.badges) {
          for (let i = 0; i < data.badges.length; i++) {
            let _badge = data.badges[i];

            // ID, Channel, Tier data, URL
            this.addBadge(_badge.id, _badge.twitch_channel, _badge.channel, _badge.name || _badge.code, _badge.tier, _badge.url);
          }
        }

        let users = data.userStore;

        if (users) {
          for (let username in users) {
            if (users.hasOwnProperty(username)) {
              let _emoteIds = users[username];
              if (_emoteIds.length > 0) {
                if (this.subs[username]) {
                  this.subs[username].emote_ids = _emoteIds;
                  this.subs[username].loadEmotes();
                } else {
                  this.subs[username] = new GameWisp.Sub(this, username, _emoteIds, null);
                }
              }
            }
          }
        }

        users = data.userStoreBadges;
        if (users) {
          for (let username in users) {
            if (users.hasOwnProperty(username)) {
              let badge = users[username];
              if (this.subs[username]) {
                this.subs[username].addUserBadge(badge);
                this.subs[username].reloadBadges();
              } else {
                this.subs[username] = new GameWisp.Sub(this, username, null, badge);
              }
            }
          }
        }

        api.update_metadata('gamewisp-subscribe');
      },
      update_room: (data) => {
        this.debug('Updating room! (User: ' + data.user.name + ', Room: ' + data.room + ')', data);

        if (data.emotes) {
          for (let i = 0; i < data.emotes.length; i++) {
            var _emote = data.emotes[i];
            if (!_emote.name) {
              this.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
            }
          }
        }

        let user = data.user;

        if (user && user.emoteIDs && user.emoteIDs.length > 0) {
          let _emoteIds = user.emoteIDs;
          if (this.subs[user.name]) {
            this.subs[user.name].emote_ids = _emoteIds;
            this.subs[user.name].loadEmotes();
          } else {
            this.subs[user.name] = new GameWisp.Sub(this, user.name, _emoteIds, null);
          }
        }
      },
      leave_room: (data) => {
        this.debug('Leaving room! (User: ' + data.user + ', Room: ' + data.room + ')', data);
      }
    };
  }
}

GameWisp.Sub = class {
  constructor (_gw, username, emoteIds, badge) {
    this._gw = _gw;

    this.username = username;
    this.emote_ids = emoteIds;
    this.badges = [];
    if (badge) {
      this.addUserBadge(badge);
    }

    this.initialize();
  }

  initialize () {
    this._id_emotes = 'GameWisp-Sub-' + this.username;

    this.loadEmotes();
    this.reloadBadges();
  }

  addUserBadge (badgeId) {
    this.badges.push(badgeId);
  }

  loadEmotes () {
    this.emotes = {};
    this.channels = [];

    if (!this.emote_ids) {
      return;
    }

    for (let i = 0; i < this.emote_ids.length; i++) {
      let emote = this._gw.getEmote(this.emote_ids[i]);
      if (emote) {
        if (!this.emotes[emote.gw_channel]) {
          this.emotes[emote.gw_channel] = [];
        }
        this.emotes[emote.gw_channel].push(emote);
      }
    }

    if (!this._gw.enable_emoticons) {
      return;
    }

    for (let i in this.emotes) {
      if (this.emotes.hasOwnProperty(i)) {
        let emotes = this.emotes[i];

        if (!this._emote_sets) {
          this._emote_sets = [];
        }

        this._emote_sets[i] = {
          emoticons: emotes,
          title: i,
          source: 'GameWisp',
          icon: 'https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png',
          sort: 50,
          has_prefix: 2,
          _set_name: this._id_emotes + '-' + i
        };

        if (emotes.length) {
          api.load_set(this._emote_sets[i]._set_name, this._emote_sets[i]);
          api.user_add_set(this.username, this._emote_sets[i]._set_name);
        } else {
          api.unload_set(this._emote_sets[i]._set_name);
        }
      }
    }
  }

  reloadBadges () {
    if (!this.badges || this.badges.length === 0) {
      return;
    }

    for (let i = 0; i < this.badges.length; i++) {
      let id = this.badges[i];
      let badge = this._gw.getBadge(id);
      if (this._gw.enable_badges) {
        api.room_remove_user_badge(badge.twitch_channel, this.username, this._gw.badges_override_twitch ? 11 : 10);
        api.room_add_user_badge(badge.twitch_channel, this.username, this._gw.badges_override_twitch ? 10 : 11, badge.ffz_data);

        if (this._emote_sets && this._emote_sets[badge.gw_channel]) {
          this._emote_sets[badge.gw_channel].icon = badge.ffz_data.image;
          api.load_set(this._emote_sets[badge.gw_channel]._set_name, this._emote_sets[badge.gw_channel]);
        }
      } else {
        api.room_remove_user_badge(badge.twitch_channel, this.username, this._gw.badges_override_twitch ? 10 : 11);
      }
    }
  }

  unload () {
    this._gw.debug('Unloading user! (User: ' + this.username + ')');

    for (let i = 0; i < this.channels.length; i++) {
      api.unload_set(this._id_emotes + '-' + this.channels[i]);
      api.room_remove_user_badge(this.channels[i], this.username, this._gw.badges_override_twitch ? 10 : 11);
    }
  }
};

GameWisp.Socket = class {
  constructor (_gw, events) {
    this._gw = _gw;

    this.socket = false;
    this._looked_up_users = [];
    this._connected = false;
    this._connecting = false;
    this._connect_attempts = 1;
    this._joined_channels = [];
    this._connection_buffer = [];
    this._events = events;
  }

  connect () {
    if (!ffz.get_user()) {
      return;
    }
    if (this._connected || this._connecting) {
      return;
    }
    this._connecting = true;

    this._gw.log('Socket: Connecting to socket server...');

    this.socket = new WebSocket('wss://emotes.gamewisp.com/');
    this.socket.binaryType = 'arraybuffer';

    this._joined_channels = [];

    this.socket.onopen = () => {
      this._gw.log('Socket: Connected to socket server.');

      this._connected = true;
      this._connect_attempts = 1;

      if (this._connection_buffer.length > 0) {
        let i = this._connection_buffer.length;
        while (i--) {
          let channel = this._connection_buffer[i];
          this.joinRoom(channel);
        }
        this._connection_buffer = [];
      }

      if (this.reconnecting) {
        this.reconnecting = false;
        api.iterate_rooms();
      }
    };

    this.socket.onerror = () => {
      this._gw.log('Socket: Error from socket server.');

      if (this._connecting) {
        this.reconnecting = false;
      }

      this._connect_attempts++;
      this.reconnect();
    };

    this.socket.onclose = () => {
      if (!this._connected || !this.socket) {
        return;
      }

      this._gw.log('Socket: Lost connection to socket server...');

      this._connect_attempts++;
      this.reconnect();
    };

    this.socket.onmessage = (message) => {
      message = msgpack.decode(new Uint8Array(message.data));
      var evt = message.name;

      if (!evt || !(this._events[evt])) {
        return;
      }

      this._gw.debug('Socket: Received event', evt);

      this._events[evt](message.data);
    };
  }

  reconnect () {
    this.disconnect();

    if (this.reconnecting) {
      return;
    }
    this.reconnecting = false;

    this._gw.log('Socket: Trying to reconnect to socket server...');

    setTimeout(() => {
      this.reconnecting = true;
      this.connect();
    }, Math.random() * (Math.pow(2, this._connect_attempts) - 1) * 10000);
  }

  disconnect () {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
    }

    delete this.socket;

    this._connected = false;
    this._connecting = false;
  }

  disconnectInternal () {
    this.disconnect();

    this._gw.log('Socket: Disconnected from socket server.');
  }

  emit (event, data) {
    if (!this._connected || !this.socket) {
      return;
    }

    this.socket.send(JSON.stringify({
      name: event,
      data: data
    }));
  }

  joinRoom (channel) {
    if (!this._gw.enable_emoticons && !this._gw.enable_badges) {
      return;
    }

    if (!this._connected) {
      if (!this._connection_buffer.includes(channel)) {
        this._connection_buffer.push(channel);
      }
      return;
    }

    if (!ffz.get_user() || !ffz.get_user().login) {
      return;
    }

    if (!channel.length) {
      return;
    }

    if (this._joined_channels[channel]) {
      this.leaveRoom(channel);
    }

    this.emit('join_room', {
      user: ffz.get_user().login,
      room: channel,
      mode: ['emotes', 'badges_all'],
      sub_data: true
    });
    this._joined_channels[channel] = true;
  }

  leaveRoom (channel) {
    if (!this._connected) {
      return;
    }
    if (!channel.length) {
      return;
    }

    if (this._joined_channels[channel]) {
      this.emit('leave_room', {
        user: ffz.get_user().login,
        name: channel
      });
    }
    this._joined_channels[channel] = false;
  }
};

// new GameWisp(); // eslint-disable-line
