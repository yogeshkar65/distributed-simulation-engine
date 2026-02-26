require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const { getRedis } = require("./config/redis");
const { initSimulationQueue, getSimulationQueue } = require("./queues/simulation.queue");
const { initSimulationWorker } = require("./workers/simulation.worker");
const User = require("./modules/auth/user.model");

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const seedAdmin = async () => {
    try {
        const adminEmail = "admin@cascadex.com";
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log("[Seed] No admin found. Seeding default admin...");
            await User.create({
                name: "CascadeX Admin",
                email: adminEmail,
                password: "Admin@123",
                role: "admin"
            });
            console.log("[Seed] Admin user seeded successfully. Use admin@cascadex.com / Admin@123");
        } else {
            if (process.env.NODE_ENV !== "production") {
                console.log("[Seed] Admin user already exists.");
            }
        }
    } catch (err) {
        console.error("[Seed] Error seeding admin:", err.message);
    }
};

const startServer = async () => {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Seed Admin
    await seedAdmin();

    // 3. Initialize Socket.io (with Redis Adapter)
    initSocket(server);

    // 4. Initialize Queues & Workers
    initSimulationQueue();
    initSimulationWorker();

    // 5. Crash Recovery Logic
    const redis = getRedis();
    const keys = await redis.keys("simulation:*");

    if (process.env.NODE_ENV !== "production") {
        console.log(`[Recovery] Found ${keys.length} active simulations in Redis`);

        for (const key of keys) {
            try {
                const data = await redis.get(key);
                const sim = JSON.parse(data);
                if (sim.isRunning) {
                    const projectId = sim.projectId;
                    const queue = getSimulationQueue();
                    // Resume simulation by enqueueing next tick
                    await queue.add(`tick_${projectId}`, { projectId }, { jobId: `tick_${projectId}` });
                    console.log(`[Recovery] Resumed simulation for project: ${projectId}`);
                }
            } catch (err) {
                console.error(`[Recovery] Failed to resume ${key}:`, err.message);
            }
        }
    }

    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer().catch(err => {
    console.error("Fatal Server Error:", err);
    process.exit(1);
});
