const express = require("express");
const {
    createNode,
    getGraphByProject,
    deleteNode,
    createEdge,
    deleteEdge,
    updateNode,
} = require("./graph.controller");
const authMiddleware = require("../auth/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/nodes", createNode);
router.get("/:projectId", getGraphByProject);
router.delete("/nodes/:nodeId", deleteNode);
router.put("/nodes/:nodeId", updateNode);
router.post("/edges", createEdge);
router.delete("/edges/:edgeId", deleteEdge);

module.exports = router;
