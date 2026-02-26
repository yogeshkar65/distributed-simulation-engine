const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Project name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    simulationStatus: {
        type: String,
        enum: ["running", "stopped"],
        default: "stopped",
    },
});

// Update the updatedAt field before each save
projectSchema.pre("save", function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model("Project", projectSchema);
