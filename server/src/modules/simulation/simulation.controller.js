const simulationEngine = require("./simulation.engine");
const Project = require("../project/project.model");
const { getIO } = require("../../config/socket");

// @desc    Start simulation
// @route   POST /api/simulation/start/:projectId
const startSimulation = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Validate project ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isOwner = project.createdBy.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";
        const canManageSimulation = isOwner || isAdmin;

        // Allow admin override for simulation control
        if (!canManageSimulation) {
            return res.status(403).json({ message: "Not authorized to manage this simulation" });
        }

        const simulation = await simulationEngine.startSimulation(projectId);

        res.json({
            message: "Simulation started",
            projectId,
            isRunning: true
        });
    } catch (error) {
        if (error.message === "Simulation already running on another instance") {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

// @desc    Stop simulation
// @route   POST /api/simulation/stop/:projectId
const stopSimulation = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isOwner = project.createdBy.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";
        const canManageSimulation = isOwner || isAdmin;

        // Allow admin override for simulation control
        if (!canManageSimulation) {
            return res.status(403).json({ message: "Not authorized to manage this simulation" });
        }

        await simulationEngine.stopSimulation(projectId);

        // Update project status in DB
        project.simulationStatus = "stopped";
        await project.save();

        // Emit real-time update to the project room
        const io = getIO();
        const roomName = `project_${projectId}`;
        console.log("Emitting simulation:stopped to room:", roomName);
        io.to(roomName).emit("simulation:stopped", {
            projectId: projectId.toString(),
            status: "stopped"
        });

        res.json({
            success: true,
            message: "Simulation stopped successfully",
            projectId,
            isRunning: false
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get simulation status
// @route   GET /api/simulation/status/:projectId
const getStatus = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const status = await simulationEngine.getSimulationStatus(projectId);
        res.json({
            ...status,
            projectId
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startSimulation,
    stopSimulation,
    getStatus
};
