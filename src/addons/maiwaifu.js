var MaiWaifu = {
  name: 'MaiWaifu',
  log: function(string, data) {
    api.log('[' + MaiWaifu.name + '] ' + string, data);
  },
  debug: function(string, data) {
    if(localStorage.ffz_ap_debug_mode !== 'true') {
      return;
    }

    api.log('[' + MaiWaifu.name + ' - DEBUG] ' + string, data);
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
  preinit: function() {
    // MaiWaifu.log('Addon pre-initialized!');

    $('head').append('<link rel="stylesheet" href="https://cdn.lordmau5.com/ffz-ap/mw/jsCustomScrollbar.css"/>');
    $('head').append('<script src="https://cdn.lordmau5.com/ffz-ap/mw/jsCustomScrollbar.js"></script>');

    $('head').append('<link rel="stylesheet" href="https://cdn.lordmau5.com/ffz-ap/mw/waifu.css" type="text/css"/>');
    $.get('https://cdn.lordmau5.com/ffz-ap/mw/waifu.template', function(data) {
      MaiWaifu.vars.pane = document.createElement("div");
      MaiWaifu.vars.pane.className = 'maiwaifu waifu';
      MaiWaifu.vars.pane.innerHTML = data;
      document.body.appendChild(MaiWaifu.vars.pane);
    });
  },
  init: function() {
    MaiWaifu.log('Addon initialized!');

    MaiWaifu.vars.socket = new MaiWaifu.Socket();
    if(MaiWaifu.vars.enabled) {
      MaiWaifu.vars.socket.connect();
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
  room_add: function(room_id) {
    // Unused
  },
  room_message: function(msg) {
    // Unused
  },

  chat_view_init: function(dom, ember) {
    jQuery(dom).on("mouseenter", ".ffz-badge-ffzap-maiwaifu", MaiWaifu.on_badge_hover).on("mouseleave", ".ffz-badge-ffzap-maiwaifu", MaiWaifu.on_badge_hover_end);
    jQuery(document).on("mousemove", MaiWaifu.mouseMovement);
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  },
  bttv_initialized: function() {
    // Unused
  },

  mouseMovement: function(event) {
    if(!MaiWaifu.vars.currentWaifu) {
      return;
    }

    if(event.target && event.target.className.indexOf("maiwaifu") != -1) {
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
    MaiWaifu.requestWaifu(username, function() {
      MaiWaifu.fadeInWaifu();
      MaiWaifu.vars.mouseMovement = 0;
    });
  },

  updateWaifuPane: function(callback) {
    var waifu = MaiWaifu.vars.currentWaifu;

    var setHeaders = function(xhr) {
      xhr.setRequestHeader('Client-ID', 'osnmdi33550lb0qumxv5p4lslx9ef1o');
    };

    $('.waifu #header #avatar_container #avatar').css('background-image', 'none');
    $('.waifu #header #avatar_container #placeholder').css('background-image', 'url("https://cdn.lordmau5.com/ffz-ap/mw/bestgirl.png")');

    $.ajax({
      url: 'https://api.twitch.tv/kraken/users/' + waifu.user,
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        $('.waifu #header #avatar_container #avatar').css('background-image', 'url(' + data.logo + ')').fadeTo('1s', 1);
        $('.waifu #header #avatar_container #placeholder').css('background-image', 'none');
      },
      error: function() {
        MaiWaifu.log('Error whilst trying to fetch user avatar! (User: ' + waifu.user + ')');
      },
      beforeSend: setHeaders
    });

    $('.waifu #header #username #user').text(waifu.user.capitalize() + '\'s ' + waifu.gender.capitalize());
    $('.waifu #header #username #waifu').text(waifu.waifu);

    for(var i=0; i<waifu.images.length; i++) {
      var preloadedImage = new Image();
      preloadedImage.src = waifu.images[i];
    }

    var image = MaiWaifu.vars.currentWaifu.images[0].match(/imgur\.com\/([A-Za-z0-9\.]+)/)[1];

    $('.waifu #image').css('background-image', 'url(https://miku.mywaif.us/imgur/?' + image + ')');
    MaiWaifu.vars.pane.slideshow = setInterval(function() {
      if(!MaiWaifu.vars.currentWaifu) {
        clearInterval(MaiWaifu.vars.pane.slideshow);
        return;
      }

      if(MaiWaifu.vars.currentSlide < MaiWaifu.vars.currentWaifu.images.length) {
        image = MaiWaifu.vars.currentWaifu.images[MaiWaifu.vars.currentSlide].match(/imgur\.com\/([A-Za-z0-9\.]+)/)[1];//dem greedz
        $('.waifu #image').css('background-image', 'url(https://miku.mywaif.us/imgur/?' + image + ')');
        MaiWaifu.vars.currentSlide++;
      }
      else {
        MaiWaifu.vars.currentSlide = 0;
      }
    },5000);

    $('.waifu #info #series_container #series').text(waifu.series);
    $('.waifu #info #type_container #type').text(waifu.type);

    $('.waifu #info #description').text(waifu.summary);

    $('.waifu #report_container').css('display', 'none');
    if(!ffz.get_user() || ffz.get_user() && ffz.get_user().login !== MaiWaifu.vars.currentWaifu.user) {
      $('.waifu #report_container').css('display', 'inline-flex');

      // var reportContainer = document.createElement('div');
      // reportContainer.className = "waifu ReportContainer";
      // reportContainer.style.cssFloat = "right";
      //
      // var reportButton = document.createElement('a');
      // reportButton.className = "waifu ReportButton";
      // reportButton.title = "Report Meme or Nudity";
      //
      // var reportText = document.createTextNode("Report");
      // reportButton.appendChild(reportText);
      // reportButton.onclick = function() {
      //   MaiWaifu.reportUser(MaiWaifu.vars.currentWaifu.user, reportButton, reportText);
      // };
      //
      // reportContainer.appendChild(reportButton);
      // MaiWaifu.vars.pane.appendChild(reportContainer);
    }

    // TODO: Subbed since

    $('.waifu .info_container').customScrollbar();

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
    MaiWaifu.vars.currentWaifu = false;
    $('.waifu').fadeOut(1000);
  },

  fadeInWaifu: function() {
    $('.waifu').fadeIn(1000);
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

MaiWaifu.Socket.prototype.connect = function() {
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
        // var topValue = MaiWaifu.vars.pane.topCoord - MaiWaifu.vars.pane.offsetHeight;
        // if(topValue < 0) {
        //   MaiWaifu.vars.pane.style.top = "0px";
        // }
        // else {
        //   MaiWaifu.vars.pane.style.top = MaiWaifu.vars.pane.topCoord - MaiWaifu.vars.pane.offsetHeight + "px";
        // }
      });
    }
    else {
      if(incomingMessage.length == 1) {
        if(MaiWaifu.vars.users.indexOf(incomingMessage[0]) > -1) {
          MaiWaifu.vars.users.push(incomingMessage);
          MaiWaifu.update_user_badge(incomingMessage[0]);
          MaiWaifu.log('Socket: Added ' + incomingMessage[0] + ' to waifu list.');
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

// registerAddon(MaiWaifu);
