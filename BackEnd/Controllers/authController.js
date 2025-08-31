const User = require('../Models/User');
const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret'; // In production, use environment variables

// Register user
const register = async (req, res) => {
  try {
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

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        isAdmin: false
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
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
      
      jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
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
      
      jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
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

module.exports = { register, login, getCurrentUser };