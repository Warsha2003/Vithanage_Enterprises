//V2ft5D1dbTssVJzR

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const promClient = require('prom-client');
const Redis = require('ioredis');
const http = require('http');
const { execSync } = require('child_process');
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
const returnRoutes = require('./Routes/returnRoutes');
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
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development'
  });
}

promClient.collectDefaultMetrics({ prefix: 'vithanage_' });

const createCacheAdapter = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redis.on('error', (error) => {
      console.warn('Redis cache error:', error.message);
    });

    return {
      kind: 'redis',
      client: redis,
      async get(key) {
        return await redis.get(key);
      },
      async set(key, value, ttlSeconds = 300) {
        await redis.set(key, value, 'EX', ttlSeconds);
      },
      async del(key) {
        await redis.del(key);
      },
      async flush() {
        await redis.flushdb();
      }
    };
  }

  const memoryStore = new Map();
  return {
    kind: 'memory',
    async get(key) {
      const entry = memoryStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttlSeconds = 300) {
      memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async del(key) {
      memoryStore.delete(key);
    },
    async flush() {
      memoryStore.clear();
    }
  };
};

app.set('cache', createCacheAdapter());

const httpRequestDuration = new promClient.Histogram({
  name: 'vithanage_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'vithanage_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const normalizeRoute = (req) => req.route?.path || req.path || req.originalUrl.split('?')[0] || 'unknown';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: false,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin-auth', authLimiter);

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    const labels = {
      method: req.method,
      route: normalizeRoute(req),
      status_code: String(res.statusCode)
    };

    httpRequestTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);

    console.info(JSON.stringify({
      level: 'info',
      type: 'http_request',
      method: req.method,
      route: labels.route,
      statusCode: res.statusCode,
      durationMs: Math.round(durationSeconds * 1000),
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
      timestamp: new Date().toISOString()
    }));
  });

  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Vithanage Enterprises API is working');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint for monitoring systems
app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (error) {
    res.status(500).json({ message: 'Failed to collect metrics' });
  }
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
// Return routes
app.use('/api/returns', returnRoutes);
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

// Initialize Twilio SMS/WhatsApp service
const { initTwilio } = require('./Services/smsService');
initTwilio();

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

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        method: req.method,
        route: normalizeRoute(req)
      }
    });
  }
  
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
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  // Don't exit - let the app continue running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  }
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

function getListenerPid(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const lines = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (!Number.isNaN(pid)) {
        return pid;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function killProcessOnPort(port) {
  const pid = getListenerPid(port);
  if (!pid) {
    return false;
  }

  try {
    const processInfo = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (!/node\.exe/i.test(processInfo)) {
      return false;
    }

    execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' });
    console.log(`🔧 Freed port ${port} by stopping stale node process ${pid}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Could not auto-free port ${port}: ${error.message}`);
    return false;
  }
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
    const PORT = process.env.PORT || 5000;
    let serverHasStarted = false;

    const startServer = () => {
      server.listen(PORT, () => {
      if (serverHasStarted) {
        return;
      }
      serverHasStarted = true;
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.IO ready for real-time chat`);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️ Port ${PORT} is already in use`);
          if (process.platform === 'win32' && killProcessOnPort(PORT)) {
            setTimeout(() => {
              if (!server.listening && !serverHasStarted) {
                startServer();
              }
            }, 250);
            return;
          }

          console.error('💡 Please either:');
          console.error(`   1. Stop the other process using port ${PORT}`);
          console.error('   2. Or set a different PORT in your .env file');
          console.error('\nTo find and kill the process using the port:');
          console.error(`   netstat -ano | findstr :${PORT}`);
          console.error('   taskkill /PID <PID_NUMBER> /F');
          process.exit(1);
        } else {
          console.error('❌ Server error:', err);
          process.exit(1);
        }
      });
    };

    startServer();
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