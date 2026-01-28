//V2ft5D1dbTssVJzR

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
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
const chatRoutes = require('./Routes/chatRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const emailCampaignRoutes = require('./Routes/emailCampaignRoutes');
const { createInitialAdmin } = require('./Controllers/adminAuthController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

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
// Supplier routes
const supplierRoutes = require('./Routes/supplierRoutes');
app.use('/api/suppliers', supplierRoutes);
// Best sellers routes
const bestSellersRoutes = require('./Routes/bestSellersRoutes');
app.use('/api/best-sellers', bestSellersRoutes);
// Daily deals routes
const dailyDealRoutes = require('./Routes/dailyDealRoutes');
app.use('/api/deals', dailyDealRoutes);
// Chat routes
app.use('/api/chat', chatRoutes);
// Payment routes
app.use('/api/payments', paymentRoutes);
// Email campaign routes (admin only)
app.use('/api/email-campaigns', emailCampaignRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('send_message', (data) => {
    io.to(data.chatId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoose.connect("mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/test")
.then(()=> {
    console.log("Connected to MongoDB");
    
    // Create initial admin if none exists
    createInitialAdmin();
})
.then(()=>{
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO ready for real-time chat`);
    });
})
.catch((err)=> console.log(err));