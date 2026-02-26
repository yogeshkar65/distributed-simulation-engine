const User = require("../auth/user.model");
const Project = require("../project/project.model");
const { getRedis } = require("../../config/redis");

// @desc    Get system-wide stats for admin
// @route   GET /api/admin/stats
const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProjects = await Project.countDocuments();

        // Count active simulations in Redis
        const redis = getRedis();
        const keys = await redis.keys("simulation:*");
        const activeSimulationsCount = keys.length;

        res.json({
            totalUsers,
            totalProjects,
            activeSimulationsCount
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects (admin only)
// @route   GET /api/admin/projects
const getAllProjects = async (req, res, next) => {
    try {
        const projects = await Project.find().populate("createdBy", "name email").sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a user's role
// @route   PUT /api/admin/promote/:userId
const updateUserRole = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = role;
        await user.save();

        res.json({ message: `User role updated to ${role}`, user: { _id: user._id, name: user.name, role: user.role } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    getAllProjects,
    updateUserRole
};
