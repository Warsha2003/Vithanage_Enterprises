const express = require('express');
const router = express.Router();
const { loginAdmin, getCurrentAdmin, migrateExistingAdmins } = require('../Controllers/adminAuthController');
const { adminAuthMiddleware, superAdminMiddleware } = require('../Controllers/authMiddleware');

// Admin login route
router.post('/login', loginAdmin);

// Get current admin route
router.get('/profile', adminAuthMiddleware, getCurrentAdmin);

// Migrate existing admin users (only accessible by super admin)
router.post('/migrate', adminAuthMiddleware, superAdminMiddleware, migrateExistingAdmins);

module.exports = router;
