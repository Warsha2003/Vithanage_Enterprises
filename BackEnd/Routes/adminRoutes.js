// File path: BackEnd/Routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Admin = require('../Models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');
const { adminGetAllOrders, adminUpdateOrderStatus, adminUpdateProcessing } = require('../Controllers/orderController');
const { 
  getDashboardStats,
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  searchAdmins
} = require('../Controllers/adminController');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret';

// Create admin user (this should be protected in production)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;
    
    // Check if admin already exists
    let existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    
    // Check if regular user exists with this email
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by a regular user' });
    }
    
    // Create admin user
    const admin = new Admin({
      name,
      email,
      password,
      role: role
    });
    
    await admin.save();
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin profile
router.put('/profile', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    // Find the admin user
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if email is unique (if changing email)
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      const existingUser = await User.findOne({ email });
      if (existingAdmin || existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update basic info
    admin.name = name || admin.name;
    admin.email = email || admin.email;

    // Update password if provided
    if (newPassword) {
      // Verify current password
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // New password will be hashed by the pre-save hook
      admin.password = newPassword;
    }

    await admin.save();

    // Create new JWT token with updated admin info
    const payload = {
      admin: {
        id: admin.id,
        role: admin.role
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          isAdmin: true,
          role: admin.role
        },
        message: 'Profile updated successfully'
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', authMiddleware, adminAuthMiddleware, getDashboardStats);

// Admin CRUD management (admin only)
router.get('/admin-management', authMiddleware, adminAuthMiddleware, searchAdmins);
router.get('/admin-management/:id', authMiddleware, adminAuthMiddleware, getAdminById);
router.post('/admin-management', authMiddleware, adminAuthMiddleware, createAdmin);
router.put('/admin-management/:id', authMiddleware, adminAuthMiddleware, updateAdmin);
router.delete('/admin-management/:id', authMiddleware, adminAuthMiddleware, deleteAdmin);

// Orders management (admin)
router.get('/orders', authMiddleware, adminAuthMiddleware, adminGetAllOrders);
router.put('/orders/:id/status', authMiddleware, adminAuthMiddleware, adminUpdateOrderStatus);
router.put('/orders/:id/processing', authMiddleware, adminAuthMiddleware, adminUpdateProcessing);

module.exports = router;