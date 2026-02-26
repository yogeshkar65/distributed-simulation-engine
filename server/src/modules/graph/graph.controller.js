const Node = require("./node.model");
const Edge = require("./edge.model");
const Project = require("../project/project.model");
const { getRedis } = require("../../config/redis");

// @desc    Create a new node
// @route   POST /api/graph/nodes
const createNode = async (req, res, next) => {
    try {
        const { projectId, name, type, resourceValue, maxCapacity, failureThreshold } = req.body;
        const nameNormalized = name.trim().toLowerCase();

        // Validate project existence and ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to modify this project" });
        }

        // Check for unique name in project (Normalized)
        const existingNode = await Node.findOne({ projectId, nameNormalized });
        if (existingNode) {
            return res.status(400).json({ message: "Node name must be unique within the project." });
        }

        const node = await Node.create({
            projectId,
            name,
            nameNormalized,
            type,
            resourceValue,
            maxCapacity,
            failureThreshold,
        });

        res.status(201).json(node);
    } catch (error) {
        next(error);
    }
};

// @desc    Get graph (nodes and edges) for a project
// @route   GET /api/graph/:projectId
const getGraphByProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Validate project existence and ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view this graph" });
        }

        const nodes = await Node.find({ projectId });
        const edges = await Edge.find({ projectId });

        res.json({ nodes, edges });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a node and its connected edges
// @route   DELETE /api/graph/nodes/:nodeId
const deleteNode = async (req, res, next) => {
    try {
        const { nodeId } = req.params;

        const node = await Node.findById(nodeId);
        if (!node) {
            return res.status(404).json({ message: "Node not found" });
        }

        // Validate project ownership
        const project = await Project.findById(node.projectId);
        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to modify this graph" });
        }

        // Delete the node
        await Node.findByIdAndDelete(nodeId);

        // Cascade delete edges
        await Edge.deleteMany({
            $or: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
        });

        res.json({ message: "Node and connected edges deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new directed weighted edge
// @route   POST /api/graph/edges
const createEdge = async (req, res, next) => {
    try {
        const { projectId, sourceNodeId, targetNodeId, weight } = req.body;

        // Validate self-loop
        if (sourceNodeId === targetNodeId) {
            return res.status(400).json({ message: "Self-loops are not allowed" });
        }

        // Validate project existence and ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to modify this project" });
        }

        // Validate both nodes exist and belong to the same project
        const [sourceNode, targetNode] = await Promise.all([
            Node.findById(sourceNodeId),
            Node.findById(targetNodeId),
        ]);

        if (!sourceNode || !targetNode) {
            return res.status(404).json({ message: "One or both nodes not found" });
        }

        if (sourceNode.projectId.toString() !== projectId || targetNode.projectId.toString() !== projectId) {
            return res.status(400).json({ message: "Nodes must belong to the same project" });
        }

        // Check if edge already exists
        const existingEdge = await Edge.findOne({ projectId, sourceNodeId, targetNodeId });
        if (existingEdge) {
            return res.status(400).json({ message: "Edge already exists" });
        }

        const edge = await Edge.create({
            projectId,
            sourceNodeId,
            targetNodeId,
            weight,
        });

        res.status(201).json(edge);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an edge
// @route   DELETE /api/graph/edges/:edgeId
const deleteEdge = async (req, res, next) => {
    try {
        const { edgeId } = req.params;

        const edge = await Edge.findById(edgeId);
        if (!edge) {
            return res.status(404).json({ message: "Edge not found" });
        }

        // Validate project ownership
        const project = await Project.findById(edge.projectId);
        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to modify this graph" });
        }

        await Edge.findByIdAndDelete(edgeId);

        res.json({ message: "Edge deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a node
// @route   PUT /api/graph/nodes/:nodeId
const updateNode = async (req, res, next) => {
    try {
        const { nodeId } = req.params;
        const { name, resourceValue, maxCapacity, failureThreshold } = req.body;
        const nameNormalized = name.trim().toLowerCase();

        // 1. Validation
        if (!name) return res.status(400).json({ message: "Node name is required" });
        if (resourceValue < 0) return res.status(400).json({ message: "Resource value cannot be negative" });
        if (failureThreshold < 0) return res.status(400).json({ message: "Failure threshold cannot be negative" });
        if (maxCapacity < failureThreshold) return res.status(400).json({ message: "Max capacity cannot be less than failure threshold" });

        // 2. Fetch node to get projectId (Atomic Protection)
        const node = await Node.findById(nodeId);
        if (!node) return res.status(404).json({ message: "Node not found" });

        const projectId = node.projectId.toString();

        // 3. Authorization Check
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to modify this project" });
        }

        // 4. Redis Active Simulation Check
        const redis = getRedis();
        const simData = await redis.get(`simulation:${projectId}`);
        if (simData) {
            const simulation = JSON.parse(simData);
            if (simulation.isRunning) {
                return res.status(400).json({ message: "Cannot edit nodes while simulation is running." });
            }
        }

        // 5. Duplicate Name Check (Normalized)
        const existingNode = await Node.findOne({ projectId, nameNormalized, _id: { $ne: nodeId } });
        if (existingNode) {
            return res.status(400).json({ message: "Node name must be unique within the project." });
        }

        // 6. Perform Update
        const updatedNode = await Node.findByIdAndUpdate(
            nodeId,
            { name, nameNormalized, resourceValue, maxCapacity, failureThreshold },
            { new: true, runValidators: true }
        );

        res.json(updatedNode);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createNode,
    getGraphByProject,
    deleteNode,
    createEdge,
    deleteEdge,
    updateNode,
};
