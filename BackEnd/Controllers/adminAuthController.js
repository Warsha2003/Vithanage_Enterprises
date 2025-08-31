const Admin = require('../Models/Admin');
const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = 'vithanage_enterprises_secret'; // In production, use environment variables

// Login admin
const loginAdmin = async (req, res) => {
  try {
    console.log("Admin login attempt received:", req.body);
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`Admin not found: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log(`Admin found: ${admin.email}, role: ${admin.role}`);

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log("Password matches");

    // Create JWT token
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

module.exports = { 
  loginAdmin, 
  getCurrentAdmin, 
  createInitialAdmin,
  migrateExistingAdmins
};
