/* global FrankerFaceZ, fetch */

class FFZAP extends FrankerFaceZ.utilities.module.Module {
    constructor(...args) {
        super(...args);

        this.inject('chat');
        this.inject('chat.emotes');
        this.inject('chat.badges');

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
    }

    onEnable() {
        this.log.debug('FFZ:AP\'s Core module was enabled successfully.');

        this.initDeveloper();
        this.initSupporters();
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
                    badge.no_invert = true;
                }

                ffzUser.addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-supporter', badge);
                this.added_supporters.push(user.id);
            }
        }
    }

    async fetchLegacySupporters() {
        const host = 'https://cdn.ffzap.com/supporters.json';

        const response = await fetch(host);
        if (response.ok) {
            const data = await response.json();
	
            for (let i = 0; i < data.users.length; i++) {
                const user = data.users[i];
                if (this.added_supporters.includes(user.id)) continue;

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
