class BTTV extends Addon {
  constructor() {
    super('BTTV');

    this.global_emotes = true;
    this.gif_emotes = 1;
    this.override_emotes_enabled = false;
    this.pro_emotes = true;
    this.channel_emotes = true;
    this.show_emotes_in_menu = true;

    this.channels = {};
    this.pro_users = {};

    this.socket = false;
    this.global_emotes_loaded = false;
    this.gif_emotes_loaded = false;

    this.override_emotes = [
      ':\'(',
      'D:'
    ];

    this.registerSelf();
  }

  doSettings() {
    super.doSettings();

    if(ffz.has_bttv) {
      return;
    }

    var _self = this;

    FrankerFaceZ.settings_info.bttv_global_emotes = {
      type: 'boolean',
      value: this.global_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Global Emoticons',
      help: 'Enable this to show global emoticons.',
      on_update: function(enabled) {
        _self.global_emotes = enabled;

        _self.updateGlobalEmotes();
      },
      no_bttv: true
    };

    FrankerFaceZ.settings_info.bttv_gif_emotes = {
      type: 'select',
      value: this.gif_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] GIF Emoticons',
      help: 'Change the mode on how GIF emoticons work.',
      options: {
          0: 'Disabled',
          1: 'Static Images',
          2: 'Animated Images'
      },
      process_value: FrankerFaceZ.utils.process_int(1, 1, 2),
      on_update: function(val) {
        _self.gif_emotes = val;

        _self.updateGlobalEmotes();
        api.iterate_rooms();
      },
      no_bttv: true
    };

    FrankerFaceZ.settings_info.bttv_override_emotes = {
      type: 'boolean',
      value: this.override_emotes_enabled,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Enable Override Emoticons',
      help: 'Enable this to show override emoticons (like D:).',
      on_update: function(enabled) {
        _self.override_emotes_enabled = enabled;

        _self.updateGlobalEmotes();
      },
      no_bttv: true
    };

    FrankerFaceZ.settings_info.bttv_pro_emotes = {
      type: 'boolean',
      value: this.pro_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Enable Pro Emoticons',
      help: 'Enable this to show Pro emoticons from yourself or other users.',
      on_update: function(enabled) {
        _self.pro_emotes = enabled;

        if(enabled) {
          _self.socket.connect();

          for(var i=0; i<_self.channels.length; i++) {
            var channel = _self.channels[i];
            _self.roomAdd(channel);
          }
        }
        else {
          for(var key in _self.ProUsers) {
            _self.ProUsers[key].unload();
          }
          _self.ProUsers = {};

          _self.socket.disconnectInternal();
        }
      },
      no_bttv: true
    };

    FrankerFaceZ.settings_info.bttv_channel_emotes = {
      type: 'boolean',
      value: this.channel_emotes,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Enable Channel Emoticons',
      help: 'Enable this to show per-channel emoticons.',
      on_update: function(enabled) {
        _self.channel_emotes = enabled;

        api.iterate_rooms();
      },
      no_bttv: true
    };

    FrankerFaceZ.settings_info.bttv_show_emotes_in_menu = {
      type: 'boolean',
      value: this.show_emotes_in_menu,
      category: 'FFZ Add-On Pack',
      name: '[BTTV] Show emoticons in Emoticon Menu',
      help: 'Enable this to show the emoticons in the Emoticon Menu (you can still enter the emoticons manually when this is disabled)',
      on_update: function(enabled) {
        _self.show_emotes_in_menu = enabled;

        api.emote_sets['BTTV-Global'].hidden = !enabled;

        for(var name in _self.channels) {
          var channel = _self.channels[name];
          api.emote_sets[channel.set_id].hidden = !enabled;
        }
      },
      no_bttv: true
    };

    this.global_emotes = ffz.settings.get('bttv_global_emotes');
    this.gif_emotes = ffz.settings.get('bttv_gif_emotes');
    this.override_emotes_enabled = ffz.settings.get('bttv_override_emotes');
    this.pro_emotes = ffz.settings.get('bttv_pro_emotes');
    this.channel_emotes = ffz.settings.get('bttv_channel_emotes');
    this.show_emotes_in_menu = ffz.settings.get('bttv_show_emotes_in_menu');
  }

  isEnabled() {
    return super.isEnabled() && !ffz.has_bttv;
  }

  notifyUser() {
    var shown = localStorage.ffz_ap_warning_bttv;
    if(shown !== 'true') {
      localStorage.ffz_ap_warning_bttv = 'true';
      showMessage('You appear to have BTTV installed. FFZ:AP has a BTTV module that handles emotes as well, so BTTV is not necessary. To ensure best compatibility, consider removing BTTV.');
    }
  }

  init() {
    super.init();

    this.debug('Hmm...', this);

    if(!this.isEnabled()) {
      this.log('BTTV was found! Addon disabled!');
      this.notifyUser();
      return;
    }

    this.socket = new BTTV.Socket(this, this.getSocketEvents());
    this.addBadges();
    if(this.global_emotes) {
      this.updateGlobalEmotes();
    }

    if(this.pro_emotes) {
      this.socket.connect();
    }
  }

  roomAdd(roomId) {
    super.roomAdd(roomId);

    if(!this.isEnabled()) {
      return;
    }

    this.updateChannel(roomId);
  }

  roomRemove(roomId) {
    super.roomRemove(roomId);

    if(!this.isEnabled()) {
      return;
    }

    api.unload_set(this.channels[roomId].set_id);
    this.channels[roomId] = null;

    if(this.pro_emotes) {
      this.socket.partChannel(roomId);
    }
  }

  roomMessage(msg) {
    super.roomMessage(msg);

    if(!this.isEnabled()) {
      return;
    }

    if(this.pro_emotes && ffz.get_user() && msg.from === ffz.get_user().login) {
      this.socket.broadcastMe(msg.room);
    }
  }

  bttvInitialized() {
    super.bttvInitialized();

    this.notifyUser();

    if(this.pro_emotes) {
      for(var key in this.ProUsers) {
        this.ProUsers[key].unload();
      }
      this.ProUsers = {};

      this.vars.socket.disconnectInternal();
    }

    this.updateGlobalEmotes();
    api.iterate_rooms();
  }

  isOverrideEmote(emoteCode) {
    this.extDebug('isOverrideEmote', emoteCode);

    return this.override_emotes.indexOf(emoteCode) != -1;
  }

  addBadges(attempts) {
    this.extDebug('addBadges', attempts);

    var _self = this;

    $.getJSON('https://api.betterttv.net/2/badges')
    .done(function(data) {
      var types = [],

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

        types[_type.name] = type;
        api.add_badge(type.name, type);
      }

      i = _users.length;
      while(i--) {
        var _user = _users[i];

        if(types[_user.type]) {
          _self.debug('Adding badge "' + types[_user.type].name + '" for user "' + _user.name + '".');
          api.user_add_badge(_user.name, 21, types[_user.type].name);
        }
      }
    }).fail(function(data) {
      if (data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if (attempts < 12) {
        _self.log('Failed to fetch badges. Trying again in 5 seconds.');
        return setTimeout(_self.addBadges.bind(_self, attempts), 5000);
      }
    });
  }

  updateGlobalEmotes(attempts) {
    this.extDebug('updateGlobalEmotes', attempts);

    var _self = this;

    this.global_emotes_loaded = false;
    api.unregister_global_set('BTTV-Global');

    if(!this.global_emotes) {
      return;
    }

    $.getJSON('https://api.betterttv.net/emotes')
    .done(function(data) {
      var global_bttv = [],
          override_emotes = [],

          _emotes = data.emotes;

      var i = _emotes.length;
      while(i--) {
        var require_spaces = /[^A-Za-z0-9]/.test(_emotes[i].regex);

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
          require_spaces: require_spaces
        };

        if (id) {
          emote.id = id;
          emote.urls = {
            1: 'https://cdn.betterttv.net/emote/' + id + '/1x',
            2: 'https://cdn.betterttv.net/emote/' + id + '/2x',
            4: 'https://cdn.betterttv.net/emote/' + id + '/3x'
          };
        }

        if(_self.isOverrideEmote(_emote.regex)) {
          override_emotes.push(emote);
        }
        else {
          if(_emote.imageType === 'gif') { // If the emote is a GIF
            if(_self.gif_emotes === 0) { // If the GIF setting is set to "Disabled", ignore it.
              continue;
            }
            else if(_self.gif_emotes == 1) { // If the GIF setting is set to "Static", route them through the cache.
              emote.urls[1] = 'https://cache.lordmau5.com/' + emote.urls[1];
              if(id) {
                emote.urls[2] = 'https://cache.lordmau5.com/' + emote.urls[2];
                emote.urls[4] = 'https://cache.lordmau5.com/' + emote.urls[4];
              }
            }
          }

          global_bttv.push(emote);
        }
      }

      var emotes = [];

      if(_self.global_emotes) {
        emotes = emotes.concat(global_bttv);
      }

      if(_self.override_emotes_enabled) {
        emotes = emotes.concat(override_emotes);
      }

      if(emotes.length === 0) {
        return;
      }

      var set = {
        emoticons: emotes,
        title: 'Global Emoticons',
        source: 'BetterTTV',
        icon: 'https://cdn.betterttv.net/tags/developer.png',
        sort: 101
      };
      api.register_global_set('BTTV-Global', set);
      api.emote_sets['BTTV-Global'].hidden = !_self.show_emotes_in_menu;

      _self.global_emotes_loaded = true;
    }).fail(function(data) {
      if(data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if(attempts < 12) {
        _self.log('Failed to fetch global emotes. Trying again in 5 seconds.');
        return setTimeout(_self.updateGlobalEmotes.bind(_self, attempts), 5000);
      }
    });
  }

  updateChannel(roomId, attempts) {
    this.extDebug('updateChannel', [roomId, attempts]);

    var _self = this;

    if(this.pro_emotes) {
      this.socket.joinChannel(roomId);
    }

    if(roomId in this.channels) {
      api.unregister_room_set(roomId, this.channels[roomId].set_id);
    }

    $.getJSON('https://api.betterttv.net/2/channels/' + roomId)
    .done(function(data) {
      var channel_bttv = [],
          emotes = data.emotes;

      var i = emotes.length;
      while(i--) {
      	var require_spaces = /[^A-Za-z0-9]/.test(emotes[i].code);

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
            display_name: _emote.channel || roomId,
            name: _emote.channel
          },
          require_spaces: require_spaces
        };

        if(_emote.imageType === 'gif') {
          switch (_self.gif_emotes) {
            case 0:
              continue;
            case 1:
              emote.urls[1] = 'https://cache.lordmau5.com/' + emote.urls[1];
              emote.urls[2] = 'https://cache.lordmau5.com/' + emote.urls[2];
              emote.urls[4] = 'https://cache.lordmau5.com/' + emote.urls[4];

              channel_bttv.push(emote);
              break;
            case 2:
              channel_bttv.push(emote);
          }
        }
        else {
          channel_bttv.push(emote);
        }
      }

      if(!channel_bttv.length) {
        return;
      }

      _self.channels[roomId] = {
        set_id: 'BTTV-Channel-' + roomId
      };

      var set = {
        emoticons: channel_bttv,
        title: 'Channel Emoticons',
        source: 'BetterTTV',
        icon: 'https://cdn.betterttv.net/tags/developer.png'
      };

      if(channel_bttv.length && _self.channel_emotes) {
        api.register_room_set(roomId, _self.channels[roomId].set_id, set); // Load normal emotes
        api.emote_sets[_self.channels[roomId].set_id].hidden = !_self.show_emotes_in_menu;
      }
    }).fail(function(data) {
      if (data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if (attempts < 12) {
        _self.log('Failed to fetch channel emotes. Trying again in 5 seconds.');
        return setTimeout(_self.updateChannel.bind(_self, roomId, attempts), 5000);
      }
    });
  }

  getSocketEvents() {
    this.extDebug('getSocketEvents');

    var _self = this;

    return {
      lookup_user: function(subscription) {
        if (!subscription.pro || !_self.pro_emotes) {
          return;
        }

        if (subscription.pro && subscription.emotes) {
          if(subscription.name in _self.pro_users) {
            _self.pro_users[subscription.name].emotes_array = subscription.emotes;
            _self.pro_users[subscription.name].loadEmotes();
          }
          else {
            _self.pro_users[subscription.name] = new BTTV.ProUser(_self, subscription.name, subscription.emotes);
          }
        }
      }
    };
  }
}

BTTV.ProUser = class {
  constructor(_bttv, username, emotes_array) {
    this._bttv = _bttv;

    this.username = username;
    this.emotes_array = emotes_array;

    this.initialize();
  }

  initialize() {
    this._id_emotes = 'BTTV-ProUser-' + this.username;

    this.loadEmotes();
  }

  loadEmotes() {
    this.emotes = [];

    for(var i=0; i<this.emotes_array.length; i++) {
      var _emote = this.emotes_array[i];
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

      if(_emote.imageType === 'gif') {
        if(this._bttv.gif_emotes === 0) { // If the GIF setting is set to "Disabled", ignore it.
          continue;
        }
        else if(this._bttv.gif_emotes == 1) { // If the GIF setting is set to "Static", route them through the cache.
          emote.urls[1] = 'https://cache.lordmau5.com/' + emote.urls[1];
          emote.urls[2] = 'https://cache.lordmau5.com/' + emote.urls[2];
          emote.urls[4] = 'https://cache.lordmau5.com/' + emote.urls[4];
        }
      }
      this.emotes.push(emote);
    }

    var set = {
      emoticons: this.emotes,
      title: 'Personal Emoticons',
      source: 'BetterTTV',
      icon: 'https://cdn.betterttv.net/tags/developer.png'
    };

    if(this.emotes.length) {
      api.load_set(this._id_emotes, set);
      api.user_add_set(this.username, this._id_emotes);
    }
    else {
      api.unload_set(this._id_emotes);
    }
  }

  unload() {
    this._bttv.debug('Unloading user! (User: ' + this.username + ')');

    api.unload_set(this._id_emotes);
  }
};

BTTV.Socket = class {
  constructor(_bttv, events) {
    this._bttv = _bttv;

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

    this._bttv.log('Socket: Connecting to socket server...');

    var _self = this;
    this.socket = new WebSocket('wss://sockets.betterttv.net/ws');

    this.socket.onopen = function() {
      _self._bttv.log('Socket: Connected to socket server.');

      _self._connected = true;
      _self._connect_attempts = 1;

      if(_self._connection_buffer.length > 0) {
        var i = _self._connection_buffer.length;
        while(i--) {
          var channel = _self._connection_buffer[i];
          _self.joinChannel(channel);
          _self.broadcastMe(channel);
        }
        _self._connection_buffer = [];
      }

      if(_self.reconnecting) {
        _self.reconnecting = false;
        api.iterate_rooms();
      }
    };

    this.socket.onerror = function() {
      _self._bttv.log('Socket: Error from socket server.');

      _self._connect_attempts++;
      _self.reconnect();
    };

    this.socket.onclose = function() {
      if(!_self._connected || !_self.socket) {
        return;
      }

      _self._bttv.log('Socket: Lost connection to socket server...');

      _self._connect_attempts++;
      _self.reconnect();
    };

    this.socket.onmessage = function(message) {
      var evt;

      try {
        evt = JSON.parse(message.data);
      }
      catch(e) {
        _self._bttv.debug('Socket: Error parsing message', e);
      }

      if(!evt || !(evt.name in _self._events)) {
        return;
      }

      _self._bttv.debug('Socket: Received event', evt);

      _self._events[evt.name](evt.data);
    };
  }

  reconnect() {
    var _self = this;

    this.disconnect();

    if(this._connecting === false) {
      return;
    }
    this._connecting = false;

    this._bttv.log('Socket: Trying to reconnect to socket server...');

    setTimeout(function() {
      _self.reconnecting = true;
      _self.connect();
    }, Math.random() * (Math.pow(2, this._connect_attempts) - 1) * 10000);
  }

  disconnect() {
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

    this._bttv.log('Socket: Disconnected from socket server.');
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

  broadcastMe(channel) {
    if(!this._connected) {
      return;
    }
    if(!ffz.get_user()) {
      return;
    }

    this.emit('broadcast_me', {
      name: ffz.get_user().login,
      channel: channel
    });
  }

  joinChannel(channel) {
    if(!this._connected) {
      if(!this._connection_buffer.includes(channel)) {
        this._connection_buffer.push(channel);
      }
      return;
    }

    if(!channel.length) {
      return;
    }

    if(this._joined_channels[channel]) {
      this.partChannel(channel);
    }

    this.emit('join_channel', {
      name: channel
    });
    this._joined_channels[channel] = true;
  }

  partChannel(channel) {
    if(!this._connected) {
      return;
    }
    if(!channel.length) {
      return;
    }

    if(this._joined_channels[channel]) {
      this.emit('part_channel', {
        name: channel
      });
    }
    this._joined_channels[channel] = false;
  }
};

new BTTV();
