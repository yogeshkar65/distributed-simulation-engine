const express = require("express");
const { getStats, getUsers, getAllProjects, updateUserRole } = require("./admin.controller");
const authMiddleware = require("../auth/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

// All admin routes are protected and require admin role
router.use(authMiddleware);
router.use(requireAdmin);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/projects", getAllProjects);
router.put("/promote/:userId", updateUserRole);

module.exports = router;
