const mongoose = require("mongoose");

const simulationHistorySchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true
    },
    tick: {
        type: Number,
        required: true
    },
    nodesState: {
        type: Object,
        required: true
    },
    analytics: {
        type: Object,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for fast retrieval of specific ticks within a project
simulationHistorySchema.index({ projectId: 1, tick: 1 });

module.exports = mongoose.model("SimulationHistory", simulationHistorySchema);
