/* global fetch, $, FrankerFaceZ */

/** Variable initialization **/
var addons = [];
var ffz;
var api;

var version = '3.0.34';
/** ------------ **/

/** Addon specific methods **/
var invalidHosts = ['api.', 'tmi.', 'spade.', 'chatdepot.', 'im.', 'api-akamai.'];
var isInvalidHost = function () {
  for (var i = 0; i < invalidHosts.length; i++) {
    if (window.location.host.indexOf(invalidHosts[i]) !== -1) {
      return true;
    }
  }
  return false;
};

var registerAddon = function (addon) { // eslint-disable-line
  if (isInvalidHost()) {
    return;
  }

  if (addons.includes(addon)) {
    console.log('Not registering duplicate addon!');
  } else {
    addons.push(addon);
    console.log('[FFZ:AP] Registered addon: ' + addon.name);
  }
};

var preInit = function () {
  addons.forEach(function (addon) {
    addon.preInit();
  });
};

var doSettings = function () {
  addons.forEach(function (addon) {
    addon.doSettings();
  });
};

var init = function () {
  addons.forEach(function (addon) {
    addon.init();
  });
};

var roomAdd = function (roomId) {
  addons.forEach(function (addon) {
    addon.roomAdd(roomId);
  });
};

var roomRemove = function (roomId) {
  addons.forEach(function (addon) {
    addon.roomRemove(roomId);
  });
};

var roomMessage = function (msg) {
  addons.forEach(function (addon) {
    addon.roomMessage(msg);
  });
};

var roomHighlightMessage = function (msg) {
  addons.forEach(function (addon) {
    addon.roomHighlightMessage(msg);
  });
};

var chatViewInit = function (dom, ember) {
  addons.forEach(function (addon) {
    addon.chatViewInit(dom, ember);
  });
};

var chatViewDestroy = function (dom, ember) {
  addons.forEach(function (addon) {
    addon.chatViewDestroy(dom, ember);
  });
};

var bttvInitialized = function () {
  addons.forEach(function (addon) {
    addon.bttvInitialized();
  });
};

/** ------------ **/

/** API call method **/

var CLIENT_ID = 'osnmdi33550lb0qumxv5p4lslx9ef1o';

var apiCall = function (url, options) { // eslint-disable-line
  if (url.indexOf('//') === -1) {
    url = 'https://api.twitch.tv' + (url.charAt(0) === '/' ? '' : '/kraken/') + url;
  }

  options = options || {};
  options.headers = options.headers || {};
  options.headers.Accept = 'application/vnd.twitchtv.v' + (options.version || 5) + '+json';
  options.headers['Client-ID'] = CLIENT_ID;

  return fetch(url, options).then(function (response) {
    return response.json();
  });
};

/** ------------ **/

/** Extension specific methods **/
var helpers = [];
var mainBadge = {
  color: '#FF1493',
  image: 'https://cdn.ffzap.download/badges/badge_18.png',
  name: 'developer',
  title: 'FFZ:AP Developer',
  click_url: 'https://ffzap.download',
  urls: {
    1: 'https://cdn.ffzap.download/badges/badge_18.png',
    2: 'https://cdn.ffzap.download/badges/badge_36.png',
    4: 'https://cdn.ffzap.download/badges/badge_72.png'
  }
};
var helperBadge;
var catBagBadge;
var helperPlus;

var initHelpers = function () {
  // Developer Badge
  api.add_badge('developer', mainBadge);
  api.user_add_badge('lordmau5', 6, 'developer');

  // Helper Badge
  helperBadge = $.extend({}, mainBadge);
  helperBadge.color = '#5383D2';
  helperBadge.name = 'helper';
  helperBadge.title = 'FFZ:AP Helper';
  api.add_badge('helper', helperBadge);

  api.user_add_badge('quantoqt', 6, 'helper');
  api.user_add_badge('mie_dax', 6, 'helper');
  api.user_add_badge('trihex', 6, 'helper');
  api.user_add_badge('getcuckedxddd', 6, 'helper');
  api.user_add_badge('jugachi', 6, 'helper');
  api.user_add_badge('techno', 6, 'helper');

  // CatBag Badge, because Wolsk
  catBagBadge = $.extend({}, helperBadge);
  catBagBadge.title = 'FFZ:AP CatBag';
  catBagBadge.image = 'https://cdn.ffzap.download/badges/catbag_18.png';
  catBagBadge.urls = {
    1: 'https://cdn.ffzap.download/badges/catbag_18.png',
    2: 'https://cdn.ffzap.download/badges/catbag_36.png',
    4: 'https://cdn.ffzap.download/badges/catbag_72.png'
  };
  api.user_add_badge('wolsk', 6, catBagBadge);

  helperPlus = $.extend({}, helperBadge);
  helperPlus.color = '#FAAF19';
  helperPlus.title = 'FFZ:AP Helper+';

  helpers.push('quantoqt', 'mie_dax', 'trihex', 'getcuckedxddd', 'jugachi', 'techno');
};

var initSupporters = function () {
  var host = 'https://cdn.ffzap.download/supporters.json';

  tier2MonthlyEmotes();

  fetch(host).then(function (response) {
    response.json().then(function (json) {
      var i;
      for (i = 0; i < json.badges.length; i++) {
        var badge = json.badges[i];
        api.add_badge(badge.name, badge);
      }

      for (i = 0; i < json.users.length; i++) {
        var user = json.users[i];

        var supporterBadge = {
          id: 'supporter'
        };

        if (helpers.includes(user.username)) {
          supporterBadge = $.extend({}, helperPlus);
        }

        if (user.level >= 2) { // Supporter Badge Color
          api.user_add_set(user.username, 'tier2_monthly');
          supporterBadge.color = user.badge_color;
        }

        if (user.level >= 3) { // Custom Supporter BdagBadge Support
          supporterBadge.image = 'https://cdn.ffzap.download/badges/t3/' + user.username + '_18.png';
          supporterBadge.urls = {
            1: 'https://cdn.ffzap.download/badges/t3/' + user.username + '_18.png',
            2: 'https://cdn.ffzap.download/badges/t3/' + user.username + '_36.png',
            4: 'https://cdn.ffzap.download/badges/t3/' + user.username + '_72.png'
          };
        }
        api.user_add_badge(user.username, 6, supporterBadge);
      }
    });
  });
};

var tier2MonthlyEmotes = function () {
  fetch('https://api.frankerfacez.com/v1/set/105031').then(function (response) {
    response.json().then(function (json) {
      json.set.title = 'Monthly Emote-Vote';
      json.set.source = 'FFZ:AP';
      api.load_set('tier2_monthly', json.set);

      api.user_add_set('lordmau5', 'tier2_monthly');
    });
  });
};

var handleEmoteClicking = function (setId, emoteId) {
  if (setId.startsWith('BTTV')) {
    return 'https://manage.betterttv.net/emotes/' + emoteId;
  } else if (setId.startsWith('GW-Sub')) {
    return 'https://twitch.tv/' + emoteId.split('-')[0];
  }
};

var setupAPIEvents = function () {
  api.on('room-add', roomAdd);
  api.on('room-remove', roomRemove);
  api.on('room-message', roomMessage);
  api.on('room-recent-highlights', roomHighlightMessage);
  api.on('chat-view-init', chatViewInit);
  api.on('chat-view-destroy', chatViewDestroy);
  api.on('bttv-initialized', bttvInitialized);
};

var setupNoty = function () {
  $('head').append('<style>.ffzap-noty .noty_message {' +

    'background-image: url("//cdn.ffzap.download/icon32.png") !important;' +
    'background-repeat: no-repeat !important;' +
    'background-position: 5px 10px !important;' +
    'padding-left: 42px !important;' +
    'text-align: left;' +
    'background-color: black;',
    'border-radius: 10px;' +
  '}</style>');

  $.noty.themes.ffzapTheme = {
    name: 'ffzapTheme',
    style: function () {
      this.$bar.removeClass().addClass('noty_bar').addClass('ffzap-noty');
    },
    callback: {
      onShow: function () {},
      onClose: function () {}
    }
  };
};

var showMessage = function (message) {
  if (!$.noty || !$.noty.themes.ffzTheme) {
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

var notifyUserOfUserScript = function () {
  // var shown = localStorage.ffz_ap_warning_uscript;
  // if (shown !== 'true') {
  //   localStorage.ffz_ap_warning_uscript = 'true';
  //   showMessage('FFZ:AP has been pulled from the Chrome Webstore and will <strong>NOT</strong> make a comeback. I highly recommend you to switch over to the userscript! -' +
  //     'Check the <a target="_blank" href="https://ffzap.download/">website</a> to see a video tutorial on how to install it! :)');
  // }
};

var checkExistance = function (attempts) {
  // Check for invalid host - if it is, don't run the script
  if (isInvalidHost()) {
    return;
  }

  if (window.FrankerFaceZ !== undefined && window.jQuery !== undefined && window.$ !== undefined && window.App !== undefined) {
    setupNoty();
    preInit();

    // Register with FFZ
    ffz = FrankerFaceZ.get();

    // Initialize the API
    api = ffz.api('FFZ Add-On Pack', 'https://cdn.ffzap.download/badges/badge_18.png', version, 'ffzap');

    // Check for BTTV
    if (ffz.has_bttv) {
      api.log('BTTV was found. To ensure best possible compatibility, consider removing BTTV.');
    }
    api.log('Injected successfully.');

    // Initialize badges
    initHelpers();

    // Initialize supporters
    initSupporters();

    notifyUserOfUserScript();

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
  } else {
    attempts = (attempts || 0) + 1;
    if (attempts < 60) {
      return setTimeout(checkExistance.bind(this, attempts), 1000);
    }

    console.log('[FFZ:AP] Could not find FFZ. Injection unsuccessful. (Host: ' + window.location.host + ')');
  }
};
/** ------------ **/

// Initialize after 3 seconds
setTimeout(checkExistance, 3000);
