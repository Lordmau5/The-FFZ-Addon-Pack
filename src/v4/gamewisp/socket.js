/* globals msgpack */

export default class Socket {
	constructor(parent, events) {
		this.parent = parent;

		this.socket = false;
		this._looked_up_users = [];
		this._connected = false;
		this._connecting = false;
		this._connect_attempts = 1;
		this._joined_channels = [];
		this._connection_buffer = [];
		this._events = events;
	}

	connect() {
		if (!this.parent.site.getUser()) {
			return;
		}
		if (this._connected || this._connecting) {
			return;
		}
		this._connecting = true;

		this.parent.log.info('Socket: Connecting to socket server...');

		this.socket = new WebSocket('wss://emotes.gamewisp.com/');
		this.socket.binaryType = 'arraybuffer';

		this._joined_channels = [];

		this.socket.onopen = () => {
			this.parent.log.info('Socket: Connected to socket server.');

			this._connected = true;
			this._connect_attempts = 1;

			if (this._connection_buffer.length > 0) {
				let i = this._connection_buffer.length;
				while (i--) {
					const channel = this._connection_buffer[i];
					this.joinRoom(channel);
				}
				this._connection_buffer = [];
			}

			if (this.reconnecting) {
				this.reconnecting = false;
			}
		};

		this.socket.onerror = () => {
			this.parent.log.error('Socket: Error from socket server.');

			if (this._connecting) {
				this.reconnecting = false;
			}

			this._connect_attempts++;
			this.reconnect();
		};

		this.socket.onclose = () => {
			if (!this._connected || !this.socket) {
				return;
			}

			this.parent.log.error('Socket: Lost connection to socket server...');

			this._connect_attempts++;
			this.reconnect();
		};

		this.socket.onmessage = message => {
			message = msgpack.decode(new Uint8Array(message.data));
			const evt = message.name;

			if (!evt || !(this._events[evt])) {
				return;
			}

			this._events[evt](message.data);
		};
	}

	reconnect() {
		this.disconnect();

		if (this.reconnecting) {
			return;
		}
		this.reconnecting = false;

		this.parent.log.info('Socket: Trying to reconnect to socket server...');

		setTimeout(() => {
			this.reconnecting = true;
			this.connect();
		}, Math.random() * (Math.pow(2, this._connect_attempts) - 1) * 10000);
	}

	disconnect() {
		if (this.socket) {
			try {
				this.socket.close();
			} catch (e) {
				// Error
			}
		}

		delete this.socket;

		this._connected = false;
		this._connecting = false;
	}

	disconnectInternal() {
		this.disconnect();

		this.parent.log.info('Socket: Disconnected from socket server.');
	}

	emit(event, data) {
		if (!this._connected || !this.socket) {
			return;
		}

		this.socket.send(JSON.stringify({
			name: event,
			data
		}));
	}

	joinRoom(channel) {
		if (!this.parent.chat.context.get('ffzap.gamewisp.sub_emoticons') || !this.parent.chat.context.get('ffzap.gamewisp.sub_badges')) {
			return;
		}

		if (!this._connected) {
			if (!this._connection_buffer.includes(channel)) {
				this._connection_buffer.push(channel);
			}
			return;
		}

		if (!this.parent.site.getUser() || !this.parent.site.getUser().login) {
			return;
		}

		if (!channel.length) {
			return;
		}

		if (this._joined_channels[channel]) {
			this.leaveRoom(channel);
		}

		this.emit('join_room', {
			user: this.parent.site.getUser().login,
			room: channel,
			mode: ['emotes', 'badges'],
			sub_data: true
		});
		this._joined_channels[channel] = true;
	}

	leaveRoom(channel) {
		if (!this._connected) {
			return;
		}
		if (!channel.length) {
			return;
		}

		if (this._joined_channels[channel]) {
			this.emit('leave_room', {
				user: this.parent.site.getUser().login,
				name: channel
			});
		}
		this._joined_channels[channel] = false;
	}
}