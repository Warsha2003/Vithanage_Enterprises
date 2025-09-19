const User = require('../Models/User');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin (assuming admin check is done in middleware)
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get single user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create new user (admin only)
  const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, isAdmin } = req.body;

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      isAdmin: isAdmin || false
    });    await user.save();

    // Return user without password
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, isAdmin, password } = req.body;
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
    }

    // Check if email is unique (if changing email)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone; // Allow empty string to clear phone
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    user.updatedAt = Date.now();
    await user.save();

    // Return user without password
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves (assuming req.user contains current admin info)
    if (req.user && user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Search users (admin only)
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return getAllUsers(req, res);
    }

    const searchRegex = new RegExp(query, 'i'); // case insensitive search
    
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('-password').sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers
};