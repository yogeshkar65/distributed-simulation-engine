const Redis = require("ioredis");

const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000)
});

connection.on("connect", () => {
    if (process.env.NODE_ENV !== "production") {
        console.log("✅ Redis connected (Upstash)");
    }
});

connection.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
});

// Helper for Pub/Sub if needed, although connection can be reused for basic Pub/Sub in some contexts,
// BullMQ and Socket.IO adapter usually need their own clients or can share a connection depending on the library.
// For BullMQ and general use, we'll export the main connection.
const getRedis = () => connection;

// Socket.IO adapter often needs separate pub/sub clients
let pubClient = null;
let subClient = null;

const getPubSubClients = () => {
    if (!pubClient) {
        pubClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
        subClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    }
    return { pubClient, subClient };
};

module.exports = {
    connection,
    getRedis,
    getPubSubClients
};
