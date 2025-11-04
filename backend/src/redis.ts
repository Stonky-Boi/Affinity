import { createClient } from 'redis';

// Create a client instance
const redisClient = createClient();

// Handle connection errors
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Asynchronously connect and log the connection
(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis server.');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

// Export the ready-to-use client
export default redisClient;