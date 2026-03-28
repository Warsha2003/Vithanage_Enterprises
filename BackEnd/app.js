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
const { initTwilio } = require('./Services/smsService');

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);
// Social auth routes (Google/Facebook)
const socialAuthRoutes = require('./Routes/socialAuthRoutes');
app.use('/api/auth/social', socialAuthRoutes);
// Admin routes
app.use('/api/admin', adminRoutes);
// Admin Auth routes
app.use('/api/admin-auth', adminAuthRoutes);
// Product routes
app.use('/api/products', productRoutes);
// Cart routes
app.use('/api/cart', cartRoutes);
// Wishlist routes
const wishlistRoutes = require('./Routes/wishlistRoutes');
app.use('/api/wishlist', wishlistRoutes);
// Stock alert routes
const stockAlertRoutes = require('./Routes/stockAlertRoutes');
app.use('/api/stock-alerts', stockAlertRoutes);
// Product Q&A routes
const questionRoutes = require('./Routes/questionRoutes');
app.use('/api/questions', questionRoutes);
// Product Bundles routes
const bundleRoutes = require('./Routes/bundleRoutes');
app.use('/api/bundles', bundleRoutes);
// Analytics routes
const analyticsRoutes = require('./Routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);
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
// Loyalty Points routes
const loyaltyRoutes = require('./Routes/loyaltyRoutes');
app.use('/api/loyalty', loyaltyRoutes);
// Warranty routes
const warrantyRoutes = require('./Routes/warrantyRoutes');
app.use('/api/warranties', warrantyRoutes);
// Push Notification routes
const pushRoutes = require('./Routes/pushRoutes');
app.use('/api/push', pushRoutes);

// 404 handler for unknown routes (must be before error handler)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('send_message', (data) => {
    io.to(data.chatId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
  });
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  // Don't exit - let the app continue running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - let the app continue running
});

// Graceful shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('\n🔄 Shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB:', err);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/test";

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(()=> {
    console.log("✅ Connected to MongoDB");
    
    // Create initial admin if none exists
    return createInitialAdmin();
})
.then(()=>{
    // Initialize Twilio SMS/WhatsApp service
    initTwilio();

    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.IO ready for real-time chat`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Please either:');
        console.log(`   1. Stop the other process using port ${PORT}`);
        console.log('   2. Or set a different PORT in your .env file');
        console.log('\nTo find and kill the process using the port:');
        console.log(`   netstat -ano | findstr :${PORT}`);
        console.log('   taskkill /PID <PID_NUMBER> /F');
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
})
.catch((err)=> {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Please check:");
    console.error("1. Your internet connection");
    console.error("2. MongoDB Atlas cluster is running (not paused)");
    console.error("3. Your IP address is whitelisted in MongoDB Atlas");
    console.error("4. The connection string in .env is correct");
    // Don't exit immediately - retry after delay
    console.log('\n⏳ Retrying connection in 10 seconds...');
    setTimeout(() => {
      process.exit(1);
    }, 10000);
});