const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const User = require('../Models/User');
const Admin = require('../Models/Admin');

// MongoDB connection string
const MONGO_URI = "mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/";

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users with isAdmin: true
    const adminUsers = await User.find({ isAdmin: true });
    console.log(`Found ${adminUsers.length} admin users to migrate`);

    // Migrate each admin user
    const migratedAdmins = [];
    for (const user of adminUsers) {
      console.log(`Processing user: ${user.email}`);
      
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email: user.email });
      if (existingAdmin) {
        console.log(`Admin ${user.email} already exists, skipping`);
        continue;
      }

      // Create new admin
      const newAdmin = new Admin({
        name: user.name,
        email: user.email,
        password: user.password, // This is already hashed from the User model
        role: 'admin',
        createdAt: user.createdAt || new Date()
      });

      // Save without rehashing the password
      newAdmin.password = user.password;
      await newAdmin.save({ validateBeforeSave: false });
      
      migratedAdmins.push({
        id: newAdmin._id,
        email: newAdmin.email,
        name: newAdmin.name
      });
      
      console.log(`Migrated ${user.email} to Admin collection`);
    }

    // Save migration log
    const logData = {
      timestamp: new Date(),
      migrated: migratedAdmins,
      count: migratedAdmins.length
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'migration_log.json'),
      JSON.stringify(logData, null, 2)
    );

    console.log(`Migration complete. ${migratedAdmins.length} admins migrated.`);
    console.log('Migration log saved to migration_log.json');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();
