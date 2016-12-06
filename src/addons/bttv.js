var BTTV = {
  name: 'BetterTTV',
  log: function(string) {
    api.log('[' + BTTV.name + '] ' + string);
  },
  vars: {
    global_emotes: true,
    gif_emotes: false,
    override_emotes: false,
    pro_emotes: true,
    show_emotes_in_menu: true,

    channels: {},

    socket: false,
    global_emotes_loaded: false,
    gif_emotes_loaded: false
  },
  doSettings: function() {
    FrankerFaceZ.settings_info.bttv_global_emotes = {
      type: 'boolean',
      value: BTTV.vars.global_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Global Emoticons',
      help: 'Enable this to show global emoticons.',
      on_update: function(enabled) {
        BTTV.vars.global_emotes = enabled;

        BTTV.updateGlobalEmotes();
      }
    };

    FrankerFaceZ.settings_info.bttv_gif_emotes = {
      type: 'boolean',
      value: BTTV.vars.gif_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] GIF Emoticons',
      help: 'Enable this to show GIF emoticons.',
      on_update: function(enabled) {
        BTTV.vars.gif_emotes = enabled;

        BTTV.updateGlobalEmotes();
        api.iterate_rooms();
      }
    };

    FrankerFaceZ.settings_info.bttv_override_emotes = {
      type: 'boolean',
      value: BTTV.vars.override_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Enable Override Emoticons',
      help: 'Enable this to show override emoticons (like D:).',
      on_update: function(enabled) {
        BTTV.vars.override_emotes = enabled;

        BTTV.updateGlobalEmotes();
      }
    };

    FrankerFaceZ.settings_info.bttv_pro_emotes = {
      type: 'boolean',
      value: BTTV.vars.pro_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Enable Pro Emoticons',
      help: 'Enable this to show Pro emoticons from yourself or other users.',
      on_update: function(enabled) {
        if(!enabled) {
          var i = BTTV.ProUsers.length;
          while(i--) {
            var user = BTTV.ProUsers[i];
            api.unload_set(user._id_emotes);
          }
        }

        BTTV.vars.pro_emotes = enabled;
      }
    };

    FrankerFaceZ.settings_info.bttv_show_emotes_in_menu = {
      type: 'boolean',
      value: BTTV.vars.show_emotes_in_menu,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Show emotes in Emoticon Menu',
      help: 'Enable this to show the emoticons in the Emoticon Menu (you can still enter the emoticons manually when this is disabled)',
      on_update: function(enabled) {
        api.emote_sets['BTTV-Global'].hidden = !enabled;

        for(var name in BTTV.vars.channels) {
          api.emote_sets[BTTV.vars.channels[name].emotes].hidden = !enabled;
          api.emote_sets[BTTV.vars.channels[name].gifemotes_setid].hidden = !enabled;
        }
      }
    };


    BTTV.vars.global_emotes = ffz.settings.get('bttv_global_emotes');
    BTTV.vars.gif_emotes = ffz.settings.get('bttv_gif_emotes');
    BTTV.vars.override_emotes = ffz.settings.get('bttv_override_emotes');
    BTTV.vars.pro_emotes = ffz.settings.get('bttv_pro_emotes');
    BTTV.vars.show_emotes_in_menu = ffz.settings.get('bttv_show_emotes_in_menu');
  },
  init: function() {
    BTTV.log('Addon initialized!');

    if(ffz.has_bttv) {
      BTTV.log('BTTV was found! Addon disabled!');
      return;
    }

    BTTV.vars.socket = new BTTV.Socket();
    BTTV.addBadges();
    if(BTTV.vars.global_emotes) {
      BTTV.updateGlobalEmotes();
    }
    if(BTTV.vars.pro_emotes) {
      BTTV.vars.socket.connect();
    }
  },
  room_add: function(room_id, reg_function, attempts) {
    if(ffz.has_bttv) {
      return;
    }

    BTTV.addChannel(room_id, reg_function, attempts);
  },
  room_message: function(msg) {
    if(ffz.has_bttv) {
      return;
    }

    if(BTTV.vars.pro_emotes && ffz.get_user() && msg.from === ffz.get_user().login) {
      BTTV.vars.socket.broadcastMe(msg.room);
    }
  },
  chat_view_init: function(dom, ember) {
    // Unused
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  },

  addBadges: function(attempts) {
    $.getJSON('https://api.betterttv.net/2/badges')
    .done(function(data) {
      var types = [],
          badges = [],

          _types = data.types,
          _users = data.badges;

      var i = _types.length;
      while(i--) {
        var _type = _types[i];

        var type = {
          name: 'bttv-' + _type.name,
          title: _type.description,
          image: _type.svg,
          no_invert: true
        };

        types[type.name] = type;
        api.add_badge(type.name, type);
      }

      i = _users.length;
      while(i--) {
        var _user = _users[i];

        if(types[_user.type] !== undefined) {
          BTTV.log('Adding badge "' + _user.type + '" for user "' + _user.name + '".');
          api.user_add_badge(_user.name, 21, _user.type);
        }
      }
    }).fail(function(data) {
      if (data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if (attempts < 12) {
        BTTV.log('Failed to fetch badges. Trying again in 5 seconds.');
        return setTimeout(BTTV.addBadges.bind(this, attempts), 5000);
      }
    });
  },

  override_emotes: [ ':\'(', 'D:' ],
  isOverrideEmote: function(emote_regex) {
    for(var i = 0; i < BTTV.override_emotes.length; i++) {
      if(emote_regex === BTTV.override_emotes[i]) {
        return true;
      }
    }
    return false;
  },

  updateGlobalEmotes: function(attempts) {
    BTTV.vars.global_emotes_loaded = false;
    api.unregister_global_set('BTTV-Global');

    $.getJSON('https://api.betterttv.net/emotes')
    .done(function(data) {
      var globalBTTV = [],
          globalBTTV_GIF = [],
          overrideEmotes = [],

          _emotes = data.emotes;

      var i = _emotes.length;
      while(i--) {
        var req_spaces = /[^A-Za-z0-9]/.test(_emotes[i].regex);

        var _emote = _emotes[i],
            match = /cdn.betterttv.net\/emote\/(\w+)/.exec(_emote.url),
            id = match && match[1];

        if (_emote.channel) {
          continue;
        }

        var emote = {
          urls: {
            1: _emote.url
          },
          name: _emote.regex,
          width: _emote.width,
          height: _emote.height,
          require_spaces: req_spaces
        };

        if (id) {
          emote.id = id;
          emote.urls = {
            1: 'https://cdn.betterttv.net/emote/' + id + '/1x',
            2: 'https://cdn.betterttv.net/emote/' + id + '/2x',
            4: 'https://cdn.betterttv.net/emote/' + id + '/3x'
          };
        }

        if(BTTV.isOverrideEmote(_emote.regex)) {
          overrideEmotes.push(emote);
        }
        else {
          if(_emote.imageType === 'gif' && !BTTV.vars.gif_emotes) {
            emote.urls[1] = 'https://cache.lordmau5.com/' + emote.urls[1];
            if(id) {
              emote.urls[2] = 'https://cache.lordmau5.com/' + emote.urls[2];
              emote.urls[4] = 'https://cache.lordmau5.com/' + emote.urls[4];
            }
          }
          globalBTTV.push(emote);
        }
      }

      var emotes = [];

      if(BTTV.vars.global_emotes) {
        emotes = emotes.concat(globalBTTV);
      }

      if(BTTV.vars.override_emotes) {
        emotes = emotes.concat(overrideEmotes);
      }

      if(emotes.length === 0) {
        return;
      }

      var set = {
        emoticons: emotes,
        title: 'BTTV Global Emoticons',
        sort: 101
      };
      api.register_global_set('BTTV-Global', set);
      api.emote_sets['BTTV-Global'].hidden = !BTTV.vars.show_emotes_in_menu;

      BTTV.vars.global_emotes_loaded = true;
    }).fail(function(data) {
      if(data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if(attempts < 12) {
        BTTV.log('Failed to fetch global emotes. Trying again in 5 seconds.');
        return setTimeout(BTTV.updateGlobalEmotes.bind(this, attempts), 5000);
      }
    });
  },

  addChannel: function(room_id, reg_function, attempts) {
    if(BTTV.vars.pro_emotes) {
      BTTV.vars.socket.joinChannel(room_id);
    }

    $.getJSON('https://api.betterttv.net/2/channels/' + room_id)
    .done(function(data) {
      var channelBTTV = [],
          emotes = data.emotes;

      var i = emotes.length;
      while(i--) {
      	var req_spaces = /[^A-Za-z0-9]/.test(emotes[i].code);

        var _emote = emotes[i],
            id = _emote.id,

        emote = {
          urls: {
            1: 'https://cdn.betterttv.net/emote/' + id + '/1x',
            2: 'https://cdn.betterttv.net/emote/' + id + '/2x',
            4: 'https://cdn.betterttv.net/emote/' + id + '/3x'
          },
          id: id,
          name: _emote.code,
          width: 28,
          height: 28,
          owner: {
            display_name: _emote.channel || room_id,
            name: _emote.channel
          },
          require_spaces: req_spaces
        };

        if(_emote.imageType === 'gif' && !BTTV.vars.gif_emotes) {
          emote.urls[1] = 'https://cache.lordmau5.com/' + emote.urls[1];
          emote.urls[2] = 'https://cache.lordmau5.com/' + emote.urls[2];
          emote.urls[4] = 'https://cache.lordmau5.com/' + emote.urls[4];
        }

        channelBTTV.push(emote);
      }

      if(!channelBTTV.length) {
        return;
      }

      BTTV.vars.channels[room_id] = {
        emotes: 'BTTV-Channel-' + room_id
      };

      var set = {
        emoticons: channelBTTV,
        title: 'Channel Emoticons'
      };

      if(channelBTTV.length) {
        api.register_room_set(room_id, BTTV.vars.channels[room_id].emotes, set); // Load normal emotes
        api.emote_sets[BTTV.vars.channels[room_id].emotes].hidden = !BTTV.vars.show_emotes_in_menu;
      }
    }).fail(function(data) {
      if (data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if (attempts < 12) {
        BTTV.log('Failed to fetch channel emotes. Trying again in 5 seconds.');
        return setTimeout(BTTV.addChannel.bind(this, room_id, reg_function, attempts), 5000);
      }
    });
  },

  ProUser: function(username, emotes_array) {
    this.username = username;
    this.emotes_array = emotes_array;

    this.initialize();

    BTTV.ProUsers[this.username] = this;
  },
  ProUsers: {},

  Socket: function() {
    this.socket = false;
    this._lookedUpUsers = [];
    this._connected = false;
    this._connecting = false;
    this._connectAttempts = 1;
    this._joinedChannels = [];
    this._connectionBuffer = [];
    this._events = BTTV.SocketEvents;
  },

  SocketEvents: {
    lookup_user: function(subscription) {
      if (!subscription.pro || !BTTV.vars.pro_emotes) {
        return;
      }

      if (subscription.pro && subscription.emotes) {
        if(subscription.name in BTTV.ProUsers) {
          BTTV.ProUsers[subscription.name].emotes_array = subscription.emotes;
          BTTV.ProUsers[subscription.name].loadEmotes();
        }
        else {
          new BTTV.ProUser(subscription.name, subscription.emotes);
        }
      }
    }
  }
};

/* Prototyping */

BTTV.ProUser.prototype.loadEmotes = function() {
  this.emotes = [];

  this.emotes_array.forEach(function(_emote, index, array) {
    var emote = {
      urls: {
        1: 'https://cdn.betterttv.net/emote/' + _emote.id + '/1x',
        2: 'https://cdn.betterttv.net/emote/' + _emote.id + '/2x',
        4: 'https://cdn.betterttv.net/emote/' + _emote.id + '/3x'
      },
      id: _emote.id,
      name: _emote.code,
      width: 28,
      height: 28,
      owner: {
        display_name: _emote.channel || '',
        name: _emote.channel || ''
      },
      require_spaces: true
    };

    if(_emote.imageType === 'gif' && !BTTV.vars.gif_emotes) {
      emote.urls[1] = 'https://cache.lordmau5.com/' + emote.urls[1];
      emote.urls[2] = 'https://cache.lordmau5.com/' + emote.urls[2];
      emote.urls[4] = 'https://cache.lordmau5.com/' + emote.urls[4];
    }
    this.emotes.push(emote);
  }, this);

  var set = {
    emoticons: this.emotes,
    title: 'Personal Emoticons'
  };

  if(this.emotes.length) {
    api.load_set(this._id_emotes, set);
    api.user_add_set(this.username, this._id_emotes);
  }
};

BTTV.ProUser.prototype.initialize = function() {
  this._id_emotes = 'BTTV-ProUser-' + this.username;

  this.loadEmotes();
};

/** Begin Socket **/

BTTV.Socket.prototype.connect = function() {
  if (ffz.get_user() === undefined) {
    return;
  }
  if (this._connected || this._connecting) {
    return;
  }
  this._connecting = true;

  BTTV.log('Socket: Connecting to socket server...');

  var _self = this;
  this.socket = new WebSocket('wss://sockets.betterttv.net/ws');

  this.socket.onopen = function() {
    BTTV.log('Socket: Connected to socket server.');

    _self._connected = true;
    _self._connectAttempts = 1;

    if(_self._connectionBuffer.length > 0) {
      var i = _self._connectionBuffer.length;
      while(i--) {
        var channel = _self._connectionBuffer[i];
        _self.joinChannel(channel);
        _self.broadcastMe(channel);
      }
      _self._connectionBuffer = [];
    }
  };

  this.socket.onerror = function() {
    BTTV.log('Socket: Error from socket server.');

    _self._connectAttempts++;
    _self.reconnect();
  };

  this.socket.onclose = function() {
    if (!_self._connected || !_self.socket) {
      return;
    }

    BTTV.log('Socket: Disconnected from socket server.');

    _self._connectAttempts++;
    _self.reconnect();
  };

  this.socket.onmessage = function(message) {
    var evt;

    try {
      evt = JSON.parse(message.data);
    }
    catch (e) {
      BTTV.log('Socket: Error parsing message', e);
    }

    if (!evt || !(evt.name in _self._events)) {
      return;
    }

    BTTV.log('Socket: Received event', evt);

    _self._events[evt.name](evt.data);
  };
};

BTTV.Socket.prototype.reconnect = function() {
  var _self = this;

  this.disconnect();

  if (this._connecting === false) {
    return;
  }
  this._connecting = false;

  setTimeout(function() {
    _self.connect();
  }, Math.random() * (Math.pow(2, this._connectAttempts) - 1) * 30000);
};

BTTV.Socket.prototype.disconnect = function() {
  var _self = this;

  if (this.socket) {
    try {
      this.socket.close();
    }
    catch (e) {}
  }

  delete this.socket;

  this._connected = false;
};

BTTV.Socket.prototype.emit = function(evt, data) {
  if (!this._connected || !this.socket) {
    return;
  }

  this.socket.send(JSON.stringify({
    name: evt,
    data: data
  }));
};

BTTV.Socket.prototype.broadcastMe = function(channel) {
  if (!this._connected) {
    return;
  }
  if (!ffz.get_user()) {
    return;
  }

  this.emit('broadcast_me', {
    name: ffz.get_user().login,
    channel: channel
  });
};

BTTV.Socket.prototype.joinChannel = function(channel) {
  if (!this._connected) {
    if (!this._connectionBuffer.includes(channel)) {
      this._connectionBuffer.push(channel);
    }
    return;
  }

  if (!channel.length) {
    return;
  }

  if (this._joinedChannels[channel]) {
      this.emit('part_channel', {
        name: channel
      });
  }

  this.emit('join_channel', {
    name: channel
  });
  this._joinedChannels[channel] = true;
};

registerAddon(BTTV);
