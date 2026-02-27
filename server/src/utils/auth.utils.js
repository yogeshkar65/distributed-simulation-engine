const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

const generateToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
const verifyToken = (token) => jwt.verify(token, SECRET);
const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { generateToken, verifyToken, hashPassword, comparePassword };
