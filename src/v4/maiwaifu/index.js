/* global $, Addon, api, ffz, FrankerFaceZ, WebSocket, apiCall, Image */

class MaiWaifu extends Addon {
    constructor () {
        super('MaiWaifu');

        this.url = 'https://cdn.lordmau5.com/ffz-ap/mw/';

        this.enabled = true;
        this.trihex_only = false;
        this.use_click = false;

        this.users = [];
        this.hover_timeout = false;
        this.socket = false;
        this.current_waifu = false;
        this.pane = false;
        this.bounding_box = false;
        this.current_slide = 0;
        this.mouse_movement = 0;

        this.registerSelf();
    }

    doSettings () {
        super.doSettings();

        FrankerFaceZ.settings_info.maiwaifu_enabled = {
            type: 'boolean',
            value: this.enabled,
            category: 'FFZ Add-On Pack',
            name: '[MaiWaifu] Enabled',
            help: 'Enable this to activate MaiWaifu.',
            on_update: (enabled) => {
                this.enabled = enabled;

                if (enabled) {
                    this.socket = false;
                    this.users = [];

                    if (this.isEnabled()) {
                        this.socket.connect();
                    }
                } else {
                    if (this.socket) {
                        this.socket.disconnect();
                    }
                }
            },
        };

        FrankerFaceZ.settings_info.maiwaifu_trihex_only = {
            type: 'boolean',
            value: this.trihex_only,
            category: 'FFZ Add-On Pack',
            name: '[MaiWaifu] Trihex only',
            help: 'Enable this to only make the MaiWaifu badges available on Trihex\' stream.',
            on_update: (enabled) => {
                this.trihex_only = enabled;

                if (this.isEnabled()) {
                    this.updateAllUserBadges();
                }
            },
        };

        FrankerFaceZ.settings_info.maiwaifu_use_click = {
            type: 'boolean',
            value: this.use_click,
            category: 'FFZ Add-On Pack',
            name: '[MaiWaifu] Click instead of Hover',
            help: 'Enable this for having to click on the badge instead of hovering over it.',
            on_update: (enabled) => {
                this.use_click = enabled;
            },
        };

        this.enabled = ffz.settings.get('maiwaifu_enabled');
        this.trihex_only = ffz.settings.get('maiwaifu_trihex_only');
        this.use_click = ffz.settings.get('maiwaifu_use_click');
    }

    isEnabled () {
        return super.isEnabled() && this.enabled;
    }

    preInit () {
        super.preInit();

        if (localStorage.ffz_ap_debug_mode === 'true' && localStorage.ffz_ap_mw_local === 'true') {
            this.url = 'https://localhost:3000/mw/';
        }

        $('head').append('<link rel="stylesheet" href="' + this.url + 'mCustomScrollbar.css"/>');
        $('head').append('<script src="' + this.url + 'mCustomScrollbar.js"></script>');

        $('head').append('<link rel="stylesheet" href="' + this.url + 'waifu.css" type="text/css"/>');

        $('head').append('<style type="text/css">.waifu.badge { display: none; }</style>');
    }

    init () {
        super.init();

        this.socket = new MaiWaifu.Socket(this);
        if (this.enabled) {
            this.socket.connect();
        }

        api.add_badge('maiwaifu', {
            name: 'maiwaifu',
            title: 'MaiWaifu',
            image: 'https://mywaif.us/waifu-badge.png',
            no_invert: true,
            no_tooltip: true,
            click_action: this.on_badge_click,
        });

        $(window).on('resize', this, this.onResize);
    }

    chatViewInit (dom, ember) {
        super.chatViewInit(dom, ember);

        var data = '<div class="maiwaifu" id="header">' +
      '<div class="maiwaifu" id="avatar_container">' +
        '<div class="maiwaifu" id="placeholder"></div>' +
        '<div class="maiwaifu" id="avatar"></div>' +
      '</div>' +
      '<div class="maiwaifu" id="username">' +
        '<span class="maiwaifu" id="user"></span>' +
        '<span class="maiwaifu" id="waifu"></span>' +
      '</div>' +
    '</div>' +
    '<div class="maiwaifu" id="image"></div>' +
    '<div class="maiwaifu info_container default-skin" id="info">' +
      '<div class="maiwaifu" id="series_container">' +
        '<span class="maiwaifu" id="series_template">Series:</span><span class="maiwaifu" id="series"></span>' +
      '</div>' +
      '<div class="maiwaifu" id="type_container">' +
        '<span class="maiwaifu" id="type_template">Type:</span><span class="maiwaifu" id="type"></span>' +
      '</div>' +
      '<span class="maiwaifu" id="description"></span>' +
    '</div>' +
    '<div class="maiwaifu" id="report_container">' +
      '<button class="maiwaifu" id="$1">Report</button>' +
    '</div>';

        this.pane = document.createElement('div');
        this.pane.className = 'maiwaifu ffzap-waifu';
        this.pane.innerHTML = data;

        $('body').append(this.pane);

        this.onOpen();
        this.onResize({data: this});

        $(document).on('mouseenter', '.ffz-badge-ffzap-maiwaifu', this.onBadgeHover.bind(this)).on('mouseleave', '.ffz-badge-ffzap-maiwaifu', this.onBadgeHoverEnd.bind(this));
        $(document).on('mousemove', this.mouseMovement.bind(this));
    }

    isHoveringOverPane (element, className) {
        this.extDebug('isHoveringOverPane', [element, className]);

        if (!element || !element.className || !element.className.split) {
            return false;
        }

        if (element.className.split(' ').indexOf(className) >= 0) {
            return true;
        }

        return element.parentNode && this.isHoveringOverPane(element.parentNode, className);
    }

    onOpen () {
        this.extDebug('onOpen');

        let chatMessages = $('.chat-messages');
        let offset = chatMessages.offset();
        let offsetLeft = (chatMessages.width() - 300) / 2 - 10 + offset.left;
        if (offsetLeft >= 0) {
            $('.ffzap-waifu').css('left', offsetLeft);
        } else {
            $('.ffzap-waifu').css('right', -offsetLeft);
        }
        $('.ffzap-waifu').css('top', offset.top - 20);
        $('.ffzap-waifu').css('width', Math.max(220, chatMessages.width() - 120));
    }

    onResize (event) {
        this.extDebug('onResize');

        var maxHeight = Math.min($('.chat-container').height() - 40, 500);
        $('.ffzap-waifu').css('max-height', maxHeight);
    }

    mouseMovement (event) {
        this.extDebug('mouseMovement', event);

        if (!this.current_waifu) {
            return;
        }

        if (event.target && this.isHoveringOverPane(event.target, 'maiwaifu')) {
            this.mouse_movement = 0;
        } else {
            this.mouse_movement += 1;
            if (this.mouse_movement >= 50) {
                this.fadeOutWaifu();
            }
        }
    }

    openWaifuPane (username) {
        this.extDebug('openWaifuPane', username);

        this.requestWaifu(username, () => {
            this.onResize.apply(this);
            this.fadeInWaifu();
            this.mouse_movement = 0;
        });
    }

    updateWaifuPane () {
        this.extDebug('updateWaifuPane');

        let waifu = this.current_waifu;

        $('.ffzap-waifu #header #avatar_container #avatar').css('background-image', 'none');
        $('.ffzap-waifu #header #avatar_container #placeholder').css('background-image', 'url("https://cdn.lordmau5.com/ffz-ap/mw/bestgirl.png")');

        apiCall('users/?login=' + waifu.user).then((data) => {
            $('.ffzap-waifu #header #avatar_container #avatar').css('background-image', 'url(' + data.users[0].logo + ')').fadeTo('1s', 1);
            $('.ffzap-waifu #header #avatar_container #placeholder').css('background-image', 'none');
        });

        $('.ffzap-waifu #header #username #user').text(waifu.user.capitalize() + '\'s ' + waifu.gender.capitalize());
        $('.ffzap-waifu #header #username #waifu').text(waifu.waifu);

        for (let i = 0; i < waifu.images.length; i++) {
            let preloadedImage = new Image();
            preloadedImage.src = waifu.images[i];
        }

        let image = this.current_waifu.images[0].match(/imgur\.com\/([A-Za-z0-9.]+)/)[1];

        $('.ffzap-waifu #image').css('background-image', 'url(https://miku.mywaif.us/imgur/?' + image + ')');
        this.pane.slideshow = setInterval(() => {
            if (!this.current_waifu) {
                clearInterval(this.pane.slideshow);
                return;
            }

            if (this.current_slide < this.current_waifu.images.length) {
                image = this.current_waifu.images[this.current_slide].match(/imgur\.com\/([A-Za-z0-9.]+)/)[1]; // dem greedz
                $('.ffzap-waifu #image').css('background-image', 'url(https://miku.mywaif.us/imgur/?' + image + ')');
                this.current_slide++;
            } else {
                this.current_slide = 0;
            }
        }, 5000);

        $('.ffzap-waifu #info #series_container #series').text(waifu.series);
        $('.ffzap-waifu #info #type_container #type').text(waifu.type);

        $('.ffzap-waifu #info #description').text(waifu.summary);

        $('.ffzap-waifu #report_container').css('display', 'none');
        if (!ffz.get_user() || (ffz.get_user() && ffz.get_user().login !== this.current_waifu.user)) {
            $('.ffzap-waifu #report_container').css('display', 'inline-flex');

            // var reportContainer = document.createElement('div');
            // reportContainer.className = 'ffzap-waifu ReportContainer';
            // reportContainer.style.cssFloat = 'right';
            //
            // var reportButton = document.createElement('a');
            // reportButton.className = 'ffzap-waifu ReportButton';
            // reportButton.title = 'Report Meme or Nudity';
            //
            // var reportText = document.createTextNode('Report');
            // reportButton.appendChild(reportText);
            // reportButton.onclick = function() {
            //   MaiWaifu.reportUser(MaiWaifu.vars.currentWaifu.user, reportButton, reportText);
            // };
            //
            // reportContainer.appendChild(reportButton);
            // MaiWaifu.vars.pane.appendChild(reportContainer);
        }

        // TODO: Subbed since - is this ever going to be possible?

        $('.ffzap-waifu').mCustomScrollbar({ theme: 'minimal' });
        $('.ffzap-waifu').draggable({ containment: 'body' });
    }

    getRequest (url, callback) {
        this.extDebug('getRequest', [url, callback]);

        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                callback(xmlHttp.responseText);
            }
        };
        xmlHttp.open('GET', url, true);
        xmlHttp.send(null);
    }

    requestWaifu (user, callback) {
        this.extDebug('requestWaifu', [user, callback]);

        this.socket.requestWaifu(user, callback);
    }

    reportUser (username) {
        this.extDebug('reportUser', username);

        this.getRequest('https://miku.mywaif.us:8055/report/' + username, function () {});
    }

    fadeInWaifu () {
        this.extDebug('fadeInWaifu');

        $('.ffzap-waifu').fadeIn(750);
    }

    fadeOutWaifu () {
        this.extDebug('fadeOutWaifu');

        this.current_waifu = false;
        $('.ffzap-waifu').fadeOut(500);
    }

    updateUserBadge (username) {
        this.extDebug('updateUserBadge', username);

        api.user_remove_badge(username, 21);

        if (this.isEnabled()) {
            if (this.trihex_only) {
                api.room_add_user_badge('trihex', username, 21, 'maiwaifu');
            } else {
                api.user_add_badge(username, 21, 'maiwaifu');
            }
        }
    }

    updateAllUserBadges () {
        this.extDebug('updateAllUserBadges');

        for (let i = 0; i < this.users.length; i++) {
            let username = this.users[i];
            this.updateUserBadge(username);
        }
    }

    onBadgeHover (e) {
        this.extDebug('onBadgeHover');

        if (this.use_click) {
            return;
        }

        let username = $(e.currentTarget).parents('.chat-line')[0].getAttribute('data-sender');

        this.hover_timeout = setTimeout(() => {
            this.openWaifuPane(username);
        }, 250);
    }

    onBadgeHoverEnd () {
        this.extDebug('onBadgeHoverEnd');

        clearTimeout(this.hover_timeout);
    }

    onBadgeClick (msg, event) {
        this.extDebug('onBadgeClick', [msg, event]);

        if (this.use_click) {
            MaiWaifu.openWaifuPane(msg.from);
        }
    }
}

MaiWaifu.Waifu = class {
    constructor (waifu) {
        this.user = waifu.user;
        this.waifu = waifu.waifu;
        this.series = waifu.series;
        this.images = waifu.images;
        this.lewd = waifu.lewd;
        this.gender = waifu.gender;
        this.type = waifu.type;
        this.summary = waifu.summary;
        this.subbedSince = waifu.subbedSince;
    }
};

MaiWaifu.Socket = class {
    constructor (_mw) {
        this._mw = _mw;
        this._connect_attempts = 0;
    }

    connect () {
        if (!this._mw.isEnabled()) {
            return;
        }

        this.socket = new WebSocket('wss://miku.mywaif.us:8071');

        this.socket.onopen = (event) => {
            this._connect_attempts = 1;
        };
        this.socket.onmessage = (event) => {
            var incomingMessage;
            try {
                incomingMessage = JSON.parse(event.data);
            } catch (e) {
                incomingMessage = [event.data];
            }

            if (incomingMessage.waifu) {
                this._mw.current_waifu = new MaiWaifu.Waifu(incomingMessage);
                this._mw.updateWaifuPane();
            } else {
                this._mw.debug('IncomingMessage', [incomingMessage, this._mw]);
                if (incomingMessage.length === 1) {
                    if (this._mw.users.indexOf(incomingMessage[0]) > -1) {
                        this._mw.users.push(incomingMessage);
                        this._mw.updateUserBadge(incomingMessage[0]);
                        this._mw.log('Socket: Added ' + incomingMessage[0] + ' to waifu list.');
                    }
                } else {
                    for (var i = 0; i < incomingMessage.length; i++) {
                        this._mw.users.push(incomingMessage[i]);
                        this._mw.updateUserBadge(incomingMessage[i]);
                    }
                    this._mw.log('Socket: Connected! Added ' + incomingMessage.length + ' users to waifu list.');
                }
            }
        };
        this.socket.onclose = (event) => {
            this._mw.log('Socket: Connection closed.');
            this._connect_attempts++;
            setTimeout(() => {
                this._mw.log('Socket: Retrying....');
                this._mw.socket.connect();
            }, Math.random() * (Math.pow(2, this._connect_attempts) - 1) * 10000);
        };
    }

    disconnect () {
        if (this.socket) {
            try {
                this.socket.close();
            } catch (e) {}
        }

        delete this.socket;
    }

    requestWaifu (username, callback) {
        this.socket.send(username);
        callback();
    }
};

// new MaiWaifu();
