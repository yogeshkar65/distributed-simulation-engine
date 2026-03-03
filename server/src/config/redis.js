const Redis = require("ioredis");

const redisOptions = {
    tls: {}, // REQUIRED for Upstash
    maxRetriesPerRequest: null, // REQUIRED for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
        return Math.min(times * 100, 3000);
    }
};

// ----------------------
// Main Redis Connection
// ----------------------
const connection = new Redis(process.env.REDIS_URL, redisOptions);

connection.on("connect", () => {
    console.log("✅ Redis connected (Upstash)");
});

connection.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
});

connection.on("close", () => {
    console.warn("⚠️ Redis connection closed");
});

connection.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
});

// ----------------------
// Pub/Sub Clients (Socket.IO Adapter)
// ----------------------
let pubClient;
let subClient;

const getPubSubClients = () => {
    if (!pubClient || !subClient) {
        pubClient = new Redis(process.env.REDIS_URL, redisOptions);
        subClient = new Redis(process.env.REDIS_URL, redisOptions);

        pubClient.on("error", (err) =>
            console.error("❌ Redis PubClient error:", err.message)
        );

        subClient.on("error", (err) =>
            console.error("❌ Redis SubClient error:", err.message)
        );

        pubClient.on("reconnecting", () =>
            console.log("🔄 PubClient reconnecting...")
        );

        subClient.on("reconnecting", () =>
            console.log("🔄 SubClient reconnecting...")
        );
    }

    return { pubClient, subClient };
};

// ----------------------
// Getter
// ----------------------
const getRedis = () => connection;

module.exports = {
    connection,
    getRedis,
    getPubSubClients
};