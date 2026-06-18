const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Input validation rules for user registration
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Input validation rules for user login
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// POST /api/auth/register → hash password, save user, return JWT
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login → verify credentials, return JWT
router.post('/login', loginValidation, authController.login);

// GET /api/auth/me → protected route, return current user profile from JWT
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
