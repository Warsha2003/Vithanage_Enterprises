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

module.exports = { getAllUsers, updateAdminProfile, getDashboardStats };
