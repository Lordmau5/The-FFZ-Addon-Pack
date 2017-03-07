class FFZ extends Addon {
  constructor() {
    super('FFZ');

    this.registerSelf();
  }

  init() {
    super.init();

    var _self = this;

    FrankerFaceZ.chat_commands.viewers = function(room, args) {
      if(room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('streams/' + room.room.roomProperties._id).then(function(data) {
        if(!data || !data.stream) {
          ffz.room_message(room, 'This stream is not currently live!');
        }
        else {
          ffz.room_message(room, data.stream.viewers + ' viewers are currently watching.');
        }
      });
    };
    FrankerFaceZ.chat_commands.viewers.info = 'Show amount of viewers';
    FrankerFaceZ.chat_commands.viewers.no_bttv = true;

    FrankerFaceZ.chat_commands.followcount = function(room, args) {
      if(room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('channels/' + room.room.roomProperties._id).then(function(data) {
        if(!data) {
          ffz.room_message(room, 'There was an error processing this command!');
        }
        else {
          ffz.room_message(room, 'This channel currently has ' + data.followers + ' followers.');
        }
      });
    };
    FrankerFaceZ.chat_commands.followcount.info = 'Show amount of followers';
    FrankerFaceZ.chat_commands.followcount.no_bttv = true;

    FrankerFaceZ.chat_commands.followage = function(room, args) {
      if(room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      if(!ffz.get_user()) {
        ffz.room_message(room, 'You need to be logged in to use this command!');
        return;
      }

      apiCall('users/' + ffz.get_user().id + '/follows/channels/' + room.room.roomProperties._id).then(function(data) {
        if(data.status) {
          if(data.status == '404') {
            ffz.room_message(room, 'You are not following this channel!');
          }
          else {
            ffz.room_message(room, 'There was an error processing this command!');
          }
        }
        else {
          ffz.room_message(room, 'You have been following ' + room.display_name + ' since ' + new Date(data.created_at).toLocaleString() + '!');
        }
      });
    };
    FrankerFaceZ.chat_commands.followage.info = 'Show since when you followed a channel';
    FrankerFaceZ.chat_commands.followage.no_bttv = true;

    FrankerFaceZ.chat_commands.uptime = function(room, args) {
      if(room.room.get('isGroupRoom')) {
        ffz.room_message(room, 'This command is not available in a group room.');
        return;
      }

      apiCall('streams/' + room.room.roomProperties._id).then(function(data) {
        if(!data || !data.stream) {
          ffz.room_message(room, 'This stream is not currently live!');
        }
        else {
          var diff = new Date(new Date().getTime() - new Date(data.stream.created_at).getTime());
          var string = '', temp = '';

          temp = diff.getUTCSeconds();
          temp = temp < 10 ? '0' + temp : temp;
          string = temp + 's';

          temp = diff.getUTCMinutes();
          temp = temp < 10 ? '0' + temp : temp;
          string = temp + 'm' + string;

          if(diff.getUTCHours() > 0) {
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
  }
}

new FFZ();
