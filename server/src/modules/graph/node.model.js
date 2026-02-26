const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    name: {
        type: String,
        required: [true, "Node name is required"],
        trim: true,
    },
    nameNormalized: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        default: "generic",
    },
    resourceValue: {
        type: Number,
        default: 100,
    },
    maxCapacity: {
        type: Number,
        default: 100,
    },
    failureThreshold: {
        type: Number,
        default: 20,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

nodeSchema.index({ projectId: 1 });

module.exports = mongoose.model("Node", nodeSchema);
