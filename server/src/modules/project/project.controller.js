const Project = require("./project.model");

// @desc    Create a new project
// @route   POST /api/projects
const createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const project = await Project.create({
            name,
            description,
            createdBy: req.user.id,
        });

        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects for logged-in user
// @route   GET /api/projects
const getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({ createdBy: req.user.id }).sort({
            createdAt: -1,
        });
        res.json(projects);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
const getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Allow owner OR admin
        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view this project" });
        }

        res.json(project);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Allow delete if owner OR admin
        if (project.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to delete this project" });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { createProject, getProjects, getProject, deleteProject };
