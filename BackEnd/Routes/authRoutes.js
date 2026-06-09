const express = require('express');
const router = express.Router();
const {
	register,
	login,
	getCurrentUser,
	updateProfile,
	changePassword,
	getSavedAddresses,
	saveAddress,
	updateSavedAddress,
	deleteSavedAddress,
	setDefaultAddress,
	getSavedPaymentMethods,
	savePaymentMethod,
	updatePaymentMethod,
	deletePaymentMethod,
	setDefaultPaymentMethod,
	forgotPassword,
	resetPassword,
	refreshToken,
	logout
} = require('../Controllers/authController');
const { authMiddleware } = require('../Controllers/authMiddleware');
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

// Register route
router.post(
	'/register',
	[
		body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
		body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
		body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
		body('phone').optional({ nullable: true, checkFalsy: true }).isMobilePhone('any').withMessage('Please enter a valid phone number'),
		body('address').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 255 }).withMessage('Address is too long')
	],
	validateRequest,
	register
);

// Login route
router.post(
	'/login',
	[
		body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
		body('password').notEmpty().withMessage('Password is required')
	],
	validateRequest,
	login
);

// Get current user route
router.get('/user', authMiddleware, getCurrentUser);

// Get user profile
router.get('/profile', authMiddleware, getCurrentUser);

// Update user profile
router.put(
	'/profile',
	authMiddleware,
	[
		body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
		body('email').optional().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
		body('phone').optional({ nullable: true, checkFalsy: true }).isMobilePhone('any').withMessage('Please enter a valid phone number'),
		body('address').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 255 }).withMessage('Address is too long'),
		body('city').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('City is too long'),
		body('postalCode').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 20 }).withMessage('Postal code is too long'),
		body('country').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 100 }).withMessage('Country is too long')
	],
	validateRequest,
	updateProfile
);

// Saved addresses
router.get('/addresses', authMiddleware, getSavedAddresses);
router.post(
	'/addresses',
	authMiddleware,
	[
		body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
		body('city').trim().notEmpty().withMessage('City is required'),
		body('postalCode').trim().notEmpty().withMessage('Postal code is required')
	],
	validateRequest,
	saveAddress
);
router.put('/addresses/:addressId', authMiddleware, updateSavedAddress);
router.delete('/addresses/:addressId', authMiddleware, deleteSavedAddress);
router.put('/addresses/:addressId/default', authMiddleware, setDefaultAddress);

// Saved payment methods
router.get('/payment-methods', authMiddleware, getSavedPaymentMethods);
router.post('/payment-methods', authMiddleware, savePaymentMethod);
router.put('/payment-methods/:methodId', authMiddleware, updatePaymentMethod);
router.delete('/payment-methods/:methodId', authMiddleware, deletePaymentMethod);
router.put('/payment-methods/:methodId/default', authMiddleware, setDefaultPaymentMethod);

// Change password
router.put(
	'/change-password',
	authMiddleware,
	[
		body('currentPassword').notEmpty().withMessage('Current password is required'),
		body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
	],
	validateRequest,
	changePassword
);

// Forgot password (request reset link)
router.post(
	'/forgot-password',
	[body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail()],
	validateRequest,
	forgotPassword
);

// Reset password with token
router.post(
	'/reset-password',
	[
		body('token').notEmpty().withMessage('Reset token is required'),
		body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
	],
	validateRequest,
	resetPassword
);

// Refresh access token
router.post(
	'/refresh',
	[body('refreshToken').notEmpty().withMessage('Refresh token is required')],
	validateRequest,
	refreshToken
);

// Logout and revoke refresh token
router.post(
	'/logout',
	[body('refreshToken').optional().isString()],
	validateRequest,
	logout
);

module.exports = router;