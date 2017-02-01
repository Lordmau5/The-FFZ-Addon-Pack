var addons = [],
    ffz,
    api,

    version = '2.0.7';

var registerAddon = function(addon) {
  if(isInvalidHost()) {
    return;
  }

  if(addons.includes(addon)) {
    console.log('Not registering duplicate addon!');
  }
  else {
    addons.push(addon);
    console.log('[FFZ:AP] Registered addon: ' + addon.name);
    addon.preinit();
    console.log('[FFZ:AP] Pre-initialized addon: ' + addon.name);
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

var room_add = function(room_id) {
  addons.forEach(function(addon) {
    addon.room_add(room_id);
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

    api = ffz.api('FFZ Add-On Pack', 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png', version, 'ffzap');

    // Check for BTTV
    if(ffz.has_bttv) {
      api.log('BTTV was found. To ensure best possible compatibility, consider removing BTTV.');
    }

    api.add_badge('developer', {
      color: '#FF1493',
      image: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
      name: 'developer',
      title: 'FFZ:AP Developer',
      urls: {
        1: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
        2: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_36.png',
        4: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_72.png'
      }
    });
    api.user_add_badge('lordmau5', 20, 'developer');
    api.user_add_badge('quantoqt', 20, 'developer');

    api.add_badge('supporter', {
      color: '#5383d2',
      image: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
      name: 'supporter',
      title: 'FFZ:AP Supporter',
      urls: {
        1: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
        2: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_36.png',
        4: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_72.png'
      }
    });
    api.user_add_badge('mie_dax', 20, 'supporter');
    api.user_add_badge('trihex', 20, 'supporter');
    api.user_add_badge('getcuckedxddd', 20, 'supporter');

    api.add_badge('catbag', {
      color: '#5383d2',
      image: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_18.png',
      name: 'catbag',
      title: 'FFZ:AP CatBag',
      urls: {
        1: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_18.png',
        2: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_36.png',
        4: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_72.png'
      }
    });
    api.user_add_badge('wolsk', 20, 'catbag');

    api.log('Injected successfully.');

    doSettings();
    init();

    api.emote_url_generator = function(set_id, emote_id) {
      if(set_id.startsWith('BTTV')) {
        return 'https://manage.betterttv.net/emotes/' + emote_id;
      }
      else if(set_id.startsWith('GameWisp-Sub')) {
        return 'https://twitch.tv/' + emote_id.split('-')[0];
      }
    };

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

    console.log('[FFZ:AP] Could not find FFZ. Injection unsuccessful. (Host: ' + window.location.host + ')');
  }
};

// Finally initialize ourselves!
setTimeout(checkExistance, 3000);
