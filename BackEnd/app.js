//V2ft5D1dbTssVJzR

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./Routes/authRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const adminAuthRoutes = require('./Routes/adminAuthRoutes');
const productRoutes = require('./Routes/productRoutes');
const cartRoutes = require('./Routes/cartRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const userRoutes = require('./Routes/userRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');
const adminReviewRoutes = require('./Routes/adminReviewRoutes');
const refundRoutes = require('./Routes/refundRoutes');
const adminRefundRoutes = require('./Routes/adminRefundRoutes');
const inventoryRoutes = require('./Routes/inventoryRoutes');
const promotionRoutes = require('./Routes/promotionRoutes');
const { createInitialAdmin } = require('./Controllers/adminAuthController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Vithanage Enterprises API is working');
});

// Sample data creation endpoint (for testing)
app.post('/api/create-sample-data', async (req, res) => {
  try {
    const { sampleProducts, sampleUsers } = require('./data/sampleProducts');
    const Product = require('./Models/Product');
    const User = require('./Models/User');
    
    // Clear existing data (optional - remove in production)
    await Product.deleteMany({});
    await User.deleteMany({ isAdmin: { $ne: true } }); // Don't delete admins
    
    // Create sample products
    const createdProducts = await Product.insertMany(sampleProducts);
    
    // Create sample users
    const createdUsers = await User.insertMany(sampleUsers);
    
    res.json({
      message: 'Sample data created successfully',
      products: createdProducts.length,
      users: createdUsers.length
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ message: 'Error creating sample data', error: error.message });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);
// Admin routes
app.use('/api/admin', adminRoutes);
// Admin Auth routes
app.use('/api/admin-auth', adminAuthRoutes);
// Product routes
app.use('/api/products', productRoutes);
// Cart routes
app.use('/api/cart', cartRoutes);
// Order routes
app.use('/api/orders', orderRoutes);
// User management routes
app.use('/api/users', userRoutes);
// Review routes
app.use('/api/reviews', reviewRoutes);
// Admin review routes
app.use('/api/admin/reviews', adminReviewRoutes);
// Refund routes
app.use('/api/refunds', refundRoutes);
// Admin refund routes
app.use('/api/admin/refunds', adminRefundRoutes);
// Inventory routes
app.use('/api/admin/inventory', inventoryRoutes);
// Promotion routes
app.use('/api/promotions', promotionRoutes);

mongoose.connect("mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/test")
.then(()=> {
    console.log("Connected to MongoDB");
    
    // Create initial admin if none exists
    createInitialAdmin();
})
.then(()=>{
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log('Port 5000 is already in use. The server is probably already running.');
      } else {
        console.error('Server error:', error);
      }
    });
})
.catch((err)=> console.log(err));