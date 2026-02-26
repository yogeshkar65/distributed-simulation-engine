const SimulationHistory = require("./simulationHistory.model");
const Project = require("../project/project.model");

// @desc    Get simulation history for a project
// @route   GET /api/simulation-history/:projectId
const getHistory = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Validate project ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to access this project" });
        }

        const history = await SimulationHistory.find({ projectId })
            .sort({ tick: 1 })
            .limit(1000); // Safety limit

        res.json(history);
    } catch (error) {
        next(error);
    }
};

// @desc    Get latest simulation tick
// @route   GET /api/simulation-history/:projectId/latest
const getLatestTick = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to access this project" });
        }

        const latest = await SimulationHistory.findOne({ projectId })
            .sort({ tick: -1 });

        res.json(latest);
    } catch (error) {
        next(error);
    }
};

// @desc    Clear simulation history
// @route   DELETE /api/simulation-history/:projectId
const clearHistory = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to access this project" });
        }

        await SimulationHistory.deleteMany({ projectId });
        res.json({ message: "Simulation history cleared" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHistory,
    getLatestTick,
    clearHistory
};
