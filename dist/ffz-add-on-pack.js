var addons = [],
    ffz,
    api,

    socket,

    version = "1.0.1";

var registerAddon = function(addon) {
  if(isInvalidHost()) {
    return;
  }

  if(addons.includes(addon)) {
    console.log("Not registering duplicate addon!");
  }
  else {
    addons.push(addon);
    console.log("[FFZ:AP] Registered addon: " + addon.name + " on " + window.location.hostname);
  }
};

var doSettings = function() {
  addons.forEach(function(addon) {
    addon.doSettings();
  });
};

var init = function() {
  addons.forEach(function(addon) {
    addon.init();
  });
};

var room_add = function(room_id, reg_function, attempts) {
  addons.forEach(function(addon) {
    addon.room_add(room_id, reg_function, attempts);
  });
};

var room_message = function(msg) {
  addons.forEach(function(addon) {
    addon.room_message(msg);
  });
};

var chat_view_init = function(dom, ember) {
  addons.forEach(function(addon) {
    addon.chat_view_init(dom, ember);
  });
};

var chat_view_destroy = function(dom, ember) {
  addons.forEach(function(addon) {
    addon.chat_view_destroy(dom, ember);
  });
};

/* ----- */

var invalidHosts = ["api.", "tmi.", "spade.", "chatdepot.", "im."];
var isInvalidHost = function() {
  for(var i=0; i<invalidHosts.length; i++) {
    if(window.location.host.indexOf(invalidHosts[i]) != -1) {
      return true;
    }
  }
  return false;
};

var checkExistance = function(attempts) {
  if(isInvalidHost()) {
    return;
  }

  if(window.FrankerFaceZ !== undefined && window.jQuery !== undefined && window.App !== undefined) {

    // Register with FFZ.
    ffz = FrankerFaceZ.get();

    api = ffz.api("FFZ Add-On Pack", "https://cdn.lordmau5.com/Mau5Badge_Alpha.png", version, "ffz-ap");

    /* Debug toggle */

    FrankerFaceZ.settings_info.ffz_ap_debug_mode = {
      type: "boolean",
      value: false,
      category: "FFZ Add-On Pack",
      name: "Enable debug mode",
      help: "Will try to load the script from a local server hosted on port 3000.",
      on_update: function(enabled) {
        localStorage.ffz_ap_debug_mode = enabled;
      }
    };

    /* ------------ */

    socket = new WebSocket("ws://localhost:3001/");
    socket.onmessage = function(message) {
      api.log("Connections: " + message.data);
    };

    // Check for BTTV
    if(ffz.has_bttv) {
      api.log("BTTV was found. To ensure best possible compatibility, consider removing BTTV.");
    }

    api.add_badge("developer", {
      name: "developer",
      title: "FFZ:AP Developer",
      image: "https://cdn.lordmau5.com/Mau5Badge.png",
      alpha_image: "https://cdn.lordmau5.com/Mau5Badge_Alpha.png",
      color: "#49acff"
    });
    api.user_add_badge("lordmau5", 20, "developer");
    api.user_add_badge("quantoqt", 20, "developer");

    api.log("Injected successfully.");

    doSettings();
    init();

    api.on("room-add", room_add);
    api.on("room-message", room_message);
    api.on("chat-view-init", chat_view_init);
    api.on("chat-view-destroy", chat_view_destroy);

    api.iterate_rooms();
    api.iterate_chat_views();
  }
  else {
    attempts = (attempts || 0) + 1;
    if(attempts < 60) {
      return setTimeout(checkExistance.bind(this, attempts), 1000);
    }

    console.log("[FFZ:AP] Could not find FFZ. Injection unsuccessful. (Host: " + window.location.host + ")");
  }
};

// Finally intiialize ourselves!
setTimeout(checkExistance, 3000);

/* --------------- */

var BTTV = {
  name: "BetterTTV",
  log: function(string) {
    api.log("[" + BTTV.name + "] " + string);
  },
  vars: {
    global_emotes: true,
    gif_emotes: false,
    override_emotes: false,
    pro_emotes: true,
    show_emotes_in_menu: true,
    channels: {},
    last_emote_set_id: 0,

    socket: false,
    global_emotes_loaded: false,
    gif_emotes_loaded: false
  },
  doSettings: function() {
    FrankerFaceZ.settings_info.bttv_global_emotes = {
      type: "boolean",
      value: BTTV.vars.global_emotes,
      category: "FFZ Add-On Pack",
      name: "[BTTV] Global Emoticons",
      help: "Enable this to show global emotes.",
      on_update: function(enabled) {
        if (!BTTV.vars.global_emotes_loaded) {
          if (enabled) {
            BTTV.addGlobals();
          }
          return;
        }

        if (enabled) {
          api.register_global_set("BTTV-Global-" + 1);

          if(BTTV.vars.gif_emotes) {
            api.register_global_set("BTTV-Global-" + 2);
          }

          if(BTTV.vars.override_emotes) {
            api.register_global_set("BTTV-Global-" + 3);
          }
        }
        else {
          api.unregister_global_set("BTTV-Global-" + 1);
          api.unregister_global_set("BTTV-Global-" + 2);
          api.unregister_global_set("BTTV-Global-" + 3);
        }

        BTTV.vars.global_emotes = enabled;
      }
    };

    FrankerFaceZ.settings_info.bttv_gif_emotes = {
      type: "boolean",
      value: BTTV.vars.gif_emotes,
      category: "FFZ Add-On Pack",
      name: "[BTTV] GIF Emoticons",
      help: "Enable this to show GIF emotes.",
      on_update: function(enabled) {
        var i, name;
        if (enabled) {
          if(BTTV.vars.global_emotes) {
            api.register_global_set("BTTV-Global-" + 2);
          }

          i = BTTV.vars.channels.length;
          while(i--) {
            name = BTTV.vars.channels[i];
            api.register_room_set(name, BTTV.vars.channels[name].gifemotes_setid, BTTV.vars.channels[name].gifemotes);
          }
        }
        else {
          api.unregister_global_set("BTTV-Global-" + 2);

          i = BTTV.vars.channels.length;
          while(i--) {
            name = BTTV.vars.channels[i];
            if(BTTV.vars.channels[name].gifemotes_still) {
              api.register_room_set(name, BTTV.vars.channels[name].gifemotes_setid, BTTV.vars.channels[name].gifemotes_still);
            }
            else {
              api.unload_set(BTTV.vars.channels[name].gifemotes_setid);
            }
          }
        }

        BTTV.vars.gif_emotes = enabled;
      }
    };

    FrankerFaceZ.settings_info.bttv_override_emotes = {
      type: "boolean",
      value: BTTV.vars.override_emotes,
      category: "FFZ Add-On Pack",
      name: "[BTTV] Enable Override Emotes",
      help: "Enable this to show override emotes (like D:).",
      on_update: function(enabled) {
        if(enabled) {
          if(BTTV.vars.global_emotes) {
            api.register_global_set("BTTV-Global-" + 3);
          }
        }
        else {
          api.unregister_global_set("BTTV-Global-" + 3);
        }

        BTTV.vars.override_emotes = enabled;
      }
    };

    FrankerFaceZ.settings_info.bttv_pro_emotes = {
      type: "boolean",
      value: BTTV.vars.pro_emotes,
      category: "FFZ Add-On Pack",
      name: "[BTTV] Enable Pro Emotes",
      help: "Enable this to show Pro emotes from other users. (Requires refresh!)",
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
      type: "boolean",
      value: BTTV.vars.show_emotes_in_menu,
      category: "FFZ Add-On Pack",
      name: "[BTTV] Show emotes in Emoticon Menu",
      help: "Enable this to show the emotes in the Emoticon Menu (you can still enter the emotes manually when this is disabled)",
      on_update: function(enabled) {
        api.emote_sets["BTTV-Global-" + 1].hidden = !enabled;
        api.emote_sets["BTTV-Global-" + 2].hidden = !enabled;
        api.emote_sets["BTTV-Global-" + 3].hidden = !enabled;

        for(var name in BTTV.vars.channels) {
          api.emote_sets[BTTV.vars.channels[name].emotes].hidden = !enabled;
          api.emote_sets[BTTV.vars.channels[name].gifemotes_setid].hidden = !enabled;
        }
      }
    };


    BTTV.vars.global_emotes = ffz.settings.get("bttv_global_emotes");
    BTTV.vars.gif_emotes = ffz.settings.get("bttv_gif_emotes");
    BTTV.vars.override_emotes = ffz.settings.get("bttv_override_emotes");
    BTTV.vars.pro_emotes = ffz.settings.get("bttv_pro_emotes");
    BTTV.vars.show_emotes_in_menu = ffz.settings.get("bttv_show_emotes_in_menu");
  },
  init: function() {
    BTTV.log("Addon initialized!");

    if(ffz.has_bttv) {
      BTTV.log("BTTV was found! Addon disabled!");
      return;
    }

    BTTV.vars.socket = new BTTV.Socket();
    BTTV.addBadges();
    if(BTTV.vars.global_emotes) {
      BTTV.addGlobals();
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
    $.getJSON("https://api.betterttv.net/2/badges")
    .done(function(data) {
      var types = [],
          badges = [],

          _types = data.types,
          _users = data.badges;

      var i = _types.length;
      while(i--) {
        var _type = _types[i];

        var type = {
          name: "bttv-" + _type.name,
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
          BTTV.log("Adding badge '" + _user.type + "' for user '" + _user.name + "'.");
          api.user_add_badge(_user.name, 21, _user.type);
        }
      }
    }).fail(function(data) {
      if (data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if (attempts < 12) {
        BTTV.log("Failed to fetch badges. Trying again in 5 seconds.");
        return setTimeout(BTTV.addBadges.bind(this, attempts), 5000);
      }
    });
  },

  override_emotes: [ ":'(", "D:" ],
  isOverrideEmote: function(emote_regex) {
    for(var i = 0; i < BTTV.override_emotes.length; i++) {
      if(emote_regex === BTTV.override_emotes[i]) {
        return true;
      }
    }
    return false;
  },

  addGlobals: function(attempts) {
    $.getJSON("https://api.betterttv.net/emotes")
    .done(function(data) {
      var globalBTTV = [],
          globalBTTV_GIF = [],
          overrideEmotes = [],

          emotes = data.emotes;

      var i = emotes.length;
      while(i--) {
        var req_spaces = /[^A-Za-z0-9]/.test(emotes[i].regex);

        var _emote = emotes[i],
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
            1: "https://cdn.betterttv.net/emote/" + id + "/1x",
            2: "https://cdn.betterttv.net/emote/" + id + "/2x",
            4: "https://cdn.betterttv.net/emote/" + id + "/3x"
          };
        }

        // Hat emote check
        // if (hatEmotes.indexOf(emote.regex) != -1) {
        //   emote.margins = "0px 0px 8px 0px";
        //   emote.modifier = true;
        // }

        if(BTTV.isOverrideEmote(_emote.regex)) {
          overrideEmotes.push(emote);
        }
        else {
          if(_emote.imageType === "gif") {
            globalBTTV_GIF.push(emote);
          }
          else {
            globalBTTV.push(emote);
          }
        }
      }

      var set = {
        emoticons: globalBTTV
      };
      api.register_global_set("BTTV-Global-" + 1, set);

      if(!BTTV.vars.global_emotes) {
        api.unregister_global_set("BTTV-Global-" + 1);
      }
      api.emote_sets["BTTV-Global-" + 1].hidden = !BTTV.vars.show_emotes_in_menu;

      set = {
        emoticons: globalBTTV_GIF,
        title: "Global Emoticons (GIF)"
      };
      api.register_global_set("BTTV-Global-" + 2, set);

      if(!BTTV.vars.global_emotes || !BTTV.vars.gif_emotes) {
        api.unregister_global_set("BTTV-Global-" + 2);
      }
      api.emote_sets["BTTV-Global-" + 2].hidden = !BTTV.vars.show_emotes_in_menu;

      set = {
          emoticons: overrideEmotes,
          title: "Global Emoticons (Override)"
      };
      api.register_global_set("BTTV-Global-" + 3, set);

      if(!BTTV.vars.global_emotes || !BTTV.vars.override_emotes) {
        api.unregister_global_set("BTTV-Global-" + 3);
      }
      api.emote_sets["BTTV-Global-" + 3].hidden = !BTTV.vars.show_emotes_in_menu;

      BTTV.vars.global_emotes_loaded = true;
    }).fail(function(data) {
      if(data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if(attempts < 12) {
        BTTV.log("Failed to fetch global emotes. Trying again in 5 seconds.");
        return setTimeout(BTTV.addGlobals.bind(this, attempts), 5000);
      }
    });
  },

  addChannel: function(room_id, reg_function, attempts) {
    if(BTTV.vars.pro_emotes) {
      BTTV.vars.socket.joinChannel(room_id);
    }

    $.getJSON("https://api.betterttv.net/2/channels/" + room_id)
    .done(function(data) {
      var channelBTTV = [],
          channelBTTV_GIF = [],
          emotes = data.emotes;

      var i = emotes.length;
      while(i--) {
      	var req_spaces = /[^A-Za-z0-9]/.test(emotes[i].code);

        var _emote = emotes[i],
            id = _emote.id,

        emote = {
          urls: {
            1: "https://cdn.betterttv.net/emote/" + id + "/1x",
            2: "https://cdn.betterttv.net/emote/" + id + "/2x",
            4: "https://cdn.betterttv.net/emote/" + id + "/3x"
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

        if(_emote.imageType === "gif") {
          channelBTTV_GIF.push(emote);
        }
        else {
          channelBTTV.push(emote);
        }
      }

      if(!channelBTTV.length && !channelBTTV_GIF.length) {
        return;
      }

      BTTV.vars.channels[room_id] = {
        emotes: "BTTV-Channel-" + (BTTV.vars.last_emote_set_id),
        gifemotes_setid: "BTTV-Channel-" + (BTTV.vars.last_emote_set_id + 1)
      };
      BTTV.vars.last_emote_set_id += 2;

      var set = {
        emoticons: channelBTTV,
        title: "Emoticons"
      };

      if(channelBTTV.length) {
        api.register_room_set(room_id, BTTV.vars.channels[room_id].emotes, set); // Load normal emotes
        api.emote_sets[BTTV.vars.channels[room_id].emotes].hidden = !BTTV.vars.show_emotes_in_menu;
      }

      set = {
        emoticons: channelBTTV_GIF,
        title: "Emoticons (GIF)"
      };

      BTTV.vars.channels[room_id].gifemotes = jQuery.extend(true, {}, set);
      var tempStillEmotes = jQuery.extend(true, {}, set);

      var stillEmotes = tempStillEmotes.emoticons;

      var stillEmotes_OnLoad = function(array_index, size) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");

        canvas.width = this.width;
        canvas.height = this.height;

        ctx.drawImage(this, 0, 0);

        if(!BTTV.vars.channels[room_id].gifemotes_still) {
          BTTV.vars.channels[room_id].gifemotes_still = tempStillEmotes;
        }

        stillEmotes[array_index].urls[size] = canvas.toDataURL();

        api.register_room_set(room_id, BTTV.vars.channels[room_id].gifemotes_setid, BTTV.vars.channels[room_id].gifemotes_still); // Load static GIF emotes
        api.emote_sets[BTTV.vars.channels[room_id].gifemotes_setid].hidden = !BTTV.vars.show_emotes_in_menu;
      };

      var stillEmotes_OnError = function(errorMsg, url, lineNumber, column, errorObj) {
        console.log("Couldn't load.");
      };

      i = stillEmotes.length;
      while(i--) {
        var element = stillEmotes[i];
        var j = element.urls.length;
        while(j--) {
          var key = element.urls[i];
          var img = new Image();

          img.onload = stillEmotes_OnLoad.bind(img, i, key);
          img.onerror = stillEmotes_OnError;
          img.crossOrigin = "anonymous";
          img.src = element.urls[key] + ".png";
        }
      }

      api.register_room_set(room_id, BTTV.vars.channels[room_id].gifemotes_setid, set); // Load GIF emotes
      api.emote_sets[BTTV.vars.channels[room_id].gifemotes_setid].hidden = !BTTV.vars.show_emotes_in_menu;

      if(!BTTV.vars.gif_emotes) {
        api.unload_set(BTTV.vars.channels[room_id].gifemotes_setid);
      }
    }).fail(function(data) {
      if (data.status === 404) {
        return;
      }

      attempts = (attempts || 0) + 1;
      if (attempts < 12) {
        BTTV.log("Failed to fetch channel emotes. Trying again in 5 seconds.");
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
        1: "https://cdn.betterttv.net/emote/" + _emote.id + "/1x",
        2: "https://cdn.betterttv.net/emote/" + _emote.id + "/2x",
        4: "https://cdn.betterttv.net/emote/" + _emote.id + "/3x"
      },
      id: _emote.id,
      name: _emote.code,
      width: 28,
      height: 28,
      owner: {
        display_name: _emote.channel || "",
        name: _emote.channel || ""
      },
      require_spaces: true
    };

    if(_emote.imageType === "png") {
      this.emotes.push(emote);
    }
  }, this);

  var set = {
    emoticons: this.emotes,
    title: "Personal Emotes"
  };

  if(this.emotes.length) {
    api.load_set(this._id_emotes, set);
    api.user_add_set(this.username, this._id_emotes);
  }
};

BTTV.ProUser.prototype.initialize = function() {
  this._id_emotes = "BTTV-ProUser-" + this.username;

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

  BTTV.log("Socket: Connecting to socket server...");

  var _self = this;
  this.socket = new WebSocket('wss://sockets.betterttv.net/ws');

  this.socket.onopen = function() {
    BTTV.log("Socket: Connected to socket server.");

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
    BTTV.log("Socket: Error from socket server.");

    _self._connectAttempts++;
    _self.reconnect();
  };

  this.socket.onclose = function() {
    if (!_self._connected || !_self.socket) {
      return;
    }

    BTTV.log("Socket: Disconnected from socket server.");

    _self._connectAttempts++;
    _self.reconnect();
  };

  this.socket.onmessage = function(message) {
    var evt;

    try {
      evt = JSON.parse(message.data);
    }
    catch (e) {
      BTTV.log("Socket: Error parsing message", e);
    }

    if (!evt || !(evt.name in _self._events)) {
      return;
    }

    BTTV.log("Socket: Received event", evt);

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

/* --------------- */

var GameWisp = {
  name: "GameWisp",
  log: function(string) {
    api.log("[" + GameWisp.name + "] " + string);
  },
  init: function() {
    console.log("[GameWisp] Addon initialized!");
  },
  doSettings: function() {

  },
  room_message: function(msg) {

  },
  room_add: function(room_id, reg_function, attempts) {

  },
  chat_view_init: function(dom, ember) {
    // Unused
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  }
};

registerAddon(GameWisp);

/* --------------- */

var MaiWaifu = {
  name: "MaiWaifu",
  log: function(string) {
    api.log("[" + MaiWaifu.name + "] " + string);
  },
  vars: {
    enabled: true,
    trihex_only: false,
    use_click: false,

    hover_timeout: false,
    socket: false,
    currentWaifu: false,
    pane: false,
    boundingBox: false,
    currentSlide: 0,
    mouseMovement: 0
  },
  doSettings: function() {
    FrankerFaceZ.settings_info.maiwaifu_enabled = {
      type: "boolean",
      value: MaiWaifu.vars.enabled,
      category: "FFZ Add-On Pack",
      name: "[MaiWaifu] Enabled",
      help: "Enable this to activate MaiWaifu.",
      on_update: function(enabled) {
        MaiWaifu.vars.enabled = enabled;
      }
    };

    FrankerFaceZ.settings_info.maiwaifu_trihex_only = {
      type: "boolean",
      value: MaiWaifu.vars.trihex_only,
      category: "FFZ Add-On Pack",
      name: "[MaiWaifu] Trihex only",
      help: "Enable this to only make the MaiWaifu badges available on Trihex' stream.",
      on_update: function(enabled) {
        MaiWaifu.vars.trihex_only = enabled;
      }
    };

    FrankerFaceZ.settings_info.maiwaifu_use_click = {
      type: "boolean",
      value: MaiWaifu.vars.use_click,
      category: "FFZ Add-On Pack",
      name: "[MaiWaifu] Click instead of Hover",
      help: "Enable this for having to click on the badge instead of hovering over it.",
      on_update: function(enabled) {
        MaiWaifu.vars.use_click = enabled;
      }
    };

    MaiWaifu.vars.enabled = ffz.settings.get("maiwaifu_enabled");
    MaiWaifu.vars.trihex_only = ffz.settings.get("maiwaifu_trihex_only");
    MaiWaifu.vars.use_click = ffz.settings.get("maiwaifu_use_click");
  },
  init: function() {
    console.log("[MaiWaifu] Addon initialized!");

    MaiWaifu.vars.socket = new MaiWaifu.Socket();
    if(MaiWaifu.vars.enabled) {
      MaiWaifu.vars.socket.connect(MaiWaifu.createWaifuPane());
    }

    api.add_badge("maiwaifu", {
      name: "maiwaifu",
      title: "MaiWaifu",
      image: "https://mywaif.us/waifu-badge.png",
      no_invert: true,
      no_tooltip: true,
      click_action: MaiWaifu.on_badge_click
    });
  },
  room_add: function(room_id, reg_function, attempts) {
    // Unused
  },
  room_message: function(msg) {
    // Unused
  },

  chat_view_init: function(dom, ember) {
    jQuery(dom).on("mouseenter", ".ffz-badge-ffz-ap-maiwaifu", MaiWaifu.on_badge_hover).on("mouseleave", ".ffz-badge-ffz-ap-maiwaifu", MaiWaifu.on_badge_hover_end);
    jQuery(document).on("mousemove", MaiWaifu.mouseMovement);
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  },

  createWaifuPane: function() {
    // MaiWaifu.vars.currentWaifu = new Waifu();
    MaiWaifu.vars.pane = document.createElement("div");
    MaiWaifu.vars.pane.className = "waifuPane";
    MaiWaifu.vars.pane.style.display = "none";
    MaiWaifu.vars.pane.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    MaiWaifu.vars.pane.style.position = "absolute";
    MaiWaifu.vars.pane.style.zIndex = "9999";
    MaiWaifu.vars.pane.style.color = "#FFF";
    MaiWaifu.vars.pane.style.width = "240px";
    MaiWaifu.vars.pane.style.padding = "20px";

    MaiWaifu.vars.boundingBox = document.createElement("div");
    MaiWaifu.vars.boundingBox.style.marginLeft = "40px";
    MaiWaifu.vars.boundingBox.style.position = "absolute";
    MaiWaifu.vars.boundingBox.style.paddingLeft = "10px";
    MaiWaifu.vars.boundingBox.style.top = "0px";

    document.body.appendChild(MaiWaifu.vars.boundingBox);
    MaiWaifu.vars.boundingBox.appendChild(MaiWaifu.vars.pane);
  },

  mouseMovement: function(event) {
    if(!MaiWaifu.vars.currentWaifu) {
      return;
    }

    if(event.target.className.indexOf("waifu") != -1) {
      MaiWaifu.vars.mouseMovement = 0;
    }
    else {
      MaiWaifu.vars.mouseMovement += 1;
      if(MaiWaifu.vars.mouseMovement >= 50) {
        MaiWaifu.fadeOutWaifu();
      }
    }
  },

  openWaifuPane: function(username) {
    MaiWaifu.requestWaifu(username, function(){
      MaiWaifu.vars.pane.topCoord = 100; //e.clientY;
    });

    MaiWaifu.vars.mouseMovement = 0;
  },

  updateWaifuPane: function(callback) {
    // var chat = document.getElementsByClassName("chat-room")[0];
    // var chatRect = chat.getBoundingClientRect();
    MaiWaifu.fadeInWaifu();
    MaiWaifu.vars.currentSlide = 1;
    clearInterval(MaiWaifu.vars.pane.slideshow);
    MaiWaifu.vars.pane.innerHTML = "";
    MaiWaifu.vars.boundingBox.style.left = "500px"; //chatRect.left + "px";
    MaiWaifu.vars.boundingBox.style.width = "300px"; //chat.offsetWidth - 40 + "px";

    //Waifu Header
    var header = document.createElement('div');
    header.className = "waifuHeader";
    header.textContent = MaiWaifu.vars.currentWaifu.user.capitalize() + "'s "+ MaiWaifu.vars.currentWaifu.gender.capitalize() +": ";
    header.style.marginBottom = "5px";

    var waifuName = document.createElement('div');
    waifuName.className = "waifuName";
    waifuName.textContent = MaiWaifu.vars.currentWaifu.waifu;
    waifuName.style.marginBottom = "10px";
    waifuName.style.fontWeight = "bolder";

    //Images

    //Preload Images
    for(var i=0; i<MaiWaifu.vars.currentWaifu.images.length; i++) {
      var preloadedImage = new Image();
      preloadedImage.src = MaiWaifu.vars.currentWaifu.images[i];
    }

    var pic = document.createElement('div');
    pic.className = "waifuPic";
    pic.style.width = "200px";
    pic.style.height = "200px";
    pic.style.backgroundSize="contain";
    pic.style.marginBottom = "10px";
    pic.style.transition = "ease 2s";
    pic.style.transitionDelay = "200ms";

    var image = MaiWaifu.vars.currentWaifu.images[0].match(/imgur\.com\/([A-Za-z0-9\.]+)/)[1];
    pic.style.backgroundImage = "url(https://miku.mywaif.us/imgur/?" + image + ")";
    pic.style.backgroundRepeat = "no-repeat";
    pic.style.backgroundPosition = "center center";

    MaiWaifu.vars.pane.slideshow = setInterval(function() {
      if(!MaiWaifu.vars.currentWaifu) {
        clearInterval(MaiWaifu.vars.pane.slideshow);
        return;
      }

      if(MaiWaifu.vars.currentSlide < MaiWaifu.vars.currentWaifu.images.length) {
        image = MaiWaifu.vars.currentWaifu.images[MaiWaifu.vars.currentSlide].match(/imgur\.com\/([A-Za-z0-9\.]+)/)[1];//dem greedz
        pic.style.backgroundImage = "url(https://miku.mywaif.us/imgur/?" + image + ")";
        MaiWaifu.vars.currentSlide++;
      }
      else {
        MaiWaifu.vars.currentSlide = 0;
      }
    },5000);

    //Waifu Status
    var stats = document.createElement('div');
    stats.className = "waifuStats";

    var line = document.createElement('br');
    line.className = "waifuSpace";
    //line.style.paddingTop = "10px";

    var seriesTitle = document.createElement('div');
    seriesTitle.className = "waifuSeries";
    seriesTitle.innerHTML = "Series:";
    seriesTitle.style.fontWeight = "bold";
    seriesTitle.style.float = "left";
    seriesTitle.style.paddingRight = "5px";

    var series = document.createElement('div');
    series.className = "waifuSeries";
    series.textContent = MaiWaifu.vars.currentWaifu.series;

    var typeTitle = document.createElement('div');
    typeTitle.className = "waifuType";
    typeTitle.innerHTML = "Type:";
    typeTitle.style.fontWeight = "bold";
    typeTitle.style.float = "left";
    typeTitle.style.paddingRight = "5px";

    var type = document.createElement('div');
    type.textContent = MaiWaifu.vars.currentWaifu.type;
    type.className = "waifuType";

    //Summary
    var summary = document.createElement('div');
    summary.className = "waifuSummary";
    summary.textContent = MaiWaifu.vars.currentWaifu.summary;
    summary.style.position = "relative";

    //Append everything to stats
    stats.appendChild(line);
    stats.appendChild(seriesTitle);
    stats.appendChild(series);
    stats.appendChild(typeTitle);
    stats.appendChild(type);
    stats.appendChild(line);
    stats.appendChild(summary);

    if(MaiWaifu.vars.currentWaifu.subbedSince) {
      var subLine = document.createElement('br');
      subLine.className = "waifuSpace";
      //subLine.style.paddingTop = "10px";
      stats.appendChild(subLine);

      var subbedSince = document.createElement('div');
      subbedSince.className = "waifuSubbedSince";
      subbedSince.innerHTML = "Subbed for " + MaiWaifu.vars.currentWaifu.subbedSince + " months.";
      stats.appendChild(subbedSince);
    }

    MaiWaifu.vars.pane.appendChild(header);
    MaiWaifu.vars.pane.appendChild(waifuName);
    MaiWaifu.vars.pane.appendChild(pic);
    MaiWaifu.vars.pane.appendChild(stats);

    if(!ffz.get_user() || ffz.get_user() && ffz.get_user().login !== MaiWaifu.vars.currentWaifu.user) {
      var reportContainer = document.createElement('div');
      reportContainer.className = "waifu ReportContainer";
      reportContainer.style.cssFloat = "right";

      var reportButton = document.createElement('a');
      reportButton.className = "waifu ReportButton";
      reportButton.title = "Report Meme or Nudity";

      var reportText = document.createTextNode("Report");
      reportButton.appendChild(reportText);
      reportButton.onclick = function() {
        MaiWaifu.reportUser(MaiWaifu.vars.currentWaifu.user, reportButton, reportText);
      };

      reportContainer.appendChild(reportButton);
      MaiWaifu.vars.pane.appendChild(reportContainer);
    }

    callback();
  },

  getRequest: function(url, callback) {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(xmlHttp.responseText);
        }
      };
      xmlHttp.open("GET", url, true);
      xmlHttp.send(null);
  },

  requestWaifu: function(user, callback) {
    MaiWaifu.vars.socket.requestWaifu(user, callback);
  },

  reportUser: function(username, reportButton, reportText) {
    MaiWaifu.getRequest("https://miku.mywaif.us:8055/report/" + username, function(){});
    reportText.nodeValue = "Reported";
    reportButton.style.textDecoration = "none";
  },

  fadeOutWaifu: function() {
    var op = 1;
    var timer = setInterval(function () {
      if (op <= 0.1){
        clearInterval(timer);
        MaiWaifu.vars.pane.style.display = "none";
        MaiWaifu.vars.currentWaifu = false;
      }
      MaiWaifu.vars.pane.style.opacity = op;
      MaiWaifu.vars.pane.style.filter = "alpha(opacity=" + op * 100 + ")";
      op -= op * 0.1;
    }, 10);
  },

  fadeInWaifu: function() {
    var op = 0.1;
    MaiWaifu.vars.pane.style.display = "block";
    var timer = setInterval(function () {
      if (op >= 1){
        clearInterval(timer);
      }
      MaiWaifu.vars.pane.style.opacity = op;
      MaiWaifu.vars.pane.style.filter = "alpha(opacity=" + op * 100 + ")";
      op += op * 0.1;
    }, 10);
  },

  on_badge_hover: function() {
    if(MaiWaifu.vars.use_click) {
      return;
    }

    var username = jQuery(this).parents(".chat-line")[0].getAttribute("data-sender");

    MaiWaifu.vars.hover_timeout = setTimeout(function() {
      MaiWaifu.openWaifuPane(username);
    }, 250);
  },

  on_badge_hover_end: function() {
    clearTimeout(MaiWaifu.vars.hover_timeout);
  },

  on_badge_click: function(msg, e) {
    if(!MaiWaifu.vars.use_click) {
      return;
    }

    MaiWaifu.openWaifuPane(msg.from);
  },

  Waifu: function(user, waifu, series, images, lewd, gender, type, summary, subbedSince) {
    this.user = user;
    this.waifu = waifu;
    this.series = series;
    this.images = images;
    this.lewd = lewd;
    this.gender = gender;
    this.type = type;
    this.summary = summary;
    this.subbedSince = subbedSince;
  },
  Waifus: [],

  Socket: function() {
    MaiWaifu.waifuPane = false;
    MaiWaifu.socket = false;
    MaiWaifu.Waifus = [];
  }
};

/* Prototyping */

MaiWaifu.Socket.prototype.connect = function(waifuPane) {
  if(!MaiWaifu.vars.enabled) {
    return;
  }

  this.socket = new WebSocket("wss://miku.mywaif.us:8081");
  this.socket.waifuList = MaiWaifu.Waifus.waifuList;
  // MaiWaifu.vars.waifuPane = waifuPane;

  this.socket.onopen = function (event) {
    // Unused
  };
  this.socket.onmessage = function (event) {
    var incomingMessage = JSON.parse(event.data);
    if(incomingMessage.waifu) {
      w = incomingMessage; //for prettiness

      MaiWaifu.vars.currentWaifu = new MaiWaifu.Waifu(w.user, w.waifu, w.series, w.images, w.lewd, w.gender, w.type, w.summary, w.subbedSince);
      MaiWaifu.updateWaifuPane(function() {
        var topValue = MaiWaifu.vars.pane.topCoord - MaiWaifu.vars.pane.offsetHeight;
        if(topValue < 0) {
          MaiWaifu.vars.pane.style.top = "0px";
        }
        else {
          MaiWaifu.vars.pane.style.top = MaiWaifu.vars.pane.topCoord - MaiWaifu.vars.pane.offsetHeight + "px";
        }
      });
    }
    else {
      if(incomingMessage.length == 1) {
        if(MaiWaifu.Waifus.indexOf(incomingMessage[0]) > -1) {
          MaiWaifu.Waifus.push(incomingMessage);
          api.user_add_badge(incomingMessage[0], 21, "maiwaifu");
          MaiWaifu.log("Socket: Added " + incomingMessage[0] + " to waifu list.");
        }
      }
      else {
        MaiWaifu.Waifus.push(incomingMessage);
        for(var i=0; i<incomingMessage.length; i++) {
          api.user_add_badge(incomingMessage[i], 21, "maiwaifu");
        }
        MaiWaifu.log("Socket: Connected! Added " + incomingMessage.length + " users to waifu list.");
      }
    }
  };
  this.socket.onclose = function (event) {
    MaiWaifu.log("Socket: Connection closed.");
    setTimeout(function(){
      MaiWaifu.log("Socket: Retrying....");
      MaiWaifu.vars.socket = new MaiWaifu.Socket();
      MaiWaifu.vars.socket.connect();
    }, 10000);
  };
};

MaiWaifu.Socket.prototype.requestWaifu = function(username, callback) {
  this.socket.send(username);
  callback();
};

registerAddon(MaiWaifu);
