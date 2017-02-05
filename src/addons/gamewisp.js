var GameWisp = {
  name: 'GameWisp',
  log: function(string, data) {
    api.log('[' + GameWisp.name + '] ' + string, data);
  },
  debug: function(string, data) {
    if(!localStorage.ffz_ap_debug_mode) {
      return;
    }

    api.log('[' + GameWisp.name + ' - DEBUG] ' + string, data);
  },
  vars: {
    enable_global_emoticons: true,
    enable_emoticons: true,
    enable_badges: true,

    socket: false,
    emotes: {},
    channels: [],
    subbed_to: {}
  },
  doSettings: function() {
    FrankerFaceZ.settings_info.gamewisp_enable_global_emoticons = {
      type: 'boolean',
      value: GameWisp.vars.enable_global_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Global Emoticons',
      help: 'Enable this to show GameWisp global emoticons.',
      on_update: function(enabled) {
        GameWisp.vars.enable_global_emoticons = enabled;
        api.update_metadata('gamewisp-subscribe');

        GameWisp.update_globals();
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_emoticons = {
      type: 'boolean',
      value: GameWisp.vars.enable_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Emoticons',
      help: 'Enable this to show GameWisp sub emoticons.',
      on_update: function(enabled) {
        GameWisp.vars.enable_emoticons = enabled;
        api.update_metadata('gamewisp-subscribe');

        if(enabled) {
          GameWisp.vars.socket.connect();

          for(var i=0; i<GameWisp.vars.channels.length; i++) {
            var channel = GameWisp.vars.channels[i];
            GameWisp.vars.socket.join_room(channel);
          }
        }
        else {
          for(var username in GameWisp.Subs) {
            GameWisp.Subs[username].unload();
          }
          GameWisp.Subs = {};

          GameWisp.vars.socket.disconnect_int();
        }
      }
    };

    // FrankerFaceZ.settings_info.gamewisp_enable_badges = {
    //   type: 'boolean',
    //   value: GameWisp.vars.enable_badges,
    //   category: 'FFZ Add-On Pack',
    //   name: '[GameWisp] Enable Badges',
    //   help: 'Enable this to show GameWisp sub badges.',
    //   on_update: function(enabled) {
    //     GameWisp.vars.enable_badges = enabled;
    //   }
    // };

    GameWisp.vars.enable_global_emoticons = ffz.settings.get('gamewisp_enable_global_emoticons');
    GameWisp.vars.enable_emoticons = ffz.settings.get('gamewisp_enable_emoticons');
    // GameWisp.vars.enable_badges = ffz.settings.get('gamewisp_enable_badges');
  },
  isEnabled: function() {
    return GameWisp.vars.enable_global_emoticons || GameWisp.vars.enable_emoticons;
  },
  preinit: function() {
    $('head').append('<script src="https://rawgit.com/kawanet/msgpack-lite/master/dist/msgpack.min.js"></script>');
  },
  init: function() {
    GameWisp.log('Addon initialized!');

    GameWisp.update_globals();

    GameWisp.vars.socket = new GameWisp.Socket();
    if(GameWisp.vars.enable_emoticons) {
      GameWisp.vars.socket.connect();
    }

    var metadata = {
      subscribe: {
        refresh: false,
        order: 97,
        host_order: 49,
        button: true,

        static_label: '<img src="https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png"/>',
        label: function(view, channel, is_hosting) {
          if(!GameWisp.isEnabled()) {
            return '';
          }

          var label = '', id = channel.get('id');
          if(id in GameWisp.vars.subbed_to) {
            label = GameWisp.vars.subbed_to[id].subbed ? 'Visit Channel' : 'Subscribe';
          }
          return label;
        },

        disabled: function(view, channel, is_hosting) {
          // TODO: Disable when tiers get published to the socket and user is on highest tier?

          // var id = channel.get('id');
          // return GameWisp.vars.subbed_to[id];
          return !GameWisp.isEnabled();
      	},

        click: function(event, button, view, channel, is_hosting) {
          if(!GameWisp.isEnabled()) {
            return;
          }

          var id = channel.get('id');
          if(id in GameWisp.vars.subbed_to) {
            window.open(GameWisp.vars.subbed_to[id].gwData.url, '_blank');
          }
      	}
      }
    };
    api.register_metadata('gamewisp-subscribe', metadata.subscribe);
  },
  room_add: function(room_id) {
    GameWisp.vars.channels.push(room_id);

    GameWisp.vars.socket.join_room(room_id);
  },
  room_remove: function(room_id) {
    var index = GameWisp.vars.channels.indexOf(room_id);
    if(index != -1) {
      GameWisp.vars.channels.splice(index);
    }

    if(room_id in GameWisp.vars.subbed_to) {
      delete GameWisp.vars.subbed_to[room_id];
    }

    GameWisp.vars.socket.leave_room(room_id);
  },
  room_message: function(msg) {
    // Unused
  },
  chat_view_init: function(dom, ember) {
    // Unused
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  },

  update_globals: function() {
    api.unregister_global_set('GameWisp-Global');

    if(!GameWisp.vars.enable_global_emoticons) {
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
  },
  addEmote: function(id, code, channel, gw_channel, url) {
    if(GameWisp.vars.emotes[id]) {
      return GameWisp.vars.emotes[id];
    }

    url = url.replace('_28x28.png', '_');
    GameWisp.vars.emotes[id] = {
      urls: {
        1: url + '28x28.png',
        2: url + '56x56.png',
        4: url + '112x112.png'
      },
      name: code,
      width: 28,
      height: 28,
      require_spaces: false,
      gw_channel: gw_channel,
      id: channel + '-' + code
    };

    return GameWisp.vars.emotes[id];
  },
  getEmote: function(id) {
    return GameWisp.vars.emotes[id] || false;
  },

  Sub: function(username, emote_ids) {
    this.username = username;
    this.emote_ids = emote_ids;

    this.initialize();

    GameWisp.Subs[this.username] = this;
  },
  Subs: {},

  Socket: function() {
    this.socket = false;
    this._lookedUpUsers = [];
    this._connected = false;
    this._connecting = false;
    this._connectAttempts = 1;
    this._joinedChannels = [];
    this._connectionBuffer = [];
    this._events = GameWisp.SocketEvents;
  },

  SocketEvents: {
    initialize_room: function(data) {
      GameWisp.debug('Initializing room! (Room: ' + data.room + ')');

      if(data.gameWispChannel && data.gameWispChannel.isLaunched) {
        GameWisp.vars.subbed_to[data.room] = {
          subbed: data.isGameWispSub,
          gwData: data.gameWispChannel
        };
      }

      for(var i=0; i<data.emotes.length; i++) {
        var _emote = data.emotes[i];
        if(!_emote.name) {
          var emote = GameWisp.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
        }
      }

      var users = data.userStore;
      for(var key in users) {
        var _emote_ids = users[key];
        if(_emote_ids.length > 0) {
          if(key in GameWisp.Subs) {
            GameWisp.Subs[key].emote_ids = _emote_ids;
            GameWisp.Subs[key].load_emotes();
          }
          else {
            new GameWisp.Sub(key, _emote_ids);
          }
        }
      }

      api.update_metadata('gamewisp-subscribe');
    },
    update_room: function(data) {
      GameWisp.debug('Updating room! (User: ' + data.user.name + ', Room: ' + data.room + ')');

      for(var i=0; i<data.emotes.length; i++) {
        var _emote = data.emotes[i];
        if(!_emote.name) {
          var emote = GameWisp.addEmote(_emote.id, _emote.code, _emote.twitch_channel, _emote.channel, _emote.url);
        }
      }

      var user = data.user;
      if(user.emoteIDs.length > 0) {
        if(user.name in GameWisp.Subs) {
          GameWisp.Subs[user.name].emote_ids = user.emoteIDs;
          GameWisp.Subs[user.name].load_emotes();
        }
        else {
          new GameWisp.Sub(user.name, user.emoteIDs);
        }
      }
    },
    leave_room: function(data) {
      GameWisp.log('Leaving room! (User: ' + data.user + ', Room: ' + data.room + ')');

      // if(!GameWisp.removeUserChannel(data.user, data.room)) {
      //   GameWisp.Subs[data.user].unload();
      // }
    }
  }
};

/** Prototyping **/

GameWisp.Sub.prototype.load_emotes = function() {
  this.emotes = {};
  this.channels = [];

  for(var i=0; i<this.emote_ids.length; i++) {
    var emote = GameWisp.getEmote(this.emote_ids[i]);
    if(emote) {
      if(!this.emotes[emote.gw_channel]) {
        this.emotes[emote.gw_channel] = [];
      }
      this.emotes[emote.gw_channel].push(emote);
    }
  }

  for(var k in this.emotes) {
    if(this.emotes.hasOwnProperty(k)) {
      var emotes = this.emotes[k];

      var set = {
        emoticons: emotes,
        title: k,
        source: 'GameWisp',
        icon: 'https://cdn.lordmau5.com/ffz-ap/gamewisp/icon_16x.png',
        sort: 50
      };

      api.unload_set(this._id_emotes + '-' + k);
      if(emotes.length) {
        api.load_set(this._id_emotes + '-' + k, set);
        api.user_add_set(this.username, this._id_emotes + '-' + k);
      }
    }
  }
};

GameWisp.Sub.prototype.initialize = function() {
  this._id_emotes = 'GameWisp-Sub-' + this.username;

  this.load_emotes();
};

GameWisp.Sub.prototype.unload = function() {
  GameWisp.debug('Unloading user! (User: ' + this.username + ')');

  for(var i=0; i<this.channels.length; i++) {
    api.unload_set(this._id_emotes + '-' + this.channels[i]);
  }
};

/** Begin Socket **/

GameWisp.Socket.prototype.connect = function() {
  if(!ffz.get_user()) {
    return;
  }
  if(this._connected || this._connecting) {
    return;
  }
  this._connecting = true;

  GameWisp.log('Socket: Connecting to socket server...');

  var _self = this;
  this.socket = new WebSocket('wss://emotes.gamewisp.com/');
  this.socket.binaryType = 'arraybuffer';

  this._joinedChannels = [];

  this.socket.onopen = function() {
    GameWisp.log('Socket: Connected to socket server.');

    _self._connected = true;
    _self._connectAttempts = 1;

    if(_self._connectionBuffer.length > 0) {
      var i = _self._connectionBuffer.length;
      while(i--) {
        var channel = _self._connectionBuffer[i];
        _self.join_room(channel);
      }
      _self._connectionBuffer = [];
    }
  };

  this.socket.onerror = function() {
    GameWisp.log('Socket: Error from socket server.');

    _self._connectAttempts++;
    _self.reconnect();
  };

  this.socket.onclose = function() {
    if(!_self._connected || !_self.socket) {
      return;
    }

    GameWisp.log('Socket: Lost connection to socket server...');

    _self._connectAttempts++;
    _self.reconnect();
  };

  this.socket.onmessage = function(message) {
    message = msgpack.decode(new Uint8Array(message.data));
    var evt = message.name;

    if(!evt || !(evt in _self._events)) {
      return;
    }

    GameWisp.debug('Socket: Received event', evt);

    _self._events[evt](message.data);
  };
};

GameWisp.Socket.prototype.reconnect = function() {
  var _self = this;

  this.disconnect();

  if(this._connecting === false) {
    return;
  }
  this._connecting = false;

  GameWisp.log('Socket: Trying to reconnect to socket server...');

  setTimeout(function() {
    _self.connect();
  }, Math.random() * (Math.pow(2, this._connectAttempts) - 1) * 30000);
};

GameWisp.Socket.prototype.disconnect = function() {
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
};

GameWisp.Socket.prototype.disconnect_int = function() {
  this.disconnect();

  GameWisp.log('Socket: Disconnected from socket server.');
};

GameWisp.Socket.prototype.emit = function(evt, data) {
  if(!this._connected || !this.socket) {
    return;
  }

  this.socket.send(JSON.stringify({
    name: evt,
    data: data
  }));
};

GameWisp.Socket.prototype.join_room = function(channel) {
  if(!GameWisp.vars.enable_emoticons) {
    return;
  }

  if(!this._connected) {
    if(!this._connectionBuffer.includes(channel)) {
      this._connectionBuffer.push(channel);
    }
    return;
  }

  if(!ffz.get_user() || !ffz.get_user().login) {
    return;
  }

  if(!channel.length) {
    return;
  }

  if(this._joinedChannels[channel]) {
    this.leave_room(channel);
  }

  this.emit('join_room', {
    user: ffz.get_user().login,
    room: channel,
  });
  this._joinedChannels[channel] = true;
};

GameWisp.Socket.prototype.leave_room = function(channel) {
  if(!this._connected) {
    return;
  }
  if(!channel.length) {
    return;
  }

  if(this._joinedChannels[channel]) {
    this.emit('leave_room', {
      user: ffz.get_user().login,
      name: channel
    });
  }
  this._joinedChannels[channel] = false;
};

registerAddon(GameWisp);
