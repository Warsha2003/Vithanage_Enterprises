const User = require('../Models/User');
const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret'; // In production, use environment variables

// Register user
const register = async (req, res) => {
  try {
    console.log('Registration attempt received:', req.body);
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists (in both User and Admin collections)
    let user = await User.findOne({ email });
    let admin = await Admin.findOne({ email });
    
    if (user || admin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password, // password hashing is handled by the model's pre-save hook
      phone,
      address
    });

    await user.save();
    console.log('User saved successfully:', user.email);

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        isAdmin: false
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      console.log('Registration successful, sending response');
      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: false
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log("Login attempt received:", req.body);
    const { email, password } = req.body;

    // First check if it's a regular user
    const user = await User.findOne({ email });
    if (user) {
      console.log(`Regular user found: ${user.email}`);
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log("Password does not match for regular user");
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log("Password matches for regular user");
      
      // Create JWT token
      const payload = {
        user: {
          id: user.id,
          isAdmin: false
        }
      };
      
      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) {
          console.error("JWT Sign error:", err);
          throw err;
        }
        console.log("Regular user login successful, sending response");
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: false
          }
        });
      });
      
      return;
    }
    
    // If not a regular user, check if it's an admin
    const admin = await Admin.findOne({ email });
    if (admin) {
      console.log(`Admin found: ${admin.email}, role: ${admin.role}`);
      
      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        console.log("Password does not match for admin");
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log("Password matches for admin");
      
      // Create JWT token for admin
      const payload = {
        admin: {
          id: admin.id,
          role: admin.role
        }
      };
      
      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) {
          console.error("JWT Sign error:", err);
          throw err;
        }
        console.log("Admin login successful, sending response");
        res.json({ 
          token,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            isAdmin: true,
            role: admin.role
          }
        });
      });
      
      return;
    }
    
    // If user not found in either collection
    console.log(`User not found with email: ${email}`);
    return res.status(400).json({ message: 'Invalid credentials' });
    
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    // Check if it's a regular user request
    if (req.user) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({
        ...user._doc,
        isAdmin: false
      });
    }
    
    // Check if it's an admin request
    if (req.admin) {
      const admin = await Admin.findById(req.admin.id).select('-password');
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      return res.json({
        ...admin._doc,
        isAdmin: true
      });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    console.log('Profile update attempt received:', req.body);
    const { name, email, phone, address, city, postalCode, country } = req.body;

    // Check if it's a regular user request
    if (req.user) {
      // Check if email is being changed and if it already exists
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
        const existingAdmin = await Admin.findOne({ email });
        
        if (existingUser || existingAdmin) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { 
          name, 
          email, 
          phone, 
          address, 
          city, 
          postalCode, 
          country,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User profile updated successfully:', updatedUser.email);
      return res.json({ 
        message: 'Profile updated successfully',
        user: {
          ...updatedUser._doc,
          isAdmin: false
        }
      });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    console.log('Password change attempt received');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Check if it's a regular user request
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password (hashing will be handled by the model's pre-save hook)
      user.password = newPassword;
      user.updatedAt = new Date();
      await user.save();

      console.log('User password changed successfully:', user.email);
      return res.json({ message: 'Password changed successfully' });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { register, login, getCurrentUser, updateProfile, changePassword };