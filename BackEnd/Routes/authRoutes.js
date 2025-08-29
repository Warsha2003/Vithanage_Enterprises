const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../Controllers/authController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Get current user route
router.get('/user', authMiddleware, getCurrentUser);

module.exports = router;