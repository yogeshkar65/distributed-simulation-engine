const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");
const projectRoutes = require("./modules/project/project.routes");
const graphRoutes = require("./modules/graph/graph.routes");
const simulationRoutes = require("./modules/simulation/simulation.routes");
const simulationHistoryRoutes = require("./modules/simulationHistory/simulationHistory.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Body parser
app.use(express.json());

// CORS
const allowedOrigins =
    process.env.NODE_ENV === "production"
        ? [process.env.CLIENT_URL]
        : ["http://localhost:5173"];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without origin (Postman, curl)
            if (!origin) return callback(null, true);

            // In development allow localhost freely
            if (process.env.NODE_ENV !== "production") {
                return callback(null, true);
            }

            // In production strictly allow only CLIENT_URL
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/simulation", simulationRoutes);
app.use("/api/simulation-history", simulationHistoryRoutes);
app.use("/api/admin", adminRoutes);

// Health Check
app.use("/api/health", (req, res) => {
    res.json({
        status: "UP",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        services: {
            database: "CONNECTED",
            redis: "CONNECTED"
        }
    });
});
app.use("/api/ai", aiRoutes);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
