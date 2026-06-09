const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'vithanage_enterprises_secret'; // In production, use environment variables
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}_refresh`;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '24h';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueTokens = (admin) => {
  const accessToken = jwt.sign(
    { admin: { id: admin.id, role: admin.role } },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { type: 'admin', id: admin.id, role: admin.role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );

  return { accessToken, refreshToken };
};

// Login admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = issueTokens(admin);
    admin.refreshTokenHash = hashToken(refreshToken);
    admin.refreshTokenExpiresAt = jwt.decode(refreshToken)?.exp ? new Date(jwt.decode(refreshToken).exp * 1000) : undefined;
    await admin.save();

    res.json({ 
      token: accessToken,
      refreshToken,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isAdmin: true,
        role: admin.role
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get current admin
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json({
      ...admin._doc,
      isAdmin: true
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create initial admin if none exists
const createInitialAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('No admins found. Creating initial admin user...');
      
      const newAdmin = new Admin({
        name: 'Super Admin',
        email: 'admin@vithanage.com',
        password: 'admin123',
        role: 'super_admin'
      });
      
      await newAdmin.save();
      console.log('Initial admin created with email: admin@vithanage.com and password: admin123');
    }
  } catch (error) {
    console.error('Error creating initial admin:', error.message);
  }
};

// Migrate existing admin users
const migrateExistingAdmins = async (req, res) => {
  try {
    const User = require('../Models/User');
    
    // Find all users with isAdmin: true
    const adminUsers = await User.find({ isAdmin: true });
    
    if (adminUsers.length === 0) {
      return res.status(200).json({ message: 'No admin users to migrate' });
    }
    
    // Create new admin records
    for (const user of adminUsers) {
      const existingAdmin = await Admin.findOne({ email: user.email });
      
      if (!existingAdmin) {
        const newAdmin = new Admin({
          name: user.name,
          email: user.email,
          password: user.password,
          role: 'admin',
          createdAt: user.createdAt
        });
        
        // Save without rehashing the password
        newAdmin.password = user.password;
        await newAdmin.save({ validateBeforeSave: false });
        
        console.log(`Migrated admin: ${user.email}`);
      }
    }
    
    res.status(200).json({ 
      message: `Successfully migrated ${adminUsers.length} admin users`,
      migrated: adminUsers.map(user => user.email)
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Server Error during migration' });
  }
};

// Refresh admin access token using a refresh token
const refreshAdminToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (decoded.type !== 'admin') {
      return res.status(403).json({ message: 'Invalid refresh token type' });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.refreshTokenHash || admin.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (admin.refreshTokenExpiresAt && admin.refreshTokenExpiresAt.getTime() < Date.now()) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const accessToken = jwt.sign(
      { admin: { id: admin.id, role: admin.role } },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    res.json({
      token: accessToken,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isAdmin: true,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin refresh token error:', error.message);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout admin by revoking refresh token
const logoutAdmin = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(200).json({ message: 'Logged out' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (decoded.type !== 'admin') {
      return res.status(200).json({ message: 'Logged out' });
    }

    const admin = await Admin.findById(decoded.id);
    if (admin) {
      admin.refreshTokenHash = undefined;
      admin.refreshTokenExpiresAt = undefined;
      await admin.save();
    }

    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(200).json({ message: 'Logged out' });
  }
};

module.exports = { 
  loginAdmin, 
  getCurrentAdmin, 
  createInitialAdmin,
  migrateExistingAdmins,
  refreshAdminToken,
  logoutAdmin
};
