const express = require('express');
const router = express.Router();
const { loginAdmin, getCurrentAdmin, migrateExistingAdmins, refreshAdminToken, logoutAdmin } = require('../Controllers/adminAuthController');
const { adminAuthMiddleware, superAdminMiddleware } = require('../Controllers/authMiddleware');
const { body, validationResult } = require('express-validator');

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

// Admin login route
router.post(
	'/login',
	[
		body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
		body('password').notEmpty().withMessage('Password is required')
	],
	validateRequest,
	loginAdmin
);

// Get current admin route
router.get('/profile', adminAuthMiddleware, getCurrentAdmin);

// Refresh access token
router.post(
	'/refresh',
	[body('refreshToken').notEmpty().withMessage('Refresh token is required')],
	validateRequest,
	refreshAdminToken
);

// Logout admin and revoke refresh token
router.post(
	'/logout',
	[body('refreshToken').optional().isString()],
	validateRequest,
	logoutAdmin
);

// Migrate existing admin users (only accessible by super admin)
router.post('/migrate', adminAuthMiddleware, superAdminMiddleware, migrateExistingAdmins);

module.exports = router;
