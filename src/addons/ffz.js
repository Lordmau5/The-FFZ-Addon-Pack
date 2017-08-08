/* global Addon, ffz, FrankerFaceZ, apiCall, Audio */

class FFZ extends Addon {
  constructor () {
    super('FFZ');

    this.enable_local_sub = false;
    this.enable_local_mod = false;

    this.enable_highlight_sound = false;
    this.highlight_sound_volume = 50;
    this.highlight_sound_file = 'default_wet.mp3';
    this.highlight_sound;

    this.registerSelf();
  }

  doSettings () {
    super.doSettings();

    var _self = this;

    FrankerFaceZ.settings_info.ffz_enable_local_sub = {
      type: 'boolean',
      value: this.enable_local_sub,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Enable Local Sub-Only Mode',
      help: 'Only shows messages of subscribers to you.',
      on_update: function (enabled) {
        _self.enable_local_sub = enabled;
      }
    };

    FrankerFaceZ.settings_info.ffz_enable_local_mod = {
      type: 'boolean',
      value: this.enable_local_mod,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Enable Local Mod-Only Mode',
      help: 'Only shows messages of moderators to you.',
      on_update: function (enabled) {
        _self.enable_local_mod = enabled;
      }
    };

    FrankerFaceZ.settings_info.ffz_enable_highlight_sound = {
      type: 'boolean',
      value: this.enable_highlight_sound,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Highlight / Mention Sound',
      help: 'Plays a sound when you\'re being mentioned.',
      on_update: function (enabled) {
        _self.enable_highlight_sound = enabled;
      }
    };

    FrankerFaceZ.settings_info.ffz_highlight_sound_volume = {
      type: 'select',
      options: {
        5: ['5%', 0],
        10: ['10%', 1],
        20: ['20%', 2],
        30: ['30%', 3],
        40: ['40%', 4],
        50: ['50%', 5],
        60: ['60%', 6],
        70: ['70%', 7],
        80: ['80%', 8],
        90: ['90%', 9],
        100: ['100%', 10]
      },
      value: this.enable_highlight_sound,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Highlight / Mention Sound Volume',
      help: 'Changes the highlight / mention sound volume.',
      on_update: function (volume) {
        _self.highlight_sound_volume = volume;
        _self.highlight_sound.volume = volume / 100;
      }
    };

    FrankerFaceZ.settings_info.ffz_highlight_sound_file = {
      type: 'select',
      options: {
        // Default block start
        'default_wet.mp3': ['Default - Wet', 0],
        'default_graceful.mp3': ['Default - Graceful', 1],
        'default_blocker.mp3': ['Default - Blocker', 2],
        // Default block end
        'coin.mp3': ['Mario - Coin Sound', 3],
        'icq.mp3': ['ICQ - Notification', 4],
        'aol.mp3': ['AOL - You\'ve got mail!', 5],
        'mailmf.mp3': ['Euro Trip - Mail Motherf**ker!', 6],
        'zelda_secret.mp3': ['Zelda - Secret Sound', 7],
        'brainpower.mp3': ['O-oooooooooo AAAAE-A-A-I-A-U', 8],
        'the_best.mp3': ['THE BEST THE BEST', 9],
        'wow.mp3': ['WOW!', 10],
        'vsauce.mp3': ['Hey Vsauce, Michael here.', 11],
        'number_1.mp3': ['We are number one, HEY!', 12],
        'hello.mp3': ['Hello.webm', 13],
        'tuturu.mp3': ['Tuturu~~', 14],
        'omae_wa_mou_shindeiru.mp3': ['Omae wa mou shindeiru', 15],
        'never_asked_for_this.mp3': ['I never asked for this.', 16],
        'nani.mp3': ['N-NANI?!', 17],
        'oh_no.mp3': ['Oh no', 18]
      },
      value: this.highlight_sound_file,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Highlight / Mention Sound File',
      help: 'Changes the highlight / mention sound file.',
      on_update: function (file) {
        _self.highlight_sound_file = file;
        _self.highlight_sound.src = 'https://cdn.ffzap.download/sounds/' + file;
      }
    };

    this.enable_local_sub = ffz.settings.get('ffz_enable_local_sub');
    this.enable_local_mod = ffz.settings.get('ffz_enable_local_mod');
    this.enable_highlight_sound = ffz.settings.get('ffz_enable_highlight_sound');
    this.highlight_sound_volume = ffz.settings.get('ffz_highlight_sound_volume');
    this.highlight_sound_file = ffz.settings.get('ffz_highlight_sound_file');
  }

  init () {
    super.init();

    this.highlight_sound = new Audio('https://cdn.ffzap.download/sounds/' + this.highlight_sound_file);
    this.highlight_sound.volume = this.highlight_sound_volume / 100;

    FrankerFaceZ.chat_commands.viewers = function (room, args) {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('streams/' + room.room.roomProperties._id).then(function (data) {
        if (!data || !data.stream) {
          ffz.room_message(room, 'This stream is not currently live!');
        } else {
          ffz.room_message(room, data.stream.viewers + ' viewers are currently watching.');
        }
      });
    };
    FrankerFaceZ.chat_commands.viewers.info = 'Show amount of viewers';
    FrankerFaceZ.chat_commands.viewers.no_bttv = true;

    FrankerFaceZ.chat_commands.followcount = function (room, args) {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('channels/' + room.room.roomProperties._id).then(function (data) {
        if (!data) {
          ffz.room_message(room, 'There was an error processing this command!');
        } else {
          ffz.room_message(room, 'This channel currently has ' + data.followers + ' followers.');
        }
      });
    };
    FrankerFaceZ.chat_commands.followcount.info = 'Show amount of followers';
    FrankerFaceZ.chat_commands.followcount.no_bttv = true;

    FrankerFaceZ.chat_commands.followage = function (room, args) {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      if (!ffz.get_user()) {
        ffz.room_message(room, 'You need to be logged in to use this command!');
        return;
      }

      apiCall('users/' + ffz.get_user().id + '/follows/channels/' + room.room.roomProperties._id).then(function (data) {
        if (data.status) {
          if (data.status === '404') {
            ffz.room_message(room, 'You are not following this channel!');
          } else {
            ffz.room_message(room, 'There was an error processing this command!');
          }
        } else {
          ffz.room_message(room, 'You have been following ' + room.room.channel.display_name + ' since ' + new Date(data.created_at).toLocaleString() + '!');
        }
      });
    };
    FrankerFaceZ.chat_commands.followage.info = 'Show since when you followed a channel';
    FrankerFaceZ.chat_commands.followage.no_bttv = true;

    FrankerFaceZ.chat_commands.uptime = function (room, args) {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('streams/' + room.room.roomProperties._id).then(function (data) {
        if (!data || !data.stream) {
          ffz.room_message(room, 'This stream is not currently live!');
        } else {
          var diff = new Date(new Date().getTime() - new Date(data.stream.created_at).getTime());
          var string = '';
          var temp = '';

          temp = diff.getUTCSeconds();
          temp = temp < 10 ? '0' + temp : temp;
          string = temp + 's';

          temp = diff.getUTCMinutes();
          temp = temp < 10 ? '0' + temp : temp;
          string = temp + 'm' + string;

          if (diff.getUTCHours() > 0) {
            temp = diff.getUTCHours();
            temp = temp < 10 ? '0' + temp : temp;
            string = temp + 'h' + string;
          }
          ffz.room_message(room, 'The stream has been up for ' + string + '.');
        }
      });
    };
    FrankerFaceZ.chat_commands.uptime.info = 'Shows the uptime of the stream';
    FrankerFaceZ.chat_commands.uptime.no_bttv = true;

    FrankerFaceZ.chat_commands.localsub = function (room, args) {
      this.local_sub = !this.local_sub;
      ffz.settings.set('ffz_enable_local_sub', this.local_sub);

      ffz.room_message(room, 'Local sub-only mode has been ' + (this.local_sub ? 'enabled' : 'disabled') + '.');
    };
    FrankerFaceZ.chat_commands.localsub.info = 'Toggles local sub-only mode.';
    FrankerFaceZ.chat_commands.localsub.no_bttv = true;

    FrankerFaceZ.chat_commands.localmod = function (room, args) {
      this.local_mod = !this.local_mod;
      ffz.settings.set('ffz_enable_local_mod', this.local_mod);

      ffz.room_message(room, 'Local mod-only mode has been ' + (this.local_mod ? 'enabled' : 'disabled') + '.');
    };
    FrankerFaceZ.chat_commands.localmod.info = 'Toggles local sub-only mode.';
    FrankerFaceZ.chat_commands.localmod.no_bttv = true;
  }

  isModeratorOrHigher (badges) {
    return 'broadcaster' in badges || 'staff' in badges || 'admin' in badges || 'global_mod' in badges || 'moderator' in badges;
  }

  roomMessage (msg) {
    super.roomMessage(msg);

    if (msg && msg.tags) {
      if (ffz.get_user() && msg.from === ffz.get_user().login) { // Don't delete messages from the local user
        return;
      }

      if (this.enable_local_sub) { // Local Sub-Only mode
        if (!('subscriber' in msg.tags.badges) && !this.isModeratorOrHigher(msg.tags.badges)) { // Only drop the message if the user isn't a mod
          msg.ffz_removed = true;
        }
      }
      if (this.enable_local_mod) { // Local Mod-Only mode
        if (!this.isModeratorOrHigher(msg.tags.badges)) {
          msg.ffz_removed = true;
        }
      }
    }
  }

  roomHighlightMessage (msg) {
    super.roomHighlightMessage(msg);

    if (!this.enable_highlight_sound) {
      return;
    }

    this.highlight_sound.play();
  }
}

new FFZ(); // eslint-disable-line
