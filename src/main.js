/** Variable initialization **/
var addons = [],
    ffz,
    api,

    version = '2.2.16';

/** ------------ **/

/** Addon specific methods **/
var invalidHosts = ['api.', 'tmi.', 'spade.', 'chatdepot.', 'im.'];
var isInvalidHost = function() {
  for(var i=0; i<invalidHosts.length; i++) {
    if(window.location.host.indexOf(invalidHosts[i]) != -1) {
      return true;
    }
  }
  return false;
};

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
    addon.preInit();
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

var roomAdd = function(roomId) {
  addons.forEach(function(addon) {
    addon.roomAdd(roomId);
  });
};

var roomRemove = function(roomId) {
  addons.forEach(function(addon) {
    addon.roomRemove(roomId);
  });
};

var roomMessage = function(msg) {
  addons.forEach(function(addon) {
    addon.roomMessage(msg);
  });
};

var chatViewInit = function(dom, ember) {
  addons.forEach(function(addon) {
    addon.chatViewInit(dom, ember);
  });
};

var chatViewDestroy = function(dom, ember) {
  addons.forEach(function(addon) {
    addon.chatViewDestroy(dom, ember);
  });
};

var bttvInitialized = function() {
  addons.forEach(function(addon) {
    addon.bttvInitialized();
  });
};

/** ------------ **/

/** API call method **/

var CLIENT_ID = 'osnmdi33550lb0qumxv5p4lslx9ef1o';

var apiCall = function(url, options) {
  if(url.indexOf('//') === -1) {
    url = 'https://api.twitch.tv' + (url.charAt(0) === '/' ? '' : '/kraken/') + url;
  }

  options = options || {};
  options.headers = options.headers || {};
  options.headers.Accept = 'application/vnd.twitchtv.v' + (options.version || 5) + '+json';
  options.headers['Client-ID'] = CLIENT_ID;

  return fetch(url, options).then(function(response) {
    return response.json();
  });
};

/** ------------ **/

/** Extension specific methods **/
var initHelpers = function() {
  // Developer Badge
  api.add_badge('developer', {
    color: '#FF1493',
    image: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
    name: 'developer',
    title: 'FFZ:AP Developer',
    click_url: 'http://ffzap.lordmau5.com/',
    urls: {
      1: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
      2: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_36.png',
      4: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_72.png'
    }
  });
  api.user_add_badge('lordmau5', 6, 'developer');

  // Helper Badge
  api.add_badge('helper', {
    color: '#5383d2',
    image: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
    name: 'helper',
    title: 'FFZ:AP Helper',
    click_url: 'http://ffzap.lordmau5.com/',
    urls: {
      1: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png',
      2: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_36.png',
      4: 'https://cdn.lordmau5.com/ffz-ap/badges/badge_72.png'
    }
  });
  api.user_add_badge('quantoqt', 6, 'helper');
  api.user_add_badge('mie_dax', 6, 'helper');
  api.user_add_badge('trihex', 6, 'helper');
  api.user_add_badge('getcuckedxddd', 6, 'helper');
  api.user_add_badge('jugachi', 6, 'helper');

  // CatBag Badge, because Wolsk
  api.add_badge('catbag', {
    color: '#5383d2',
    image: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_18.png',
    name: 'catbag',
    title: 'FFZ:AP CatBag',
    click_url: 'http://ffzap.lordmau5.com/',
    urls: {
      1: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_18.png',
      2: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_36.png',
      4: 'https://cdn.lordmau5.com/ffz-ap/badges/catbag_72.png'
    }
  });
  api.user_add_badge('wolsk', 6, 'catbag');
};

var initSupporters = function() {
  var host = 'https://cdn.lordmau5.com/ffz-ap/supporters.json';

  fetch(host).then(function(response) {
    response.json().then(function(json) {
      var i;
      for(i=0; i<json.badges.length; i++) {
        var badge = json.badges[i];
        badge.click_url = 'http://ffzap.lordmau5.com/';
        api.add_badge(badge.name, badge);
      }

      for(i=0; i<json.users.length; i++) {
        var user = json.users[i];
        api.user_add_badge(user.username, 7, 'supporter');
      }
    });
  });
};

var handleEmoteClicking = function(set_id, emote_id) {
  if(set_id.startsWith('BTTV')) {
    return 'https://manage.betterttv.net/emotes/' + emote_id;
  }
  else if(set_id.startsWith('GW-Sub')) {
    return 'https://twitch.tv/' + emote_id.split('-')[0];
  }
};

var setupAPIEvents = function() {
  api.on('room-add', roomAdd);
  api.on('room-remove', roomRemove);
  api.on('room-message', roomMessage);
  api.on('chat-view-init', chatViewInit);
  api.on('chat-view-destroy', chatViewDestroy);
  api.on('bttv-initialized', bttvInitialized);
};

var setupNoty = function() {
  $('head').append('<style>.ffzap-noty .noty_message {' +

    'background-image: url("//cdn.lordmau5.com/ffz-ap/icon32.png") !important;' +
  	'background-repeat: no-repeat !important;' +
  	'background-position: 5px 10px !important;' +
  	'padding-left: 42px !important;' +
  	'text-align: left;' +
    'background-color: black;',
    'border-radius: 10px;' +
  '}</style>');

  $.noty.themes.ffzapTheme = {
    name: 'ffzapTheme',
    style: function() {
      this.$bar.removeClass().addClass('noty_bar').addClass('ffzap-noty');
    },
    callback: {
      onShow: function() {},
      onClose: function() {}
    }
  };
};

var showMessage = function(message) {
	if(!$.noty || !$.noty.themes.ffzTheme) {
		setTimeout(showMessage.bind(this, message), 50);
		return;
	}

	window.noty({
		text: message,
		template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close">' + FrankerFaceZ.constants.CLOSE + '</div></div>',
		theme: 'ffzapTheme',
		layout: 'bottomCenter',
		closeWith: ['button']
	}).show();
};

var checkExistance = function(attempts) {
  // Check for invalid host - if it is, don't run the script
  if(isInvalidHost()) {
    return;
  }

  if(window.FrankerFaceZ !== undefined && window.jQuery !== undefined && window.App !== undefined) {
    setupNoty();

    // Register with FFZ
    ffz = FrankerFaceZ.get();

    // Initialize the API
    api = ffz.api('FFZ Add-On Pack', 'https://cdn.lordmau5.com/ffz-ap/badges/badge_18.png', version, 'ffzap');

    // Check for BTTV
    if(ffz.has_bttv) {
      api.log('BTTV was found. To ensure best possible compatibility, consider removing BTTV.');
    }
    api.log('Injected successfully.');

    // Initialize badges
    initHelpers();

    // Initialize supporters
    initSupporters();

    // Run methods on addons
    doSettings();
    init();

    // Setup the emote URL generator
    api.emote_url_generator = handleEmoteClicking;

    // Setup API events
    setupAPIEvents();

    // Iterate over the rooms and chat views
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
/** ------------ **/

// Initialize after 3 seconds
setTimeout(checkExistance, 3000);
