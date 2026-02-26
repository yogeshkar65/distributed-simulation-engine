const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(", ") });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate field value entered" });
    }

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid ID format" });
    }

    res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error",
    });
};

module.exports = errorHandler;
