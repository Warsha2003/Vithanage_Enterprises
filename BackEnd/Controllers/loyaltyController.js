const User = require('../Models/User');
const LoyaltyTransaction = require('../Models/LoyaltyTransaction');
const Order = require('../Models/Order');

// Points configuration
const POINTS_CONFIG = {
  POINTS_PER_100_LKR: 1,        // 1 point for every 100 LKR spent
  POINTS_VALUE_LKR: 1,          // 1 point = 1 LKR discount
  MIN_REDEEM_POINTS: 100,       // Minimum points to redeem
  MAX_REDEEM_PERCENT: 50,       // Max 50% of order can be paid with points
  SIGNUP_BONUS: 50,             // Bonus points for new users
  REVIEW_BONUS: 10,             // Points for writing a review
  POINTS_EXPIRY_MONTHS: 12      // Points expire after 12 months
};

const getRedemptionLimit = (orderTotal, pointsAvailable) => {
  const maxByPercent = Math.floor((orderTotal * POINTS_CONFIG.MAX_REDEEM_PERCENT) / 100);
  const maxByBalance = pointsAvailable * POINTS_CONFIG.POINTS_VALUE_LKR;
  return Math.max(0, Math.min(maxByPercent, maxByBalance));
};

// Get user's loyalty points and history
exports.getMyPoints = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    
    const user = await User.findById(userId).select('loyaltyPoints totalPointsEarned name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get recent transactions
    const transactions = await LoyaltyTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate points value in LKR
    const pointsValue = user.loyaltyPoints * POINTS_CONFIG.POINTS_VALUE_LKR;

    res.json({
      currentPoints: user.loyaltyPoints,
      totalPointsEarned: user.totalPointsEarned,
      pointsValue,
      availableRedeemValue: pointsValue,
      transactions,
      config: {
        pointsPer100LKR: POINTS_CONFIG.POINTS_PER_100_LKR,
        pointsValueLKR: POINTS_CONFIG.POINTS_VALUE_LKR,
        minRedeemPoints: POINTS_CONFIG.MIN_REDEEM_POINTS,
        maxRedeemPercent: POINTS_CONFIG.MAX_REDEEM_PERCENT
      }
    });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ message: 'Failed to get loyalty points' });
  }
};

// Award points for an order (called after order completion)
exports.awardPointsForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('user');
    if (!order || !order.user) return;

    // Calculate points (1 point per 100 LKR)
    const pointsEarned = Math.floor(order.total / 100) * POINTS_CONFIG.POINTS_PER_100_LKR;
    if (pointsEarned <= 0) return;

    const user = await User.findById(order.user._id || order.user);
    if (!user) return;

    // Update user points
    user.loyaltyPoints += pointsEarned;
    user.totalPointsEarned += pointsEarned;
    await user.save();

    // Create transaction record
    await LoyaltyTransaction.create({
      user: user._id,
      type: 'earned',
      points: pointsEarned,
      description: `Earned from order #${order._id.toString().slice(-6).toUpperCase()}`,
      orderId: order._id,
      balanceAfter: user.loyaltyPoints,
      expiresAt: new Date(Date.now() + POINTS_CONFIG.POINTS_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000)
    });

    return pointsEarned;
  } catch (error) {
    console.error('Award points error:', error);
  }
};

// Redeem points at checkout
exports.redeemPoints = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { pointsToRedeem, orderId, orderTotal } = req.body;

    if (!pointsToRedeem || pointsToRedeem < POINTS_CONFIG.MIN_REDEEM_POINTS) {
      return res.status(400).json({ 
        message: `Minimum ${POINTS_CONFIG.MIN_REDEEM_POINTS} points required to redeem` 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.loyaltyPoints < pointsToRedeem) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    if (orderTotal) {
      const maxRedeemValue = getRedemptionLimit(Number(orderTotal), user.loyaltyPoints);
      const requestedDiscount = pointsToRedeem * POINTS_CONFIG.POINTS_VALUE_LKR;
      if (requestedDiscount > maxRedeemValue) {
        return res.status(400).json({
          message: `You can redeem up to ${maxRedeemValue} LKR for this order`
        });
      }
    }

    // Calculate discount value
    const discountValue = pointsToRedeem * POINTS_CONFIG.POINTS_VALUE_LKR;

    // Deduct points
    user.loyaltyPoints -= pointsToRedeem;
    await user.save();

    // Create transaction record
    await LoyaltyTransaction.create({
      user: userId,
      type: 'redeemed',
      points: -pointsToRedeem,
      description: orderId 
        ? `Redeemed for order #${orderId.toString().slice(-6).toUpperCase()}`
        : 'Redeemed at checkout',
      orderId: orderId || null,
      balanceAfter: user.loyaltyPoints
    });

    res.json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountValue,
      remainingPoints: user.loyaltyPoints
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({ message: 'Failed to redeem points' });
  }
};

// Preview redemption before checkout
exports.previewRedemption = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const { orderTotal, pointsToRedeem } = req.body;

    if (!orderTotal || Number(orderTotal) <= 0) {
      return res.status(400).json({ message: 'Valid orderTotal is required' });
    }

    const user = await User.findById(userId).select('loyaltyPoints totalPointsEarned');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const maximumDiscount = getRedemptionLimit(Number(orderTotal), user.loyaltyPoints);
    const requestedPoints = Math.max(0, parseInt(pointsToRedeem) || 0);
    const requestedDiscount = requestedPoints * POINTS_CONFIG.POINTS_VALUE_LKR;
    const canRedeem = requestedPoints >= POINTS_CONFIG.MIN_REDEEM_POINTS && requestedDiscount <= maximumDiscount;

    res.json({
      currentPoints: user.loyaltyPoints,
      totalPointsEarned: user.totalPointsEarned,
      orderTotal: Number(orderTotal),
      minimumPoints: POINTS_CONFIG.MIN_REDEEM_POINTS,
      maximumDiscount,
      requestedPoints,
      requestedDiscount,
      canRedeem
    });
  } catch (error) {
    console.error('Preview redemption error:', error);
    res.status(500).json({ message: 'Failed to preview redemption' });
  }
};

// Award signup bonus (call after user registration)
exports.awardSignupBonus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.loyaltyPoints += POINTS_CONFIG.SIGNUP_BONUS;
    user.totalPointsEarned += POINTS_CONFIG.SIGNUP_BONUS;
    await user.save();

    await LoyaltyTransaction.create({
      user: userId,
      type: 'bonus',
      points: POINTS_CONFIG.SIGNUP_BONUS,
      description: 'Welcome bonus for signing up!',
      balanceAfter: user.loyaltyPoints,
      expiresAt: new Date(Date.now() + POINTS_CONFIG.POINTS_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000)
    });

    return POINTS_CONFIG.SIGNUP_BONUS;
  } catch (error) {
    console.error('Signup bonus error:', error);
  }
};

// Award points for writing a review
exports.awardReviewBonus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.loyaltyPoints += POINTS_CONFIG.REVIEW_BONUS;
    user.totalPointsEarned += POINTS_CONFIG.REVIEW_BONUS;
    await user.save();

    await LoyaltyTransaction.create({
      user: userId,
      type: 'bonus',
      points: POINTS_CONFIG.REVIEW_BONUS,
      description: 'Bonus for writing a product review',
      balanceAfter: user.loyaltyPoints,
      expiresAt: new Date(Date.now() + POINTS_CONFIG.POINTS_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000)
    });

    return POINTS_CONFIG.REVIEW_BONUS;
  } catch (error) {
    console.error('Review bonus error:', error);
  }
};

// Get all transactions (with pagination)
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await LoyaltyTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId', 'total status');

    const total = await LoyaltyTransaction.countDocuments({ user: userId });

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Failed to get transaction history' });
  }
};

// Admin: Manually add/remove points
exports.adjustPoints = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    if (!userId || !points || !reason) {
      return res.status(400).json({ message: 'userId, points, and reason are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const type = points > 0 ? 'bonus' : 'redeemed';
    user.loyaltyPoints += points;
    if (points > 0) {
      user.totalPointsEarned += points;
    }
    
    // Ensure points don't go negative
    user.loyaltyPoints = Math.max(0, user.loyaltyPoints);
    await user.save();

    await LoyaltyTransaction.create({
      user: userId,
      type,
      points,
      description: `Admin adjustment: ${reason}`,
      balanceAfter: user.loyaltyPoints
    });

    res.json({
      success: true,
      newBalance: user.loyaltyPoints,
      message: `${Math.abs(points)} points ${points > 0 ? 'added to' : 'removed from'} user account`
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({ message: 'Failed to adjust points' });
  }
};

// Get points config (public)
exports.getPointsConfig = async (req, res) => {
  res.json({
    pointsPer100LKR: POINTS_CONFIG.POINTS_PER_100_LKR,
    pointsValueLKR: POINTS_CONFIG.POINTS_VALUE_LKR,
    minRedeemPoints: POINTS_CONFIG.MIN_REDEEM_POINTS,
    maxRedeemPercent: POINTS_CONFIG.MAX_REDEEM_PERCENT,
    signupBonus: POINTS_CONFIG.SIGNUP_BONUS,
    reviewBonus: POINTS_CONFIG.REVIEW_BONUS
  });
};
