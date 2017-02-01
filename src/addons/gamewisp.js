var GameWisp = {
  name: 'GameWisp',
  log: function(string) {
    api.log('[' + GameWisp.name + '] ' + string);
  },
  vars: {
    enable_emoticons: true,
    enable_badges: true,

    emote_sets: {},
    users: {}
  },
  doSettings: function() {
    FrankerFaceZ.settings_info.gamewisp_enable_emoticons = {
      type: 'boolean',
      value: GameWisp.vars.enable_emoticons,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Emoticons',
      help: 'Enable this to show GameWisp sub emoticons.',
      on_update: function(enabled) {
        GameWisp.vars.enable_emoticons = enabled;
      }
    };

    FrankerFaceZ.settings_info.gamewisp_enable_badges = {
      type: 'boolean',
      value: GameWisp.vars.enable_badges,
      category: 'FFZ Add-On Pack',
      name: '[GameWisp] Enable Badges',
      help: 'Enable this to show GameWisp sub badges.',
      on_update: function(enabled) {
        GameWisp.vars.enable_badges = enabled;
      }
    };

    GameWisp.vars.enable_emoticons = ffz.settings.get('gamewisp_enable_emoticons');
    GameWisp.vars.enable_badges = ffz.settings.get('gamewisp_enable_badges');
  },
  preinit: function() {
    // GameWisp.log('Addon pre-initialized!');

    $('head').append('<script src="https://rawgit.com/kawanet/msgpack-lite/master/dist/msgpack.min.js"></script>');
  },
  init: function() {
    GameWisp.log('Addon initialized!');
  },
  room_add: function(room_id) {

  },
  room_remove: function(room_id) {
    // Unused
  },
  room_message: function(msg) {
    // Register the user here because we have no other way to handle users as of right now

  },
  chat_view_init: function(dom, ember) {
    // Unused
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  }
};

// registerAddon(GameWisp);
