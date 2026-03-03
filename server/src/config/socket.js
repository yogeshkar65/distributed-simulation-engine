const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { getRedis, getPubSubClients } = require("./redis");

let io;

const initSocket = (server) => {
    if (io) {
        console.warn("Socket.io already initialized. Returning existing instance.");
        return io;
    }

    io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);

                    // Development
                    if (
                        process.env.NODE_ENV !== "production" &&
                        origin.startsWith("http://localhost")
                    ) {
                        return callback(null, true);
                    }

                    // Production
                    if (origin === process.env.FRONTEND_URL) {
                        return callback(null, true);
                    }

                    return callback(new Error("Socket.IO CORS not allowed"), false);
                },
                credentials: true,
            },
    });

    // Setup Redis Adapter for multi-instance scaling
    const { pubClient, subClient } = getPubSubClients();
    io.adapter(createAdapter(pubClient, subClient));

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join_project", (projectId) => {
            if (projectId) {
                socket.join(`project_${projectId}`);
                console.log(`Socket ${socket.id} joined room project_${projectId}`);
            }
        });

        socket.on("joinProjectRoom", async (projectId) => {
            if (projectId) {
                socket.join(`project_${projectId}`);
                console.log(`Socket ${socket.id} joined room project_${projectId} via joinProjectRoom`);

                try {
                    const redis = getRedis();
                    const key = `simulation:${projectId}`;
                    const data = await redis.get(key);

                    if (data) {
                        const state = JSON.parse(data);

                        socket.emit("simulation_state_sync", {
                            nodesState: state.nodesState || {},
                            failedNodeIds: state.failedNodeIds || state.analytics?.failedNodeIds || [],
                            cascadeDepth: state.cascadeDepth || state.analytics?.cascadeDepth || 0,
                            isRunning: state.isRunning || false,
                            mode: state.mode || state.analytics?.mode || "deterministic",
                            injectedNodeId: state.injectedNodeId || null
                        });
                    }
                } catch (err) {
                    console.error("Simulation state sync error:", err.message);
                }
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. You must call initSocket(server) first.");
    }
    return io;
};

module.exports = { initSocket, getIO };
