const Node = require("../graph/node.model");
const Edge = require("../graph/edge.model");
const Project = require("../project/project.model");
const aiEngine = require("./ai.engine");

// @desc    Predict system risk before simulation
// @route   POST /api/ai/predict-risk
const predictRisk = async (req, res, next) => {
    try {
        const { projectId } = req.body;

        // Validate project ownership or admin role
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const nodes = await Node.find({ projectId });
        const edges = await Edge.find({ projectId });

        const analysis = aiEngine.predictRisk(nodes, edges);
        res.json(analysis);
    } catch (error) {
        next(error);
    }
};

// @desc    Analyze simulation results after cascade
// @route   POST /api/ai/analyze-simulation
const analyzeSimulation = async (req, res, next) => {
    try {
        const { projectId, failedNodeIds, cascadeDepth } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const nodes = await Node.find({ projectId });
        const edges = await Edge.find({ projectId });

        const results = aiEngine.analyzeSimulation(nodes, edges, failedNodeIds, cascadeDepth);
        res.json(results);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    predictRisk,
    analyzeSimulation
};
