const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'ws://127.0.0.1:8000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.userId = null;
        this.shouldReconnect = false;
        this.reconnectDelay = 2000;
    }

    connect(userId) {
        if (!userId) return;
        this.userId = userId;
        this.shouldReconnect = true;

        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const url = `${SOCKET_BASE_URL}/ws/chat/${userId}/`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('Connected to WebSocket server', url);
            this.emit('connection_status', { status: 'connected' });
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const type = data.type;

            if (this.listeners.has(type)) {
                this.listeners.get(type).forEach(callback => callback(data));
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = (event) => {
            console.warn('Disconnected from WebSocket server', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
            });
            this.socket = null;
            this.emit('connection_status', { status: 'disconnected' });

            if (this.shouldReconnect) {
                setTimeout(() => {
                    console.log('Attempting WebSocket reconnect...');
                    this.connect(this.userId);
                }, this.reconnectDelay);
            }
        };
    }

    emit(type, data) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => callback(data));
        }
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
        return () => {
            const list = this.listeners.get(type);
            if (list) {
                this.listeners.set(type, list.filter(cb => cb !== callback));
            }
        };
    }

    off(type, callback) {
        if (this.listeners.has(type)) {
            const index = this.listeners.get(type).indexOf(callback);
            if (index !== -1) {
                this.listeners.get(type).splice(index, 1);
            }
        }
    }

    send(type, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, ...data }));
            return true;
        }
        console.warn('WebSocket not ready: cannot send', { type, data, readyState: this.socket?.readyState });
        return false;
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.socket) {
            this.socket.close();
        }
    }
}

const socketService = new SocketService();
export default socketService;
