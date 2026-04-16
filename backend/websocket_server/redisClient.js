const redis = require('redis');

const client = redis.createClient({
    url: 'redis://127.0.0.1:6379'
});

const subscriber = client.duplicate();

client.on('error', (err) => console.error('Redis Client Error', err));
subscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

async function connectRedis() {
    await client.connect();
    await subscriber.connect();
    console.log('Connected to Redis');
}

module.exports = { client, subscriber, connectRedis };
