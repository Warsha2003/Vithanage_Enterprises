// File path: BackEnd/Routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Admin = require('../Models/Admin');
const Order = require('../Models/Order');
const AuditLog = require('../Models/AuditLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { stringify } = require('csv-stringify/sync');
const { body, validationResult } = require('express-validator');
const { authMiddleware, adminAuthMiddleware, superAdminMiddleware } = require('../Controllers/authMiddleware');
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
const JWT_SECRET = process.env.JWT_SECRET || 'vithanage_enterprises_secret';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({ field: error.path, message: error.msg }))
    });
  }
  next();
};

const recordAudit = async (req, action, entityType, entityId, description, details = {}) => {
  try {
    await AuditLog.create({
      actorType: req.admin ? 'admin' : 'system',
      actorId: req.admin?.id || null,
      actorModel: req.admin ? 'Admin' : null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      description,
      details,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    });
  } catch (error) {
    console.warn('Audit log write failed:', error.message);
  }
};

// Create admin user (this should be protected in production)
router.post(
  '/create-admin',
  adminAuthMiddleware,
  superAdminMiddleware,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'super_admin']).withMessage('Invalid role')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, email, password, role = 'admin' } = req.body;

      let existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin already exists' });
      }

      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by a regular user' });
      }

      const admin = new Admin({
        name,
        email,
        password,
        role
      });

      await admin.save();
  await recordAudit(req, 'admin.create', 'Admin', admin._id, 'Created admin account', { email, role });
      res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all users (admin only)
router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin profile
router.put(
  '/profile',
  adminAuthMiddleware,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').optional().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('currentPassword').optional().isString(),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const admin = await Admin.findById(req.admin.id);

      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      if (email !== admin.email) {
        const existingAdmin = await Admin.findOne({ email });
        const existingUser = await User.findOne({ email });
        if (existingAdmin || existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      admin.name = name || admin.name;
      admin.email = email || admin.email;

      if (newPassword) {
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        admin.password = newPassword;
      }

      await admin.save();

      const payload = {
        admin: {
          id: admin.id,
          role: admin.role
        }
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }, async (err, token) => {
        if (err) throw err;
        await recordAudit(req, 'admin.profile_update', 'Admin', admin.id, 'Updated admin profile', { name, email });
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
  }
);

// Get dashboard stats
router.get('/dashboard-stats', adminAuthMiddleware, getDashboardStats);

// Admin CRUD management (admin only)
router.get('/admin-management', adminAuthMiddleware, searchAdmins);
router.get('/admin-management/:id', adminAuthMiddleware, getAdminById);
router.post('/admin-management', adminAuthMiddleware, superAdminMiddleware, createAdmin);
router.put('/admin-management/:id', adminAuthMiddleware, superAdminMiddleware, updateAdmin);
router.delete('/admin-management/:id', adminAuthMiddleware, superAdminMiddleware, deleteAdmin);

router.get('/orders/export/csv', adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email phone').lean();
    const csv = stringify(orders.map(order => ({
      _id: order._id,
      userName: order.user?.name || '',
      userEmail: order.user?.email || '',
      userPhone: order.user?.phone || '',
      status: order.status,
      total: order.totals?.total || 0,
      subtotal: order.totals?.subtotal || 0,
      discount: order.totals?.discount || 0,
      shipping: order.totals?.shipping || 0,
      processingStep: order.processing?.step || 'none',
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt || '',
      cancelledAt: order.cancelledAt || ''
    })), { header: true });

    await recordAudit(req, 'order.export_csv', 'Order', 'bulk', 'Exported orders to CSV', { count: orders.length });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export orders CSV error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders management (admin)
router.get('/orders', adminAuthMiddleware, adminGetAllOrders);
router.put('/orders/:id/status', adminAuthMiddleware, adminUpdateOrderStatus);
router.put('/orders/:id/processing', adminAuthMiddleware, adminUpdateProcessing);

module.exports = router;
