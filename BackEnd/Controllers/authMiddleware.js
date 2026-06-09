const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'vithanage_enterprises_secret'; // In production, use environment variables

// Authentication middleware for regular users
const authMiddleware = (req, res, next) => {
  // Get token from header - check both x-auth-token and Authorization Bearer
  const authHeader = req.header('Authorization');
  const xAuthToken = req.header('x-auth-token');
  
  let token = xAuthToken; // First check x-auth-token (for compatibility)
  if (!token && authHeader) {
    token = authHeader.split(' ')[1]; // Then check Bearer token
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's a user token
    if (decoded.user) {
      req.user = decoded.user;
      return next();
    }
    
    // Check if it's an admin token
    if (decoded.admin) {
      req.admin = decoded.admin;
      // Admins can access user routes
      return next();
    }
    
    return res.status(401).json({ message: 'Invalid token structure' });
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin authentication middleware
const adminAuthMiddleware = (req, res, next) => {
  // Get token from header - check both x-auth-token and Authorization Bearer
  const authHeader = req.header('Authorization');
  const xAuthToken = req.header('x-auth-token');
  
  let token = xAuthToken; // First check x-auth-token (for compatibility)
  if (!token && authHeader) {
    token = authHeader.split(' ')[1]; // Then check Bearer token
  }

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