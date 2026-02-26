const express = require("express");
const {
    createProject,
    getProjects,
    getProject,
    deleteProject,
} = require("./project.controller");
const authMiddleware = require("../auth/auth.middleware");

const router = express.Router();

// All project routes are protected
router.use(authMiddleware);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProject);
router.delete("/:id", deleteProject);

module.exports = router;
