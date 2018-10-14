const REQUEST_TYPES = {
    AUTHORIZE: 1 << 0, //not implemented here
    PONG: 1 << 1, //should be the response to the PING evemt
    CHANNEL_SUBSCRIBE: 1 << 2,
    CHANNEL_UNSUBSCRIBE: 1 << 3,
    ANNOUNCE_MESSAGE: 1 << 4,
};

const EVENT_TYPES = {
    READY: 1 << 0, //you should receive that from the server directly after connecting
    AUTHORIZED: 1 << 1, //not implemeneted here
    PING: 1 << 2, //just respond with PONG request type, not yet implemented but ima kick cons eventually via that
    CHANNEL_SUBSCRIPTION_ADDED: 1 << 4,
    CHANNEL_SUBSCRIPTION_REMOVED: 1 << 5,
    USER_CHANNEL_DATA: 1 << 6,
};

const USER_FLAGS = {
    EXTENSION_DEV: 1 << 0,
    EXTENSION_ADMIN: 1 << 1,
    LIRIK_SUB: 1 << 2,
};

export default class Socket {
    constructor(parent) {
        this.parent = parent;

        this.socket = false;
        this._connected = false;
        this._connecting = false;
        this._ready = false;
        this._connect_attempts = 1;
        this._joined_channels = {};
        this._connection_buffer = [];
        this._announce_buffer = {};
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

        this.socket = new WebSocket('wss://lirik.hnlbot.com/ws');
        this.socket.binaryType = 'arraybuffer';

        this._joined_channels = {};
        this._announce_buffer = {};

        this.socket.onopen = () => {
            this.parent.log.info('Socket: Connected to socket server.');

            this._connected = true;
            this._connect_attempts = 1;

            if (this.reconnecting) {
                for (const room of this.parent.chat.iterateRooms()) {
                    if (room) this.parent.roomAdd(room);
                }

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
            let json = JSON.parse(message.data);
            json = json instanceof Array ? json : [json];

            for (const evt of json) {
                switch(evt.t) {
                case EVENT_TYPES.READY: {
                    this._ready = true;
	
                    if (this._connection_buffer.length > 0) {
                        let i = this._connection_buffer.length;
                        while (i--) {
                            const channel = this._connection_buffer[i];
                            this.joinRoom(channel);
                        }
                        this._connection_buffer = [];
                    }
                    break;
                }
	
                case EVENT_TYPES.PING: {
                    this.emit(REQUEST_TYPES.PONG);
                    break;
                }
	
                case EVENT_TYPES.CHANNEL_SUBSCRIPTION_ADDED: {
                    if (!evt.c_id) continue;
                    if (this._announce_buffer[evt.c_id]) {
                        this.announceMessage(evt.c_id);
                        delete this._announce_buffer[evt.c_id];
                    }
                    if (!evt.c_d) continue;

                    const {u_id, f: flags, s_m} = evt.c_d;
	
                    if (flags & USER_FLAGS.LIRIK_SUB) {
                        const user = this.parent.chat.getUser(u_id);
                        user.addSet('addon--ffzap.liriklive', 'addon--ffzap.liriklive--emotes-subscriber');
                        if (s_m >= 12) {
                            user.addSet('addon--ffzap.liriklive', 'addon--ffzap.liriklive--emotes-restricted');
                        }
                    }
	
                    break;
                }
	
                case EVENT_TYPES.USER_CHANNEL_DATA: {
                    const {u_id, f: flags, s_m} = evt.d;
	
                    if (flags & USER_FLAGS.LIRIK_SUB) {
                        const user = this.parent.chat.getUser(u_id);
                        user.addSet('addon--ffzap.liriklive', 'addon--ffzap.liriklive--emotes-subscriber');
                        if (s_m >= 12) {
                            user.addSet('addon--ffzap.liriklive', 'addon--ffzap.liriklive--emotes-restricted');
                        }
                    }
                }
                }
            }
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

    emit(event_type, data) {
        if (!this._connected || !this.socket) {
            return;
        }

        this.socket.send(JSON.stringify({
            t: event_type,
            d: data,
        }));
    }

    joinRoom(channel_id) {
        if (!this.parent.chat.context.get('ffzap.liriklive.sub_emoticons')) {
            return;
        }

        if (!channel_id) {
            return;
        }

        if (!this._connected || !this._ready) {
            if (!this._connection_buffer.includes(channel_id)) {
                this._connection_buffer.push(channel_id);
            }
            return;
        }

        const user = this.parent.site.getUser();
        if (!user || !user.id) {
            return;
        }

        if (this._joined_channels[channel_id]) {
            this.leaveRoom(channel_id);
        }

        this.emit(REQUEST_TYPES.CHANNEL_SUBSCRIBE, {
            u_id: user.id,
            c_id: channel_id,
        });
        this._joined_channels[channel_id] = true;

        this._announce_buffer[channel_id] = true; 
    }

    announceMessage(channel_id) {
        const user = this.parent.site.getUser();
        if (!user || !user.id) {
            return;
        }

        this.emit(REQUEST_TYPES.ANNOUNCE_MESSAGE, {
            c_id: channel_id,
            u_id: user.id,
        });
    }

    leaveRoom(channel_id) {
        if (!this._connected) {
            return;
        }

        if (this._joined_channels[channel_id]) {
            this.emit(REQUEST_TYPES.CHANNEL_UNSUBSCRIBE, {
                c_id: channel_id,
            });
        }
        delete this._joined_channels[channel_id];
    }
}
