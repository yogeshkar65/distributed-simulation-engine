const express = require("express");
const { getHistory, getLatestTick, clearHistory } = require("./simulationHistory.controller");
const authMiddleware = require("../auth/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:projectId", getHistory);
router.get("/:projectId/latest", getLatestTick);
router.delete("/:projectId", clearHistory);

module.exports = router;
