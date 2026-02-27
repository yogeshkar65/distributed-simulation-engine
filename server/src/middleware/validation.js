const { body, param, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

const validateRegister = [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/)
        .withMessage('Password must be 8+ chars with uppercase and number'),
    handleValidation,
];

const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation,
];

const validateProject = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 chars'),
    body('description').optional().trim().isLength({ max: 500 }),
    handleValidation,
];

const validateNode = [
    body('label').trim().isLength({ min: 1, max: 100 }).withMessage('Node label required'),
    body('type').isIn(['service', 'database', 'api', 'queue', 'cache']).withMessage('Invalid node type'),
    body('failureThreshold').isFloat({ min: 0, max: 1 }).withMessage('Threshold must be 0-1'),
    handleValidation,
];

const validateObjectId = (field) => [
    param(field).isMongoId().withMessage(`Invalid ${field}`),
    handleValidation,
];

module.exports = { validateRegister, validateLogin, validateProject, validateNode, validateObjectId };
