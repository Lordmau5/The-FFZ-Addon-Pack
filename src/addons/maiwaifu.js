var MaiWaifu = {
  name: "MaiWaifu",
  log: function(string) {
    api.log("[" + MaiWaifu.name + "] " + string);
  },
  vars: {
    enabled: true,
    trihex_only: false,
    use_click: false,

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
    jQuery(dom).on("mouseenter", ".ffz-badge-ffz-ap-maiwaifu", MaiWaifu.on_badge_hover);
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
    MaiWaifu.openWaifuPane(username);
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
