
class Multiplayer {
    constructor() {
        this.peer = null;
        this.hostId = null;
        this.connections = new Map(); // key: peerId, value: DataConnection
        this.isHost = false;
        this.eventListeners = new Map();
        this._peerIdReady = false;
        this._pendingConnection = null;
    }

    // --- Public API ---

    initialize() {
        this.peer = new Peer();
        this.peer.on('open', this._handlePeerOpen.bind(this));
        this.peer.on('connection', this._handleConnection.bind(this));
        this.peer.on('error', this._handleError.bind(this));
    }

    startHosting() {
        this.isHost = true;
        this.hostId = this.getPeerId(); // The host's ID is their own peer ID
        console.log('Started hosting with ID:', this.hostId);
        this.emit('host-started', this.hostId);
    }

    connectTo(hostId) {
        if (!this._peerIdReady) {
            this._pendingConnection = hostId;
            console.log('Peer ID not ready, connection pending.');
            return;
        }

        if (this.connections.has(hostId)) {
            console.warn("Already connected to host:", hostId);
            return;
        }

        console.log('Attempting to connect to host:', hostId);
        const conn = this.peer.connect(hostId, { reliable: true });
        this._setupConnection(conn);
        this.hostId = hostId;
        this.isHost = false;
    }

    disconnect() {
        console.log('Disconnecting from all peers.');
        for (const conn of this.connections.values()) {
            conn.close();
        }
        this.connections.clear();
        this.isHost = false;
        this.hostId = null;
        this.emit('connections-updated', []);
        this.emit('disconnected');
    }

    broadcast(data) {
        if (this.isHost) {
            this._broadcastToOthers(this.getPeerId(), data);
        } else if (this.hostId && this.connections.has(this.hostId)) {
            this.connections.get(this.hostId).send(JSON.stringify(data));
        }
    }

    getPeerId() {
        return this.peer ? this.peer.id : null;
    }

    getConnectedPeers() {
        return Array.from(this.connections.keys());
    }

    isConnected() {
        return this.connections.size > 0 || this.isHost;
    }

    // --- Event Emitter ---

    on(eventName, listener) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(listener);
    }

    emit(eventName, ...args) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(listener => listener(...args));
        }
    }

    // --- Private Methods ---

    _handlePeerOpen(id) {
        console.log('My peer ID is: ' + id);
        this._peerIdReady = true;
        this.emit('peer-id-ready', id);

        if (this._pendingConnection) {
            this.connectTo(this._pendingConnection);
            this._pendingConnection = null;
        }
    }

    _handleConnection(conn) {
        this._setupConnection(conn);
    }

    _handleError(err) {
        console.error('PeerJS error:', err);
        this.emit('error', err);
    }

    _setupConnection(conn) {
        conn.on('open', () => this._handleOpen(conn));
        conn.on('data', (data) => this._handleData(conn, data));
        conn.on('close', () => this._handleClose(conn));
        conn.on('error', (err) => this._handleConnError(conn, err));
    }

    _handleOpen(conn) {
        console.log(`Connection opened with ${conn.peer}`);
        this.connections.set(conn.peer, conn);

        if (!this.isHost) {
            this.emit('request-initial-workspace', conn.peer);
        }
        this.emit('connection-opened', conn.peer);
        this.emit('connections-updated', Array.from(this.connections.values()));
    }

    _handleData(conn, data) {
        try {
            const parsedData = JSON.parse(data);
            if (this.isHost) {
                this._broadcastToOthers(conn.peer, parsedData);
            }
            this.emit('data-received', parsedData);
        } catch (e) {
            console.error("Failed to parse incoming data:", e);
        }
    }

    _handleClose(conn) {
        console.log(`Connection closed with ${conn.peer}`);
        this.connections.delete(conn.peer);
        this.emit('connection-closed', conn.peer);
        this.emit('connections-updated', Array.from(this.connections.values()));

        if (conn.peer === this.hostId && !this.isHost) {
            this.disconnect(); // Host disconnected, end session
        }
    }

    _handleConnError(conn, err) {
         console.error(`Connection error with ${conn.peer}:`, err);
         this.emit('error', err);
    }

    sendInitialWorkspace(peerId, data) {
        if (this.connections.has(peerId)) {
            this.connections.get(peerId).send(JSON.stringify(data));
        }
    }

    _broadcastToOthers(senderId, data) {
        const payload = JSON.stringify(data);
        for (const [peerId, conn] of this.connections.entries()) {
            if (peerId !== senderId) {
                conn.send(payload);
            }
        }
    }
}
