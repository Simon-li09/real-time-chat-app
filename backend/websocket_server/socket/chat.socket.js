const { subscriber } = require('../redisClient');

function setupSocket(wss) {
    const clients = new Map(); // user_id -> socket

    wss.on('connection', (ws) => {
        let currentUserId = null;

        ws.on('message', (message) => {
            const data = JSON.parse(message);

            if (data.type === 'connect_user') {
                currentUserId = data.user_id;
                clients.set(currentUserId, ws);
                console.log(`User ${currentUserId} connected`);
                broadcastOnlineUsers();
            }
        });

        ws.on('close', () => {
            if (currentUserId) {
                clients.delete(currentUserId);
                console.log(`User ${currentUserId} disconnected`);
                broadcastOnlineUsers();
            }
        });
    });

    function broadcastOnlineUsers() {
        const onlineUsers = Array.from(clients.keys());
        const message = JSON.stringify({
            type: 'online_users',
            users: onlineUsers
        });
        clients.forEach((client) => {
            if (client.readyState === 1) { // OPEN
                client.send(message);
            }
        });
    }

    // Subscribe to Redis messages
    subscriber.subscribe('chat_messages', (message) => {
        const data = JSON.parse(message);
        const receiverId = data.receiver_id;
        const receiverSocket = clients.get(receiverId);

        if (receiverSocket && receiverSocket.readyState === 1) {
            receiverSocket.send(JSON.stringify({
                type: 'receive_message',
                ...data
            }));
        }
    });

    return {
        getOnlineCount: () => clients.size
    };
}

module.exports = { setupSocket };
