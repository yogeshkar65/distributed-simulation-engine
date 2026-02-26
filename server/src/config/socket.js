const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { getRedis, getPubSubClients } = require("./redis");

let io;

const initSocket = (server) => {
    if (io) {
        console.warn("Socket.io already initialized. Returning existing instance.");
        return io;
    }

    const allowedOrigins =
        process.env.NODE_ENV === "production"
            ? [process.env.FRONTEND_URL]
            : ["http://localhost:5173"];

    io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true
        }
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

        socket.on("joinProjectRoom", (projectId) => {
            if (projectId) {
                socket.join(`project_${projectId}`);
                console.log(`Socket ${socket.id} joined room project_${projectId} via joinProjectRoom`);
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
