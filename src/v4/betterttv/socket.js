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

        this.socket = new WebSocket('wss://sockets.betterttv.net/ws');

        this.socket.onopen = () => {
            this.parent.log.info('Socket: Connected to socket server.');

            this._connected = true;
            this._connect_attempts = 1;

            if (this._connection_buffer.length > 0) {
                let i = this._connection_buffer.length;
                while (i--) {
                    const channel = this._connection_buffer[i];
                    this.joinChannel(channel);
                    this.broadcastMe(channel);
                }
                this._connection_buffer = [];
            }

            if (this.reconnecting) {
                this.reconnecting = false;
                // api.iterate_rooms();
            }
        };

        this.socket.onerror = () => {
            this.parent.log.error('Socket: Error from socket server.');

            this._connect_attempts++;
            this.reconnect();
        };

        this.socket.onclose = () => {
            if (!this._connected || !this.socket) {
                return;
            }

            this.parent.log.info('Socket: Lost connection to socket server...');

            this._connect_attempts++;
            this.reconnect();
        };

        this.socket.onmessage = message => {
            let evt;

            try {
                evt = JSON.parse(message.data);
            } catch (e) {
                this.parent.log.error('Socket: Error parsing message', e);
            }

            if (!evt || !(this._events[evt.name])) {
                return;
            }

            this.parent.log.debug('Socket: Received event', evt);

            this._events[evt.name](evt.data);
        };
    }

    reconnect() {
        this.disconnect();

        if (this._connecting === false) {
            return;
        }
        this._connecting = false;

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
            data,
        }));
    }

    broadcastMe(channel) {
        if (!this._connected) {
            return;
        }
        if (!this.parent.site.getUser()) {
            return;
        }

        this.emit('broadcast_me', {
            name: this.parent.site.getUser().login,
            channel,
        });
    }

    joinChannel(channel) {
        if (!this._connected) {
            if (!this._connection_buffer.includes(channel)) {
                this._connection_buffer.push(channel);
            }
            return;
        }

        if (!channel || !channel.length) {
            return;
        }

        if (this._joined_channels[channel]) {
            this.partChannel(channel);
        }

        this.emit('join_channel', {
            name: channel,
        });
        this._joined_channels[channel] = true;
    }

    partChannel(channel) {
        if (!this._connected) {
            return;
        }
        if (!channel.length) {
            return;
        }

        if (this._joined_channels[channel]) {
            this.emit('part_channel', {
                name: channel,
            });
        }
        this._joined_channels[channel] = false;
    }
}
