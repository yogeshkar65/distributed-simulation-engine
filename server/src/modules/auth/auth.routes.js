const express = require("express");
const { register, login, getMe } = require("./auth.controller");
const authMiddleware = require("./auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

module.exports = router;
