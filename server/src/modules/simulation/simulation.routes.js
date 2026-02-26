const express = require("express");
const { startSimulation, stopSimulation, getStatus } = require("./simulation.controller");
const authMiddleware = require("../auth/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/start/:projectId", startSimulation);
router.post("/stop/:projectId", stopSimulation);
router.get("/status/:projectId", getStatus);

module.exports = router;
