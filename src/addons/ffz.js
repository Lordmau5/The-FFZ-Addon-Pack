/* global Addon, ffz, FrankerFaceZ, apiCall, Audio, _, jQuery */

class FFZ extends Addon {
  constructor () {
    super('FFZ');

    this.enable_local_sub = false;
    this.enable_local_mod = false;

    this.enable_highlight_sound = false;
    this.highlight_sound_volume = 50;
    this.highlight_sound_file = 'default_wet.mp3';
    this.highlight_sound_blacklist = [];

    this.enable_anon_chat = false;
    this.anon_initialized = false;
    this.ignore_dc_message = {};
    this.cloak_level = Math.floor(Math.random() * 99) + 1;

    this.remove_spaces_between_emotes = false;

    this.registerSelf();
  }

  doSettings () {
    super.doSettings();

    FrankerFaceZ.settings_info.ffz_enable_local_sub = {
      type: 'boolean',
      value: this.enable_local_sub,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Enable Local Sub-Only Mode',
      help: 'Only shows messages of subscribers to you.',
      on_update: (enabled) => {
        this.enable_local_sub = enabled;
      }
    };

    FrankerFaceZ.settings_info.ffz_enable_local_mod = {
      type: 'boolean',
      value: this.enable_local_mod,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Enable Local Mod-Only Mode',
      help: 'Only shows messages of moderators to you.',
      on_update: (enabled) => {
        this.enable_local_mod = enabled;
      }
    };

    FrankerFaceZ.settings_info.ffz_enable_highlight_sound = {
      type: 'boolean',
      value: this.enable_highlight_sound,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Highlight / Mention Sound',
      help: 'Plays a sound when you\'re being mentioned.',
      on_update: (enabled) => {
        this.enable_highlight_sound = enabled;
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
      on_update: (volume) => {
        this.highlight_sound_volume = volume;
        this.highlight_sound.volume = volume / 100;
        if (this.highlight_sound.paused) {
          this.highlight_sound.play();
        }
      }
    };

    FrankerFaceZ.settings_info.ffz_highlight_sound_file = {
      type: 'select',
      options: {
        // Custom sound block start
        'custom': ['Custom', -1],
        // Custom sound block end
        // Default block start
        'default_wet.mp3': ['Default - Wet', 0],
        'default_graceful.mp3': ['Default - Graceful', 1],
        'default_blocker.mp3': ['Default - Blocker', 2],
        // Default block end
        'coin.mp3': ['Mario - Coin Sound', 3],
        'recovery.mp3': ['Pokemon - Recovery', 4],
        'icq.mp3': ['ICQ - Notification', 5],
        'aol.mp3': ['AOL - You\'ve got mail!', 6],
        'mailmf.mp3': ['Euro Trip - Mail Motherf**ker!', 7],
        'zelda_secret.mp3': ['Zelda - Secret Sound', 8],
        'brainpower.mp3': ['O-oooooooooo AAAAE-A-A-I-A-U', 9],
        'the_best.mp3': ['THE BEST THE BEST', 10],
        'wow.mp3': ['WOW!', 11],
        'vsauce.mp3': ['Hey Vsauce, Michael here.', 12],
        'number_1.mp3': ['We are number one, HEY!', 13],
        'hello.mp3': ['Hello.webm', 14],
        'tuturu.mp3': ['Tuturu~~', 15],
        'omae_wa_mou_shindeiru.mp3': ['Omae wa mou shindeiru', 16],
        'never_asked_for_this.mp3': ['I never asked for this.', 17],
        'nani.mp3': ['N-NANI?!', 18],
        'oh_no.mp3': ['Knuckles - Oh no', 19],
        'whats_going_on.mp3': ['He-Man - What\'s going on?!', 20]
      },
      value: this.highlight_sound_file,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Highlight / Mention Sound File',
      help: 'Changes the highlight / mention sound file.',
      on_update: (file) => {
        if (file === 'custom') {
          FrankerFaceZ.utils.prompt(
            'Custom Highlight / Mention Sound',
            'Please enter the URL to a custom sound file.<p></p>Tested formats: .MP3, .M4A, .WAV, .OGG',
            localStorage.ffz_ap_custom_highlight_sound,
            (newVal) => {
              if (newVal === null || newVal === undefined) {
                return;
              }

              localStorage.ffz_ap_custom_highlight_sound = newVal;
              this.highlight_sound.src = newVal;
              if (this.highlight_sound.paused) {
                this.highlight_sound.play();
              }
            }, 600
          );
          return;
        }

        this.highlight_sound_file = file;
        this.highlight_sound.src = 'https://cdn.ffzap.com/sounds/' + file;
        if (this.highlight_sound.paused) {
          this.highlight_sound.play();
        }
      }
    };

    FrankerFaceZ.settings_info.ffz_highlight_sound_blacklist = {
      type: 'button',
      value: [],

      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Highlight / Mention Sound Blacklist',
      help: 'Any channels added to this list will not be playing the highlight / mention sound.',

      method: () => {
        FrankerFaceZ.utils.prompt(
          'Highlight / Mention Sound Blacklist',
          'Please enter a comma-separated list of channels that you would like to have blacklisted for the highlight / mention sound.',
          ffz.settings.get('ffz_highlight_sound_blacklist').join(', '),
          (newVal) => {
            if (newVal === null || newVal === undefined) {
              return;
            }

            ffz.settings.set('ffz_highlight_sound_blacklist', this.highlight_sound_blacklist = _.unique(newVal.trim().toLowerCase().split(/\s*,\s*/)).without(''));
          }, 600
        );
      }
    };

    FrankerFaceZ.settings_info.ffz_enable_anon_chat = {
      type: 'boolean',
      value: this.enable_anon_chat,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Invisibility Cloak',
      help: 'Put on the Cloak of Invisibility (+' + this.cloak_level + ' Stealth) so you don\'t show up in the viewer list.',
      on_update: (enabled) => {
        this.enable_anon_chat = enabled;

        this.updateAnonChat();
      }
    };

    FrankerFaceZ.settings_info.ffz_remove_spaces_between_emotes = {
      type: 'boolean',
      value: this.remove_spaces_between_emotes,
      category: 'FFZ Add-On Pack',
      name: '[FFZ:AP] Remove Spaces Between Emotes',
      help: 'This will remove spaces inbetween emotes when they are right after one another. (e.g. combo emotes)',
      on_update: (enabled) => {
        this.remove_spaces_between_emotes = enabled;
      }
    };

    this.enable_local_sub = ffz.settings.get('ffz_enable_local_sub');
    this.enable_local_mod = ffz.settings.get('ffz_enable_local_mod');
    this.enable_highlight_sound = ffz.settings.get('ffz_enable_highlight_sound');
    this.highlight_sound_volume = ffz.settings.get('ffz_highlight_sound_volume');
    this.highlight_sound_blacklist = ffz.settings.get('ffz_highlight_sound_blacklist');
    this.highlight_sound_file = ffz.settings.get('ffz_highlight_sound_file');
    this.enable_anon_chat = ffz.settings.get('ffz_enable_anon_chat');
    this.remove_spaces_between_emotes = ffz.settings.get('ffz_remove_spaces_between_emotes');
  }

  changeAnonChatUser (_controller, username) {
    let session = _controller.get('tmiSession');
    if (!session) {
      return;
    }

    let connection = session._connections.main;
    if (!connection || connection._opts.nickname === username) {
      return;
    }

    connection._opts.nickname = username;
    this.ignore_dc_message = jQuery.extend({}, ffz.rooms);
    connection._send('QUIT');
  }

  updateAnonChat () {
    let controller = FrankerFaceZ.utils.ember_lookup('controller:chat');
    let currentRoom = ffz.rooms[controller.get('currentRoom').id];

    if (this.enable_anon_chat) {
      jQuery('.js-chat_input.chat_text_input.form__input').attr('disabled', true);
      jQuery('.chat-interface__submit.js-chat-buttons__submit').attr('disabled', true);
      jQuery('.js-bits-toggle').attr('disabled', true);

      this.changeAnonChatUser(controller, 'justinfan73823');
      ffz.room_message(currentRoom, 'You equipped a Cloak of Invisibility (+' + this.cloak_level + ' Stealth). Nobody notices a thing...');
    } else if (this.anon_initialized) {
      jQuery('.js-chat_input.chat_text_input.form__input').attr('disabled', false);
      jQuery('.chat-interface__submit.js-chat-buttons__submit').attr('disabled', false);
      jQuery('.js-bits-toggle').attr('disabled', false);

      let user = (ffz.get_user() && ffz.get_user().login) || 'justinfan73823';
      this.changeAnonChatUser(controller, user);
      ffz.room_message(currentRoom, 'You unequipped the Cloak of Invisibility (+' + this.cloak_level + ' Stealth). Suddenly, everyone can see you again...');
    }
  }

  init () {
    super.init();

    // Fix Transparent Colored badges for FF
    if (navigator.userAgent.indexOf('Firefox') > -1) {
      window.FrankerFaceZ.settings_info.transparent_badges.options[6] = 'Transparent (Colored) (Firefox 53+)';
    }

    jQuery('head').append('<style type="text/css">a[disabled="disabled"] { pointer-events: none; }</style>');

    this.highlight_sound = new Audio(this.highlight_sound_file === 'custom' ? (localStorage.ffz_ap_custom_highlight_sound) : ('https://cdn.ffzap.com/sounds/' + this.highlight_sound_file));
    this.highlight_sound.volume = this.highlight_sound_volume / 100;

    FrankerFaceZ.chat_commands.viewers = (room, args) => {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('streams/' + room.room.roomProperties._id).then((data) => {
        if (!data || !data.stream) {
          ffz.room_message(room, 'This stream is not currently live!');
        } else {
          ffz.room_message(room, data.stream.viewers + ' viewers are currently watching.');
        }
      });
    };
    FrankerFaceZ.chat_commands.viewers.info = 'Show amount of viewers';
    FrankerFaceZ.chat_commands.viewers.no_bttv = true;

    FrankerFaceZ.chat_commands.followcount = (room, args) => {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('channels/' + room.room.roomProperties._id).then((data) => {
        if (!data) {
          ffz.room_message(room, 'There was an error processing this command!');
        } else {
          ffz.room_message(room, 'This channel currently has ' + data.followers + ' followers.');
        }
      });
    };
    FrankerFaceZ.chat_commands.followcount.info = 'Show amount of followers';
    FrankerFaceZ.chat_commands.followcount.no_bttv = true;

    FrankerFaceZ.chat_commands.followage = (room, args) => {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      if (!ffz.get_user()) {
        ffz.room_message(room, 'You need to be logged in to use this command!');
        return;
      }

      apiCall('users/' + ffz.get_user().id + '/follows/channels/' + room.room.roomProperties._id).then((data) => {
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

    FrankerFaceZ.chat_commands.uptime = (room, args) => {
      if (room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('streams/' + room.room.roomProperties._id).then((data) => {
        if (!data || !data.stream) {
          ffz.room_message(room, 'This stream is not currently live!');
        } else {
          let diff = new Date(new Date().getTime() - new Date(data.stream.created_at).getTime());
          let string = '';
          let temp = '';

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

    FrankerFaceZ.chat_commands.localsub = (room, args) => {
      this.enable_local_sub = !this.enable_local_sub;
      ffz.settings.set('ffz_enable_local_sub', this.enable_local_sub);

      ffz.room_message(room, 'Local sub-only mode has been ' + (this.enable_local_sub ? 'enabled' : 'disabled') + '.');
    };
    FrankerFaceZ.chat_commands.localsub.info = 'Toggles local sub-only mode.';
    FrankerFaceZ.chat_commands.localsub.no_bttv = true;

    FrankerFaceZ.chat_commands.localmod = (room, args) => {
      this.enable_local_mod = !this.enable_local_mod;
      ffz.settings.set('ffz_enable_local_mod', this.enable_local_mod);

      ffz.room_message(room, 'Local mod-only mode has been ' + (this.enable_local_mod ? 'enabled' : 'disabled') + '.');
    };
    FrankerFaceZ.chat_commands.localmod.info = 'Toggles local sub-only mode.';
    FrankerFaceZ.chat_commands.localmod.no_bttv = true;
  }

  chatViewInit (dom, ember) {
    super.chatViewInit(dom, ember);

    if (!this.anon_initialized) {
      this.updateAnonChat();
      this.anon_initialized = true;
    }

    if (this.enable_anon_chat) {
      jQuery('.loading-mask').remove();
    }
  }

  isModeratorOrHigher (badges) {
    return 'broadcaster' in badges || 'staff' in badges || 'admin' in badges || 'global_mod' in badges || 'moderator' in badges;
  }

  removeSpacesBetweenEmotes (tokens) {
    let output = [];
    let lastType;

    for (let i = 0, l = tokens.length; i < l; i++) {
      let token = tokens[i];
      // We don't worry about setting last_type because we know the next type is emoticon so it doesn't matter.
      if (token.type === 'text' && token.text === ' ' && lastType === 'emoticon' && i + 1 < l && tokens[i + 1].type === 'emoticon') {
        if (i - 1 >= 0) tokens[i - 1].altText += ' ';
        continue;
      }

      lastType = token.type;
      output.push(token);
    }
    return output;
  }

  roomMessage (msg) {
    super.roomMessage(msg);

    if (this.remove_spaces_between_emotes) msg.cachedTokens = this.removeSpacesBetweenEmotes(msg.cachedTokens);

    if (msg) {
      if (this.ignore_dc_message[msg.room] && msg.message.indexOf('unable to connect to chat') !== -1) {
        delete this.ignore_dc_message[msg.room];
        msg.ffz_removed = true;
      }

      if (msg.tags) {
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
  }

  roomHighlightMessage (msg) {
    super.roomHighlightMessage(msg);

    if (!this.enable_highlight_sound) {
      return;
    }

    for (let i = 0; i < msg.length; i++) {
      let _msg = msg[i];
      if (this.highlight_sound_blacklist.contains(_msg.room)) {
        return;
      }

      setTimeout(() => {
        let notifications = [];
        try {
          notifications = JSON.parse(localStorage.getItem('notifications'));
        } catch (e) {}

        if (!notifications) notifications = [];

        if (notifications.includes(_msg.tags.id)) {
          return;
        }

        if (this.highlight_sound.paused) {
          this.highlight_sound.play();
          // notifications.push(_msg.tags.id);
          // localStorage.setItem('notifications', JSON.stringify(notifications));
          //
          // setTimeout(() => {
          //   notifications = jQuery.grep(JSON.parse(localStorage.getItem('notifications')), function (a) {
          //     return a !== _msg.tags.id;
          //   });
          //   localStorage.setItem('notifications', JSON.stringify(notifications));
          // }, 1000);
        }
      }, Math.random() * 50);
    }
  }
}

new FFZ(); // eslint-disable-line
