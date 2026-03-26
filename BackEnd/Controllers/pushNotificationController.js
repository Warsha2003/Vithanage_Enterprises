const PushSubscription = require('../Models/PushSubscription');
const User = require('../Models/User');

// Web Push library would be used in production
// For now, we'll store subscriptions and have a simple notification system

// VAPID keys would be generated for production
// Generate using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY';

// Get VAPID public key for client
exports.getVapidPublicKey = async (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
};

// Subscribe to push notifications
exports.subscribe = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }

    // Check if subscription already exists
    let existingSub = await PushSubscription.findOne({
      'subscription.endpoint': subscription.endpoint
    });

    if (existingSub) {
      // Update existing subscription
      existingSub.user = userId;
      existingSub.isActive = true;
      existingSub.lastUsed = new Date();
      await existingSub.save();
    } else {
      // Create new subscription
      await PushSubscription.create({
        user: userId,
        subscription,
        userAgent: req.headers['user-agent'],
        isActive: true
      });
    }

    // Update user preference
    await User.findByIdAndUpdate(userId, { pushNotifications: true });

    res.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
};

// Unsubscribe from push notifications
exports.unsubscribe = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { endpoint } = req.body;

    if (endpoint) {
      await PushSubscription.deleteOne({ 'subscription.endpoint': endpoint });
    } else {
      await PushSubscription.updateMany({ user: userId }, { isActive: false });
    }

    // Update user preference
    await User.findByIdAndUpdate(userId, { pushNotifications: false });

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
};

// Send notification to a user (internal use)
exports.sendToUser = async (userId, notification) => {
  try {
    const subscriptions = await PushSubscription.find({
      user: userId,
      isActive: true
    });

    if (subscriptions.length === 0) {
      console.log('No active push subscriptions for user:', userId);
      return { sent: 0 };
    }

    // In production, you would use web-push library:
    // const webpush = require('web-push');
    // webpush.setVapidDetails('mailto:your@email.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    
    let sent = 0;
    for (const sub of subscriptions) {
      try {
        // In production:
        // await webpush.sendNotification(sub.subscription, JSON.stringify(notification));
        
        sub.lastUsed = new Date();
        await sub.save();
        sent++;
        
        console.log('Push notification queued for:', userId, notification.title);
      } catch (err) {
        if (err.statusCode === 410) {
          // Subscription expired, remove it
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }

    return { sent };
  } catch (error) {
    console.error('Send push notification error:', error);
    return { sent: 0, error };
  }
};

// Notification templates
exports.notifyOrderStatus = async (userId, orderId, status) => {
  const notifications = {
    confirmed: {
      title: '✅ Order Confirmed!',
      body: `Your order #${orderId.slice(-6).toUpperCase()} has been confirmed.`,
      icon: '/logo192.png',
      data: { url: `/my-orders` }
    },
    processing: {
      title: '📦 Order Being Prepared',
      body: `Your order #${orderId.slice(-6).toUpperCase()} is being prepared for shipping.`,
      icon: '/logo192.png',
      data: { url: `/my-orders` }
    },
    shipped: {
      title: '🚚 Order Shipped!',
      body: `Your order #${orderId.slice(-6).toUpperCase()} is on its way!`,
      icon: '/logo192.png',
      data: { url: `/my-orders` }
    },
    delivered: {
      title: '🎉 Order Delivered!',
      body: `Your order #${orderId.slice(-6).toUpperCase()} has been delivered. Enjoy!`,
      icon: '/logo192.png',
      data: { url: `/my-orders` }
    },
    cancelled: {
      title: '❌ Order Cancelled',
      body: `Your order #${orderId.slice(-6).toUpperCase()} has been cancelled.`,
      icon: '/logo192.png',
      data: { url: `/my-orders` }
    }
  };

  const notification = notifications[status];
  if (notification) {
    return await exports.sendToUser(userId, notification);
  }
};

// Notify about stock availability
exports.notifyStockAlert = async (userId, productName) => {
  return await exports.sendToUser(userId, {
    title: '🔔 Back in Stock!',
    body: `${productName} is now available. Get it before it sells out!`,
    icon: '/logo192.png',
    data: { url: '/products' }
  });
};

// Notify about promotion/deal
exports.notifyPromotion = async (userId, title, message) => {
  return await exports.sendToUser(userId, {
    title: `🎁 ${title}`,
    body: message,
    icon: '/logo192.png',
    data: { url: '/todays-deals' }
  });
};

// Get user's subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    
    const user = await User.findById(userId).select('pushNotifications');
    const subscriptions = await PushSubscription.find({ user: userId, isActive: true });

    res.json({
      enabled: user?.pushNotifications || false,
      subscriptionCount: subscriptions.length,
      hasActiveSubscription: subscriptions.length > 0
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
};
