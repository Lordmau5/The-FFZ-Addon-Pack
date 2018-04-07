/* global FrankerFaceZ, fetch */

class FFZAP extends FrankerFaceZ.utilities.module.Module {
	constructor(...args) {
		super(...args);

		this.inject('chat');
		this.inject('chat.emotes');
		this.inject('chat.badges');

		this.helpers = [];
		this.mainBadge = {
			id: 'ffzap-developer',
			color: '#FF1493',
			image: 'https://cdn.ffzap.com/badges/badge_18.png',
			slot: 6,
			title: 'FFZ:AP Developer',
			click_url: 'https://ffzap.com',
			urls: {
				1: 'https://cdn.ffzap.com/badges/badge_18.png',
				2: 'https://cdn.ffzap.com/badges/badge_36.png',
				4: 'https://cdn.ffzap.com/badges/badge_72.png'
			}
		};
	}

	onEnable() {
		this.log.debug('FFZ:AP\'s Core module was enabled successfully.');

		this.initHelpers();
		this.initSupporters();
	}

	initHelpers() {
		this.badges.loadBadgeData('addon--ffzap.core--badges-developer', this.mainBadge);
		this.chat.getUser(undefined, 'lordmau5').addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-developer');

		// Helper Badge
		const helperBadge = Object.assign({}, this.mainBadge);
		helperBadge.id = 'ffzap-helper';
		helperBadge.color = '#5383D2';
		helperBadge.title = 'FFZ:AP Helper';
		this.badges.loadBadgeData('addon--ffzap.core--badges-helper', helperBadge);

		this.chat.getUser(undefined, 'quantoqt').addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-helper');
		this.chat.getUser(undefined, 'mie_dax').addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-helper');
		this.chat.getUser(undefined, 'trihex').addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-helper');
		this.chat.getUser(undefined, 'jugachi').addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-helper');

		// CatBag Badge, because Wolsk
		const catBagBadge = Object.assign({}, helperBadge);
		catBagBadge.title = 'FFZ:AP CatBag';
		catBagBadge.image = 'https://cdn.ffzap.com/badges/catbag_18.png';
		catBagBadge.urls = {
			1: 'https://cdn.ffzap.com/badges/catbag_18.png',
			2: 'https://cdn.ffzap.com/badges/catbag_36.png',
			4: 'https://cdn.ffzap.com/badges/catbag_72.png'
		};
		this.chat.getUser(undefined, 'wolsk').addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-helper', catBagBadge);

		this.helpers.push('quantoqt', 'mie_dax', 'trihex', 'getcuckedxddd', 'jugachi');
	}

	async initSupporters() {
		const host = 'https://cdn.ffzap.com/supporters.json';

		this.initTier2Emotes();

		const response = await fetch(host);
		if (response.ok) {
			const data = await response.json();

			for (let i = 0; i < data.badges.length; i++) {
				const badge = data.badges[i];
				badge.slot = 6;
				this.badges.loadBadgeData(`addon--ffzap.core--badges-${badge.name}`, badge);
			}
	
			for (let i = 0; i < data.users.length; i++) {
				const user = data.users[i];
				const ffzUser = this.chat.getUser(undefined, user.username);
	
				const supporterBadge = {
					id: 'supporter',
					slot: 6
				};
	
				if (user.level >= 2) { // Supporter Badge Color
					ffzUser.addSet('addon--ffzap.core', 'addon--ffzap.core--emotes-tier2');
					supporterBadge.color = user.badge_color;
				}
	
				if (user.level >= 3) { // Custom Supporter BdagBadge Support
					supporterBadge.image = `https://cdn.ffzap.com/badges/t3/${user.username}_18.png`;
					supporterBadge.urls = {
						1: `https://cdn.ffzap.com/badges/t3/${user.username}_18.png`,
						2: `https://cdn.ffzap.com/badges/t3/${user.username}_36.png`,
						4: `https://cdn.ffzap.com/badges/t3/${user.username}_72.png`
					};
				}
				ffzUser.addBadge('addon--ffzap.core', 'addon--ffzap.core--badges-supporter', supporterBadge);
			}
		}
	}

	async initTier2Emotes() { // eslint-disable-line class-methods-use-this
		const response = await fetch('https://api.frankerfacez.com/v1/set/105031');
		if (response.ok) {
			const data = await response.json();
			data.set.title = 'Monthly Emote-Vote';
			data.set.source = 'FFZ:AP';
			this.emotes.loadSetData('addon--ffzap.core--emotes-tier2', data.set);
	
			this.chat.getUser(undefined, 'lordmau5').addSet('addon--ffzap.core', 'addon--ffzap.core--emotes-tier2');
		}
	}
}

FrankerFaceZ.get().register('addon.ffzap.core', FFZAP).enable();
