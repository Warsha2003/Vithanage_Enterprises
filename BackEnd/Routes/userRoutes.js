const express = require('express');
const router = express.Router();
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers
} = require('../Controllers/userController');

// All routes require admin authentication
// GET /api/users - Get all users with optional search
router.get('/', adminAuthMiddleware, searchUsers);

// GET /api/users/:id - Get single user by ID
router.get('/:id', adminAuthMiddleware, getUserById);

// POST /api/users - Create new user
router.post('/', adminAuthMiddleware, createUser);

// PUT /api/users/:id - Update user
router.put('/:id', adminAuthMiddleware, updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', adminAuthMiddleware, deleteUser);

module.exports = router;