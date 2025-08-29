const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./Models/User');

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/")
.then(async () => {
  console.log("Connected to MongoDB");
  
  try {
    // Try to find the admin
    const adminEmail = 'admin@vithanage.com';
    const admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log("Found existing admin:", admin);
      
      // Reset password to make sure it's what we expect
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Ensure admin flag is set to true
      admin.password = hashedPassword;
      admin.isAdmin = true;
      
      await admin.save();
      console.log("Admin updated successfully");
    } else {
      // Create a new admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });
      
      await newAdmin.save();
      console.log("New admin created successfully");
    }
    
    console.log("\nAdmin login details:");
    console.log("Email: admin@vithanage.com");
    console.log("Password: admin123");
    
    // Display all users
    const users = await User.find({}, 'name email isAdmin');
    console.log("\nAll users in the database:");
    console.log(users);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});
