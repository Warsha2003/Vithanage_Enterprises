const User = require('../Models/User');
const Admin = require('../Models/Admin');
const Product = require('../Models/Product');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret'; // In production, use environment variables

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    // Ensure the requesting user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  try {
    // Ensure the requesting user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { name, email, currentPassword, newPassword } = req.body;

    // Find the admin user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is unique (if changing email)
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update basic info
    user.name = name || user.name;
    user.email = email || user.email;

    // Update password if provided
    if (newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Create new JWT token with updated user info
    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        message: 'Profile updated successfully'
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get dashboard stats with real counts
const getDashboardStats = async (req, res) => {
  try {
    // Count regular users
    const userCount = await User.countDocuments();
    
    // Count admins
    const adminCount = await Admin.countDocuments();
    
    // Count products
    const productCount = await Product.countDocuments();
    
    // Total users (regular + admin)
    const totalUsers = userCount + adminCount;
    
    console.log('Dashboard stats:', {
      totalUsers,
      regularUsers: userCount,
      adminUsers: adminCount,
      totalProducts: productCount
    });
    
    // You can add more stats here (e.g., orders, revenue)
    
    res.json({
      totalUsers: totalUsers,
      regularUsers: userCount,
      adminUsers: adminCount,
      totalProducts: productCount,
      totalOrders: 56, // Placeholder - replace with real data when you have Orders model
      totalRevenue: 12750.75, // Placeholder - replace with real data when you have Orders model
      pendingOrders: 8, // Placeholder
      lowStockItems: 5 // Placeholder
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin CRUD functions
// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('Get all admins error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get single admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Get admin by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create new admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Create new admin (password will be hashed by pre-save hook)
    const admin = new Admin({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: role || 'admin'
    });

    await admin.save();

    // Return admin without password
    res.status(201).json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      },
      message: 'Admin created successfully'
    });
  } catch (error) {
    console.error('Create admin error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    // Find admin
    let admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
    }

    // Check if email is unique (if changing email)
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role && ['admin', 'super_admin'].includes(role)) admin.role = role;

    // Update password if provided (will be hashed by pre-save hook)
    if (password) {
      admin.password = password;
    }

    await admin.save();

    // Return admin without password
    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: Date.now()
      },
      message: 'Admin updated successfully'
    });
  } catch (error) {
    console.error('Update admin error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent admin from deleting themselves (assuming req.admin contains current admin info)
    if (req.admin && admin._id.toString() === req.admin.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Admin deleted successfully',
      deletedAdmin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Delete admin error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Search admins
const searchAdmins = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return getAllAdmins(req, res);
    }

    const searchRegex = new RegExp(query, 'i'); // case insensitive search
    
    const admins = await Admin.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { role: searchRegex }
      ]
    }).select('-password').sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    console.error('Search admins error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { 
  getAllUsers, 
  updateAdminProfile, 
  getDashboardStats,
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  searchAdmins
};
