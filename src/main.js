var addons = [],
    ffz,
    api,

    version = '1.0.1';

var registerAddon = function(addon) {
  if(isInvalidHost()) {
    return;
  }

  if(addons.includes(addon)) {
    console.log('Not registering duplicate addon!');
  }
  else {
    addons.push(addon);
    console.log('[FAP] Registered addon: ' + addon.name);
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

var room_add = function(room_id, reg_function) {
  addons.forEach(function(addon) {
    addon.room_add(room_id, reg_function);
  });
};

var room_remove = function(room_id) {
  addons.forEach(function(addon) {
    addon.room_remove(room_id);
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

var invalidHosts = ['api.', 'tmi.', 'spade.', 'chatdepot.', 'im.'];
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

    api = ffz.api('FFZ Add-On Pack', 'https://cdn.lordmau5.com/Mau5Badge_Alpha.png', version, 'fap');

    /* Debug toggle */

    FrankerFaceZ.settings_info.ffz_ap_debug_mode = {
      type: 'boolean',
      value: false,
      category: 'FFZ Add-On Pack',
      name: 'Enable debug mode',
      help: 'Will try to load the script from a local server hosted on port 3000.',
      on_update: function(enabled) {
        localStorage.ffz_ap_debug_mode = enabled;
      }
    };

    /* ------------ */

    // Check for BTTV
    if(ffz.has_bttv) {
      api.log('BTTV was found. To ensure best possible compatibility, consider removing BTTV.');
    }

    api.add_badge('developer', {
      name: 'developer',
      title: 'FAP Developer',
      image: 'https://cdn.lordmau5.com/Mau5Badge.png',
      alpha_image: 'https://cdn.lordmau5.com/Mau5Badge_Alpha.png',
      color: '#49acff'
    });
    api.user_add_badge('lordmau5', 20, 'developer');
    api.user_add_badge('quantoqt', 20, 'developer');

    api.log('Injected successfully.');

    doSettings();
    init();

    api.on('room-add', room_add);
    api.on('room-remove', room_remove);
    api.on('room-message', room_message);
    api.on('chat-view-init', chat_view_init);
    api.on('chat-view-destroy', chat_view_destroy);

    api.iterate_rooms();
    api.iterate_chat_views();
  }
  else {
    attempts = (attempts || 0) + 1;
    if(attempts < 60) {
      return setTimeout(checkExistance.bind(this, attempts), 1000);
    }

    console.log('[FAP] Could not find FFZ. Injection unsuccessful. (Host: ' + window.location.host + ')');
  }
};

// Finally initialize ourselves!
setTimeout(checkExistance, 3000);
