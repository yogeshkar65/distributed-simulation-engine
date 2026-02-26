const express = require("express");
const router = express.Router();
const { predictRisk, analyzeSimulation } = require("./ai.controller");
const authMiddleware = require("../auth/auth.middleware");

router.post("/predict-risk", authMiddleware, predictRisk);
router.post("/analyze-simulation", authMiddleware, analyzeSimulation);

module.exports = router;
