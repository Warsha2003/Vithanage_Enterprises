const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile, changePassword } = require('../Controllers/authController');
const { authMiddleware } = require('../Controllers/authMiddleware');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Get current user route
router.get('/user', authMiddleware, getCurrentUser);

// Get user profile
router.get('/profile', authMiddleware, getCurrentUser);

// Update user profile
router.put('/profile', authMiddleware, updateProfile);

// Change password
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;