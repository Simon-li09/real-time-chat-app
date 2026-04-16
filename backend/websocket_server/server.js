require('dotenv').config();
const http = require('http');
const { WebSocketServer } = require('ws');
const { connectRedis } = require('./redisClient');
const { setupSocket } = require('./socket/chat.socket.js');

const PORT = process.env.PORT || 4000;

async function startServer() {
    await connectRedis();

    const wss = new WebSocketServer({ noServer: true });
    const { getOnlineCount } = setupSocket(wss);

    const server = http.createServer((req, res) => {
        // Online users endpoint
        if (req.method === 'GET' && req.url === '/online-users') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                online_users: getOnlineCount()
            }));
            return;
        }

        // Default 404 for other HTTP requests
        res.writeHead(404);
        res.end();
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket Server and HTTP analytics endpoint (/online-users) initialized`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
