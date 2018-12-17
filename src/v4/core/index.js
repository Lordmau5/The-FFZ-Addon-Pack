/* global FrankerFaceZ, fetch, Noty */

class FFZAP extends FrankerFaceZ.utilities.module.Module {
    constructor(...args) {
        super(...args);

        this.inject('settings');
        this.inject('chat');
        this.inject('chat.emotes');
        this.inject('chat.badges');
        this.inject('site');

        this.helpers = {
            26964566: { // Lordmau5
                title: 'FFZ:AP Developer',
            },
            11819690: { // Jugachi
                title: 'FFZ:AP Helper',
            },
            36442149: { // mieDax
                title: 'FFZ:AP Helper',
            },
            29519423: { // Quanto
                title: 'FFZ:AP Helper',
            },
            22025290: { // trihex
                title: 'FFZ:AP Helper',
            },
            4867723: { // Wolsk
                title: 'FFZ:AP Helper',
            },
        };

        this.supporters = {};
        this.added_supporters = [];

        this.settings.add('ffzap.core.remove_spaces', {
            default: false,

            ui: {
                path: 'Add-Ons > FFZ:AP > Core >> Emotes',
                title: 'Remove Spaces Between Emotes',
                description: 'Enable to remove spaces inbetween emotes when they are right after one another. (e.g. combo emotes)',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.core.message_deletion', {
            default: 0,

            ui: {
                path: 'Add-Ons > FFZ:AP > Core >> Chat',
                title: 'Local Message Deletion',
                description: 'Change the mode of which messages will be deleted for yourself.',
                component: 'setting-select-box',
                data: [
                    { value: 0, title: 'Don\'t Delete Any Messages' },
                    { value: 1, title: 'Delete Non-Sub (And Higher) Messages' },
                    { value: 2, title: 'Delete Non-Mod (And Higher) Messages' },
                ],
            },
        });

        this.settings.add('ffzap.core.enable_highlight_sound', {
            default: false,

            ui: {
                path: 'Add-Ons > FFZ:AP > Core >> Highlight Sounds',
                title: 'Enable Highlight Sound',
                description: 'Enable to hear a sound every time you\'re mentioned.',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.core.highlight_sound_prevent_own_channel', {
            default: false,

            ui: {
                path: 'Add-Ons > FFZ:AP > Core >> Highlight Sounds',
                title: 'Prevent in own Channel',
                description: 'Enable to prevent the sound from playing in your own channel.',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.core.highlight_sound', {
            default: 'https://cdn.ffzap.com/sounds/default_wet.mp3',

            ui: {
                path: 'Add-Ons > FFZ:AP > Core >> Highlight Sounds',
                title: 'Sound File',
                description: 'Change the sound that will play when you get mentioned.',
                component: 'setting-combo-box',
                data: [
                    // Default Sounds
                    { value: 'https://cdn.ffzap.com/sounds/default_wet.mp3', title: 'Default - Wet' },
                    { value: 'https://cdn.ffzap.com/sounds/default_graceful.mp3', title: 'Default - Graceful' },
                    { value: 'https://cdn.ffzap.com/sounds/default_blocker.mp3', title: 'Default - Blocker' },

                    // Meme Sounds
                    { value: 'https://cdn.ffzap.com/sounds/coin.mp3', title: 'Mario - Coin Sound' },
                    { value: 'https://cdn.ffzap.com/sounds/recovery.mp3', title: 'Pokemon - Recovery' },
                    { value: 'https://cdn.ffzap.com/sounds/icq.mp3', title: 'ICQ - Notification' },
                    { value: 'https://cdn.ffzap.com/sounds/aol.mp3', title: 'AOL - You\'ve got mail!' },
                    { value: 'https://cdn.ffzap.com/sounds/mailmf.mp3', title: 'Euro Trip - Mail Motherf**ker!' },
                    { value: 'https://cdn.ffzap.com/sounds/zelda_secret.mp3', title: 'Zelda - Secret Sound' },
                    { value: 'https://cdn.ffzap.com/sounds/brainpower.mp3', title: 'O-oooooooooo AAAAE-A-A-I-A-U' },
                    { value: 'https://cdn.ffzap.com/sounds/the_best.mp3', title: 'THE BEST THE BEST' },
                    { value: 'https://cdn.ffzap.com/sounds/wow.mp3', title: 'WOW!' },
                    { value: 'https://cdn.ffzap.com/sounds/vsauce.mp3', title: 'Hey Vsauce, Michael here.' },
                    { value: 'https://cdn.ffzap.com/sounds/number_1.mp3', title: 'We are number one, HEY!' },
                    { value: 'https://cdn.ffzap.com/sounds/hello.mp3', title: 'Hello.webm' },
                    { value: 'https://cdn.ffzap.com/sounds/tuturu.mp3', title: 'Tuturu~~' },
                    { value: 'https://cdn.ffzap.com/sounds/omae_wa_mou_shindeiru.mp3', title: 'Omae wa mou shindeiru' },
                    { value: 'https://cdn.ffzap.com/sounds/never_asked_for_this.mp3', title: 'I never asked for this.' },
                    { value: 'https://cdn.ffzap.com/sounds/nani.mp3', title: 'N-NANI?!' },
                    { value: 'https://cdn.ffzap.com/sounds/oh_no.mp3', title: 'Knuckles - Oh no' },
                    { value: 'https://cdn.ffzap.com/sounds/whats_going_on.mp3', title: 'He-Man - What\'s going on?!' },
                ],
            },
        });

        this.settings.add('ffzap.core.highlight_sound_volume', {
            default: 50,

            ui: {
                path: 'Add-Ons > FFZ:AP > Core >> Highlight Sounds',
                title: 'Highlight Sound Volume',
                description: 'Change the volume at which the highlight sounds will be played at.',
                component: 'setting-select-box',
                data: [
                    { value: 5, title: '5%' },
                    { value: 10, title: '10%' },
                    { value: 20, title: '20%' },
                    { value: 30, title: '30%' },
                    { value: 40, title: '40%' },
                    { value: 50, title: '50%' },
                    { value: 60, title: '60%' },
                    { value: 70, title: '70%' },
                    { value: 80, title: '80%' },
                    { value: 90, title: '90%' },
                    { value: 100, title: '100%' },
                ],
            },
        });

        this.on('chat:receive-message', this.onReceiveMessage);

        this.chat.context.on('changed:ffzap.core.highlight_sound', url => {
            this.log.info(url);
            this.highlight_sound.src = url;
            this.playHighlightSound();
        }, this);
        
        this.chat.context.on('changed:ffzap.core.highlight_sound_volume', volume => {
            this.highlight_sound.volume = volume / 100;
            this.playHighlightSound();
        }, this);

        this.highlight_sound = new Audio(this.chat.context.get('ffzap.core.highlight_sound'));
        this.highlight_sound.volume = this.chat.context.get('ffzap.core.highlight_sound_volume') / 100;
    }

    onLoad() { // eslint-disable-line class-methods-use-this
        const noty_css = document.createElement('link');
        noty_css.type = 'text/css';
        noty_css.rel = 'stylesheet';
        noty_css.href = 'https://cdnjs.cloudflare.com/ajax/libs/noty/3.1.4/noty.min.css';
        document.head.appendChild(noty_css);
        
        const noty_js = document.createElement('script');
        noty_js.type = 'text/javascript';
        noty_js.src = 'https://cdnjs.cloudflare.com/ajax/libs/noty/3.1.4/noty.min.js';
        document.head.appendChild(noty_js);
    }

    onEnable() {
        this.log.debug('FFZ:AP\'s Core module was enabled successfully.');

        this.initDeveloper();
        this.initSupporters();
    }

    removeSpacesBetweenEmotes (tokens) {
        const output = [];
        let lastType;

        for (let i = 0, l = tokens.length; i < l; i++) {
            let token = tokens[i];
            // We don't worry about setting last_type because we know the next type is emoticon so it doesn't matter.
            if (token.type === 'text' && token.text === ' ' && lastType === 'emote' && i + 1 < l && tokens[i + 1].type === 'emote') {
                if (i - 1 >= 0) tokens[i - 1].altText += ' ';
                continue;
            }

            lastType = token.type;
            output.push(token);
        }
        return output;
    }

    isModeratorOrHigher (badges) {
        return 'broadcaster' in badges || 'staff' in badges || 'admin' in badges || 'global_mod' in badges || 'moderator' in badges;
    }

    handleMessageDeletion (msg) {
        const chatDeletion = this.chat.context.get('ffzap.core.message_deletion');
        const badges = msg.message.badges;

        if (chatDeletion == 1) {
            if (!('subscriber' in badges) && !this.isModeratorOrHigher(badges)) {
                msg.message.ffz_removed = true;
            }
        } else if (chatDeletion == 2 && !this.isModeratorOrHigher(badges)) {
            msg.message.ffz_removed = true;
        }
    }

    playHighlightSound () {
        if (!this.highlight_sound.paused) {
            this.highlight_sound.pause();
        }
        this.highlight_sound.play();
    }

    onReceiveMessage(msg) {
        if (this.chat.context.get('ffzap.core.remove_spaces')) {
            msg.message.ffz_tokens = this.removeSpacesBetweenEmotes(msg.message.ffz_tokens);
        }

        this.handleMessageDeletion(msg);

        if (this.chat.context.get('ffzap.core.enable_highlight_sound') && msg.message.mentioned) {
            if (this.chat.context.get('ffzap.core.highlight_sound_prevent_own_channel')) {
                const user = this.resolve('site').getUser();
                if (user && msg.channel == user.login) {
                    return;
                }
            }

            this.playHighlightSound();
        }
    }

    async initDeveloper() {
        const developerBadge = {
            id: 'developer',
            title: 'FFZ:AP Developer',
            color: '#E4107F',
            slot: 6,
            image: 'https://api.ffzap.com/user/badge/26964566/1',
            urls: {
                1: 'https://api.ffzap.com/user/badge/26964566/1',
                2: 'https://api.ffzap.com/user/badge/26964566/2',
                4: 'https://api.ffzap.com/user/badge/26964566/3',
            },
        };

        this.badges.loadBadgeData('addon--ffzap.core--badges-developer', developerBadge);

        this.chat.getUser(26964566).addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-developer');
    }

    async fetchSupporters() {
        const host = 'https://api.ffzap.com/supporters';

        const supporterBadge = {
            id: 'supporter',
            title: 'FFZ:AP Supporter',
            color: '#755000',
            slot: 6,
            image: 'https://api.ffzap.com/user/badge/default/1',
            urls: {
                1: 'https://api.ffzap.com/user/badge/default/1',
                2: 'https://api.ffzap.com/user/badge/default/2',
                4: 'https://api.ffzap.com/user/badge/default/3',
            },
        };

        const response = await fetch(host);
        if (response.ok) {
            const data = await response.json();

            this.badges.loadBadgeData('addon--ffzap.core--badges-supporter', supporterBadge);
	
            for (let i = 0; i < data.length; i++) {
                const user = data[i];
                if (user.id === 26964566) continue;

                if (!user.tier) continue;

                const ffzUser = this.chat.getUser(user.id);
	
                const badge = {
                    title: (this.helpers[user.id] && this.helpers[user.id].title) || 'FFZ:AP Supporter',
                    color: user.tier >= 2 && user.badge_color || supporterBadge.color,
                    image: `https://api.ffzap.com/user/badge/${user.id}/1`,
                    urls: {
                        1: `https://api.ffzap.com/user/badge/${user.id}/1`,
                        2: `https://api.ffzap.com/user/badge/${user.id}/2`,
                        4: `https://api.ffzap.com/user/badge/${user.id}/3`,
                    },
                };

                if (user.tier >= 3 && user.badge_is_colored) {
                    badge.color = 'transparent';
                    badge.no_invert = true;
                }

                ffzUser.addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-supporter', badge);
                this.added_supporters.push(user.id);
            }
        }
    }

    async fetchLegacySupporters() {
        const local_user = this.resolve('site').getUser();
        let needsNotify = false;

        const host = 'https://cdn.ffzap.com/supporters.json';

        const response = await fetch(host);
        if (response.ok) {
            const data = await response.json();
	
            for (let i = 0; i < data.users.length; i++) {
                const user = data.users[i];
                if (this.added_supporters.includes(user.id)) continue;

                if (local_user && local_user.id == user.id) {
                    needsNotify = true;
                }

                const ffzUser = this.chat.getUser(user.id);
	
                const supporterBadge = {
                    id: 'supporter',
                };
	
                if (user.level >= 2) { // Supporter Badge Color
                    supporterBadge.color = user.badge_color;
                }
	
                if (user.level >= 3) { // Custom Supporter Badge Support
                    supporterBadge.image = `https://cdn.ffzap.com/badges/t3/${user.username}_18.png`;
                    supporterBadge.urls = {
                        1: `https://cdn.ffzap.com/badges/t3/${user.username}_18.png`,
                        2: `https://cdn.ffzap.com/badges/t3/${user.username}_36.png`,
                        4: `https://cdn.ffzap.com/badges/t3/${user.username}_72.png`,
                    };
                }
                ffzUser.addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-supporter', supporterBadge);
            }
        }

        if (needsNotify) {
            setTimeout(this.showGameWispNotification, 1000);
        }
    }

    showGameWispNotification () {
        if (!localStorage.ffz_ap_gamewisp_notify && !document.location.href.includes('popout')) {
            const n = new Noty({
                type: 'alert',
                layout: 'bottomCenter',
                theme: 'sunset',
                title: '<span style="font-size: 1.5em">Attention supporter!</span>',
                text: 'It appears as though you are still supporting FFZ:AP through <a href="https://gamewisp.com/channel/4360/" target="_blank">GameWisp</a>.<br>'
                    + 'The replacement for the supporter status is now Patreon.<br>'
                    + 'Please make sure to switch over and cancel on GameWisp if you don\'t want to lose your badge.<br><br>'
                    + '<a href="https://patreon.com/Lordmau5" target="_blank">Click here to go to Patreon</a>',
                closeWith: 'button',
                callbacks: {
                    onTemplate: function () {
                        const logo = document.createElement('img');
                        logo.className = 'tw-mg-r-1';
                        logo.src = 'https://cdn.ffzap.com/icon32.png';
                        
                        const closeButton = document.createElement('button');
                        closeButton.id = 'ffzap_noty_close';
                        closeButton.className = 'tw-button-icon tw-mg-r-05 tw-absolute tw-right-0';
                        closeButton.innerHTML = '<span class="tw-button-icon__icon"><figure class="ffz-i-ok"></figure></span>';

                        this.barDom.innerHTML = '<div class="ffzap_noty noty_body tw-c-background-base tw-c-text-base tw-block tw-border"><div class="ffzap_noty_title">'
                            + logo.outerHTML + this.options.title + closeButton.outerHTML
                            + '</div><div class="ffzap_noty_text">' + this.options.text + '</div></div>';
                    },
                    afterShow: function () {
                        this.barDom.querySelector('#ffzap_noty_close').addEventListener('click', () => {
                            n.close();
                            localStorage.ffz_ap_gamewisp_notify = true;
                        });
                    },
                },
            }).show();
        }
    }

    async initSupporters() {
        await this.fetchSupporters();
        await this.fetchLegacySupporters();
    }

    // async initTier2Emotes() { // eslint-disable-line class-methods-use-this
    // 	const response = await fetch('https://api.frankerfacez.com/v1/set/105031');
    // 	if (response.ok) {
    // 		const data = await response.json();
    // 		data.set.title = 'Monthly Emote-Vote';
    // 		data.set.source = 'FFZ:AP';
    // 		this.emotes.loadSetData('addon--ffzap.core--emotes-tier2', data.set);
	
    // 		this.chat.getUser(undefined, 'lordmau5').addSet('addon--ffzap.core', 'addon--ffzap.core--emotes-tier2');
    // 	}
    // }
}

FrankerFaceZ.get().register('addon.ffzap.core', FFZAP).enable();
