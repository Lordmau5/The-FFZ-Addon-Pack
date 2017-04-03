class GameWisp extends Addon {
  constructor() {
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

  doSettings() {
    super.doSettings();

    var _self = this;

    FrankerFaceZ.settings_info.gamewisp_enable_global_emoticons = {
      type: 'boolean',
      value: this.enable_global_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Global Emoticons',
      help: 'Enable this to show GameWisp global emoticons.',
      on_update: function(enabled) {
        _self.enable_global_emoticons = enabled;
        api.update_metadata('gamewisp-subscribe');

        _self.updateGlobals();
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_emoticons = {
      type: 'boolean',
      value: this.enable_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Emoticons',
      help: 'Enable this to show GameWisp sub emoticons.',
      on_update: function(enabled) {
        _self.enable_emoticons = enabled;
        api.update_metadata('gamewisp-subscribe');

        if(enabled) {
          if(!_self.enable_badges) {
            _self.socket.connect();

            for(var i=0; i<_self.channels.length; i++) {
              var channel = _self.channels[i];
              _self.socket.joinRoom(channel);
            }
          }
        }
        else {
          for(var username in _self.subs) {
            _self.subs[username].unload();
          }

          if(!_self.enable_badges) {
            _self.subs = {};

            _self.socket.disconnectInternal();
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
      on_update: function(enabled) {
        _self.enable_sub_button = enabled;
        api.update_metadata('gamewisp-subscribe');
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_badges = {
      type: 'boolean',
      value: this.enable_badges,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Badges',
      help: 'Enable this to show GameWisp subscriber badges.',
      on_update: function(enabled) {
        _self.enable_badges = enabled;

        var username;

        if(enabled) {
          if(!_self.enable_emoticons) {
            _self.socket.connect();

            for(var i=0; i<_self.channels.length; i++) {
              var channel = _self.channels[i];
              _self.socket.joinRoom(channel);
            }
          }
          else {
            for(username in _self.subs) {
              _self.subs[username].reloadBadges();
            }
          }
        }
        else {
          for(username in _self.subs) {
            _self.subs[username].reloadBadges();
          }

          if(!_self.enable_emoticons) {
            _self.subs = {};

            _self.socket.disconnectInternal();
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
      on_update: function(enabled) {
        _self.badges_override_twitch = enabled;

        if(_self.enable_badges) {
          for(var badge in _self.badges) {
            _self.badges[badge].ffz_data.replaces = enabled ? 'subscriber' : undefined;
          }

          for(var username in _self.subs) {
            _self.debug(username);
            _self.subs[username].reloadBadges();
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

  isEnabled() {
    return super.isEnabled && (this.enable_global_emoticons || this.enable_emoticons);
  }

  preInit() {
    super.preInit();

    var msgpack = document.createElement('script');
    msgpack.type = 'text/javascript';
    msgpack.src = 'https://rawgit.com/kawanet/msgpack-lite/master/dist/msgpack.min.js';
    document.head.appendChild(msgpack);
  }

  init() {
    super.init();

    this.updateGlobals();

    var _self = this;

    this.socket = new GameWisp.Socket(this, this.getSocketEvents());
    if(this.enable_emoticons || this.enable_badges) {
      this.socket.connect();
    }

    var metadata = {
      subscribe: {
        refresh: false,
        order: 97,
        host_order: 49,
        button: true,

        static_label: '<img src="https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png"/>',
        label: function(view, channel, is_hosting) {
          if(!_self.isEnabled() || !_self.enable_sub_button) {
            return '';
          }

          var label = '', id = channel.get('id');
          if(id in _self.subbed_to) {
            label = _self.subbed_to[id].subbed ? 'Visit Channel' : 'Subscribe';

            if(ffz.get_user() && ffz.get_user().login == id) {
              label = 'Visit Channel';
            }
          }

          return label;
        },

        disabled: function(view, channel, is_hosting) {
          if(!_self.isEnabled() || !_self.enable_sub_button) {
            return true;
          }

          // TODO: Disable when tiers get published to the socket and user is on highest tier?

          // var id = channel.get('id');
          // return GameWisp.vars.subbed_to[id];
          return !_self.isEnabled() || !_self.enable_sub_button;
      	},

        click: function(event, button, view, channel, is_hosting) {
          if(!_self.isEnabled()) {
            return;
          }

          var id = channel.get('id');
          if(id in _self.subbed_to) {
            window.open(_self.subbed_to[id].gwData.url, '_blank');
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

  roomAdd(roomId) {
    super.roomAdd(roomId);

    if(!this.channels.includes(roomId)) {
      this.channels.push(roomId);
    }

    this.socket.joinRoom(roomId);
  }

  roomRemove(roomId) {
    super.roomRemove(roomId);

    var index = this.channels.indexOf(roomId);
    if(index != -1) {
      this.channels.splice(index);
    }

    if(roomId in this.subbed_to) {
      delete this.subbed_to[roomId];
    }

    this.socket.leaveRoom(roomId);
  }

  updateGlobals() {
    this.extDebug('updateGlobals');

    api.unregister_global_set('GameWisp-Global');

    if(!this.enable_global_emoticons) {
      return;
    }

    var params = {
      limit: 50
    };
    $.getJSON('https://api.gamewisp.com/pub/v1/emote/global', params, function(json) {
      var emotes = [];

      var _emotes = json.data;
      for(var i=0; i<_emotes.length; i++) {
        var _emote = _emotes[i];

        var emote = {
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

      var set = {
        emoticons: emotes,
        title: 'Global Emoticons',
        source: 'GameWisp',
        icon: 'https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png',
        sort: 101
      };
      api.register_global_set('GameWisp-Global', set);
    });
  }

  addEmote(id, code, channel, gw_channel, url) {
    this.extDebug('addEmote', [id, code, channel, gw_channel, url]);

    if(this.emotes[id]) {
      return this.emotes[id];
    }

    var base_url = url.replace(/(\d*)x(\d*)\.png/, '');
    this.emotes[id] = {
      urls: {
        1: url,
        2: base_url + '56x56.png',
        4: base_url + '112x112.png'
      },
      name: code,
      width: 28,
      height: 28,
      require_spaces: false,
      gw_channel: gw_channel,
      id: channel + '-' + code
    };

    return this.emotes[id];
  }

  getEmote(id) {
    this.extDebug('getEmote', id);

    return this.emotes[id] || false;
  }

  addBadge(id, twitch_channel, gw_channel, name, tier, url) {
    this.extDebug('addBadge', [id, twitch_channel, gw_channel, tier, url]);

    if(this.badges[id]) {
      return this.badges[id];
    }

    var base_url = url.replace(/(\d*)x(\d*)\.png/, '');
    this.badges[id] = {
      twitch_channel: twitch_channel,
      gw_channel: gw_channel,
      name: name,
      tier: tier,
      ffz_data: {
        id: 'gamewisp-subscriber',
        image: url,
        title: name,
        srcSet: 'url("' + base_url + '_18x18.png") 1x, url("' + base_url + '_36x36.png") 2x, url("' + base_url + '_72x72.png") 4x',
        replace_mode: 'keep_title',
        replaces: (this.badges_override_twitch ? 'subscriber' : undefined)
      }
    };

    return this.badges[id];
  }

  getBadge(id) {
    this.extDebug('getBadge', id);

    return this.badges[id] || false;
  }

  getSocketEvents() {
    this.extDebug('getSocketEvents');

    var _self = this;

    return {
      initialize_room: function(data) {
        _self.debug('Initializing room! (Room: ' + data.room + ')', data);

        if(data.gameWispChannel && data.gameWispChannel.isLaunched) {
          _self.subbed_to[data.room] = {
            subbed: data.isGameWispSub,
            gwData: data.gameWispChannel
          };
        }

        var i;
        if(data.emotes) {
          for(i=0; i<data.emotes.length; i++) {
            var _emote = data.emotes[i];
            if(!_emote.name) {
              _self.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
            }
          }
        }

        if(data.badges) {
          for(i=0; i<data.badges.length; i++) {
            var _badge = data.badges[i];

            // ID, Channel, Tier data, URL
            _self.addBadge(_badge.id, _badge.twitch_channel, _badge.channel, _badge.name || _badge.code, _badge.tier, _badge.url);
          }
        }

        var users = data.userStore,
            username;

        if(users) {
          for(username in users) {
            if(users.hasOwnProperty(username)) {
              var _emote_ids = users[username];
              if(_emote_ids.length > 0) {
                if(username in _self.subs) {
                  _self.subs[username].emote_ids = _emote_ids;
                  _self.subs[username].loadEmotes();
                }
                else {
                  _self.subs[username] = new GameWisp.Sub(_self, username, _emote_ids, null);
                }
              }
            }
          }
        }

        users = data.userStoreBadges;
        if(users) {
          for(username in users) {
            if(users.hasOwnProperty(username)) {
              var _badge_ids = users[username];
              if(_badge_ids.length > 0) {
                if(username in _self.subs) {
                  _self.subs[username].badge_ids = _badge_ids;
                  _self.subs[username].reloadBadges();
                }
                else {
                  _self.subs[username] = new GameWisp.Sub(_self, username, null, _badge_ids);
                }
              }
            }
          }
        }

        api.update_metadata('gamewisp-subscribe');
      },
      update_room: function(data) {
        _self.debug('Updating room! (User: ' + data.user.name + ', Room: ' + data.room + ')', data);

        var i;
        if(data.emotes) {
          for(i=0; i<data.emotes.length; i++) {
            var _emote = data.emotes[i];
            if(!_emote.name) {
              _self.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
            }
          }
        }

        if(data.badges) {
          for(i=0; i<data.badges.length; i++) {
            var _badge = data.badges[i];

            // ID, Channel, Tier data, URL
            _self.addBadge(_badge.id, _badge.twitch_channel, _badge.channel, _badge.name || _badge.code, _badge.tier, _badge.url);
          }
        }

        var user = data.user;

        if(user && user.emoteIDs && user.emoteIDs.length > 0) {
          var _emote_ids = user.emoteIDs;
          if(user.name in _self.subs) {
            _self.subs[user.name].emote_ids = _emote_ids;
            _self.subs[user.name].loadEmotes();
          }
          else {
            _self.subs[user.name] = new GameWisp.Sub(_self, user.name, _emote_ids, null);
          }
        }

        if(user && user.badgeIDs && user.badgeIDs.length > 0) {
          var _badge_ids = user.badgeIDs;
          if(user.name in _self.subs) {
            _self.subs[user.name].badge_ids = _badge_ids;
            _self.subs[user.name].reloadBadges();
          }
          else {
            _self.subs[user.name] = new GameWisp.Sub(_self, user.name, null, _badge_ids);
          }
        }
      },
      leave_room: function(data) {
        _self.debug('Leaving room! (User: ' + data.user + ', Room: ' + data.room + ')', data);
      }
    };
  }
}

GameWisp.Sub = class {
  constructor(_gw, username, emote_ids, badge_ids) {
    this._gw = _gw;

    this.username = username;
    this.emote_ids = emote_ids;
    this.badge_ids = badge_ids;

    this.initialize();
  }

  initialize() {
    this._id_emotes = 'GameWisp-Sub-' + this.username;

    this.loadEmotes();
    this.reloadBadges();
  }

  loadEmotes() {
    this.emotes = {};
    this.channels = [];

    if(!this.emote_ids) {
      return;
    }

    for(var i=0; i<this.emote_ids.length; i++) {
      var emote = this._gw.getEmote(this.emote_ids[i]);
      if(emote) {
        if(!this.emotes[emote.gw_channel]) {
          this.emotes[emote.gw_channel] = [];
        }
        this.emotes[emote.gw_channel].push(emote);
      }
    }

    if(!this._gw.enable_emoticons) {
      return;
    }

    for(var k in this.emotes) {
      if(this.emotes.hasOwnProperty(k)) {
        var emotes = this.emotes[k];

        if(!this._emote_sets) {
          this._emote_sets = [];
        }

        this._emote_sets[k] = {
          emoticons: emotes,
          title: k,
          source: 'GameWisp',
          icon: 'https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png',
          sort: 50,
          _set_name: this._id_emotes + '-' + k
        };

        if(emotes.length) {
          api.load_set(this._emote_sets[k]._set_name, this._emote_sets[k]);
          api.user_add_set(this.username, this._emote_sets[k]._set_name);
        }
        else {
          api.unload_set(this._emote_sets[k]._set_name);
        }
      }
    }
  }

  reloadBadges() {
    if(!this.badge_ids) {
      return;
    }

    this._gw.debug('Badges for ' + this.username, this.badge_ids);
    for(var id in this.badge_ids) {
      if(this.badge_ids.hasOwnProperty(id)) {
        var badge = this._gw.getBadge(this.badge_ids[id]);
        if(this._gw.enable_badges) {
          api.room_remove_user_badge(badge.twitch_channel, this.username, this._gw.badges_override_twitch ? 11 : 10);
          api.room_add_user_badge(badge.twitch_channel, this.username, this._gw.badges_override_twitch ? 10 : 11, badge.ffz_data);

          if(this._emote_sets && this._emote_sets[badge.gw_channel]) {
            this._emote_sets[badge.gw_channel].icon = badge.ffz_data.image;
            api.load_set(this._emote_sets[badge.gw_channel]._set_name, this._emote_sets[badge.gw_channel]);
          }
        }
        else {
          api.room_remove_user_badge(badge.twitch_channel, this.username, this._gw.badges_override_twitch ? 10 : 11);
        }
      }
    }
  }

  unload() {
    this._gw.debug('Unloading user! (User: ' + this.username + ')');

    for(var i=0; i<this.channels.length; i++) {
      api.unload_set(this._id_emotes + '-' + this.channels[i]);
      api.room_remove_user_badge(this.channels[i], this.username, this._gw.badges_override_twitch ? 10 : 11);
    }
  }
};

GameWisp.Socket = class {
  constructor(_gw, events) {
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

  connect() {
    if(!ffz.get_user()) {
      return;
    }
    if(this._connected || this._connecting) {
      return;
    }
    this._connecting = true;

    this._gw.log('Socket: Connecting to socket server...');

    var _self = this;
    this.socket = new WebSocket('wss://emotes.gamewisp.com/');
    this.socket.binaryType = 'arraybuffer';

    this._joined_channels = [];

    this.socket.onopen = function() {
      _self._gw.log('Socket: Connected to socket server.');

      _self._connected = true;
      _self._connect_attempts = 1;

      if(_self._connection_buffer.length > 0) {
        var i = _self._connection_buffer.length;
        while(i--) {
          var channel = _self._connection_buffer[i];
          _self.joinRoom(channel);
        }
        _self._connection_buffer = [];
      }

      if(_self.reconnecting) {
        _self.reconnecting = false;
        api.iterate_rooms();
      }
    };

    this.socket.onerror = function() {
      _self._gw.log('Socket: Error from socket server.');

      if(_self._connecting) {
        _self.reconnecting = false;
      }

      _self._connect_attempts++;
      _self.reconnect();
    };

    this.socket.onclose = function() {
      if(!_self._connected || !_self.socket) {
        return;
      }

      _self._gw.log('Socket: Lost connection to socket server...');

      _self._connect_attempts++;
      _self.reconnect();
    };

    this.socket.onmessage = function(message) {
      message = msgpack.decode(new Uint8Array(message.data));
      var evt = message.name;

      if(!evt || !(evt in _self._events)) {
        return;
      }

      _self._gw.debug('Socket: Received event', evt);

      _self._events[evt](message.data);
    };
  }

  reconnect() {
    var _self = this;

    this.disconnect();

    if(this.reconnecting) {
      return;
    }
    this.reconnecting = false;

    this._gw.log('Socket: Trying to reconnect to socket server...');

    setTimeout(function() {
      _self.reconnecting = true;
      _self.connect();
    }, Math.random() * (Math.pow(2, this._connect_attempts) - 1) * 10000);
  }

  disconnect() {
    var _self = this;

    if(this.socket) {
      try {
        this.socket.close();
      }
      catch (e) {}
    }

    delete this.socket;

    this._connected = false;
    this._connecting = false;
  }

  disconnectInternal() {
    this.disconnect();

    this._gw.log('Socket: Disconnected from socket server.');
  }

  emit(event, data) {
    if(!this._connected || !this.socket) {
      return;
    }

    this.socket.send(JSON.stringify({
      name: event,
      data: data
    }));
  }

  joinRoom(channel) {
    if(!this._gw.enable_emoticons && !this._gw.enable_badges) {
      return;
    }

    if(!this._connected) {
      if(!this._connection_buffer.includes(channel)) {
        this._connection_buffer.push(channel);
      }
      return;
    }

    if(!ffz.get_user() || !ffz.get_user().login) {
      return;
    }

    if(!channel.length) {
      return;
    }

    if(this._joined_channels[channel]) {
      this.leaveRoom(channel);
    }

    this.emit('join_room', {
      user: ffz.get_user().login,
      room: channel,
      mode: ['emotes', 'badges'],
      sub_data: true
    });
    this._joined_channels[channel] = true;
  }

  leaveRoom(channel) {
    if(!this._connected) {
      return;
    }
    if(!channel.length) {
      return;
    }

    if(this._joined_channels[channel]) {
      this.emit('leave_room', {
        user: ffz.get_user().login,
        name: channel
      });
    }
    this._joined_channels[channel] = false;
  }
};

new GameWisp();
