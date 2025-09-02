const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret'; // In production, use environment variables

// Authentication middleware for regular users
const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');

  // Check if no token
  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    console.log('Auth middleware - Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - Token verified, payload:', JSON.stringify(decoded));
    
    // Check if it's a user token
    if (decoded.user) {
      console.log('Auth middleware - User token valid for ID:', decoded.user.id);
      req.user = decoded.user;
      return next();
    }
    
    // Check if it's an admin token
    if (decoded.admin) {
      console.log('Auth middleware - Admin token valid for ID:', decoded.admin.id);
      req.admin = decoded.admin;
      // Admins can access user routes
      return next();
    }
    
    console.log('Auth middleware - Invalid token structure');
    return res.status(401).json({ message: 'Invalid token structure' });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

// Admin authentication middleware
const adminAuthMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.admin) {
      req.admin = decoded.admin;
      return next();
    }
    
    // If it's a user token, deny access
    if (decoded.user) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    return res.status(401).json({ message: 'Invalid token structure' });
  } catch (error) {
    console.error('Admin token verification error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Super admin middleware (check for super_admin role)
const superAdminMiddleware = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

module.exports = { 
  authMiddleware,       // For general user authentication 
  adminAuthMiddleware,  // For admin authentication
  superAdminMiddleware  // For super admin authorization (after adminAuthMiddleware)
};