const mongoose = require("mongoose");

const edgeSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    sourceNodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true,
    },
    targetNodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true,
    },
    weight: {
        type: Number,
        default: 10,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

edgeSchema.index({ projectId: 1 });
// Compund index to help prevent duplicate edges at DB level (optional but good)
edgeSchema.index(
    { projectId: 1, sourceNodeId: 1, targetNodeId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Edge", edgeSchema);
