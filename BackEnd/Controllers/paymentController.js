const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here');
const Payment = require('../Models/Payment');
const Order = require('../Models/Order');
const User = require('../Models/User');
const { sendOrderStatusWhatsApp, sendOrderStatusSMS } = require('../Services/smsService');
const { sendOrderConfirmationEmail } = require('../Services/emailService');

// Create payment intent for checkout
exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'usd', orderItems, shippingAddress } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: userId,
        integration_check: 'accept_a_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent', 
      error: error.message 
    });
  }
};

// Process payment and create order
exports.processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      paymentIntentId,
      paymentMethod,
      orderData,
      billingAddress
    } = req.body;

    // Verify payment intent with Stripe
    let paymentIntent;
    if (paymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            message: 'Payment not completed',
            status: paymentIntent.status
          });
        }
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        return res.status(400).json({ 
          message: 'Invalid payment',
          error: stripeError.message
        });
      }
    }

    // Create order
    const user = await User.findById(userId).populate({ 
      path: 'cart.product', 
      select: 'name price' 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use cart items or provided order items
    const cartItems = orderData?.items || user.cart || [];
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'No items to order' });
    }

    // Calculate order totals
    const Product = require('../Models/Product');
    const orderItems = [];
    for (const item of cartItems) {
      const productId = item.product?._id || item.product;
      const product = await Product.findById(productId);
      if (product) {
        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });
      }
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = orderData?.totals?.shipping || 0;
    const discount = orderData?.totals?.discount || 0;
    const total = subtotal + shipping - discount;

    // Get card details from payment method
    let cardDetails = {};
    if (paymentIntent && paymentIntent.payment_method) {
      try {
        const paymentMethodDetails = await stripe.paymentMethods.retrieve(
          paymentIntent.payment_method
        );
        
        if (paymentMethodDetails.card) {
          cardDetails = {
            brand: paymentMethodDetails.card.brand,
            last4: paymentMethodDetails.card.last4,
            expMonth: paymentMethodDetails.card.exp_month,
            expYear: paymentMethodDetails.card.exp_year
          };
        }
      } catch (pmError) {
        console.log('Could not retrieve payment method details:', pmError.message);
      }
    }

    // Create order in database
    console.log('📦 Creating order for user:', userId);
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totals: {
        subtotal,
        discount,
        shipping,
        total
      },
      shippingAddress: orderData?.shippingAddress || {},
      customer: orderData?.customer || {
        fullName: user.name,
        email: user.email
      },
      payment: {
        method: paymentMethod || 'card',
        last4: cardDetails.last4,
        status: paymentIntentId ? 'paid' : 'pending'
      },
      status: 'pending',
      promotion: orderData?.promotion || null
    });
    console.log('✅ Order created:', order._id);

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      order: order._id,
      paymentMethod: paymentMethod || 'card',
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: paymentIntent?.latest_charge || null,
      status: paymentIntentId ? 'succeeded' : 'pending',
      amount: {
        total,
        currency: 'usd',
        subtotal,
        shipping,
        discount
      },
      cardDetails,
      billingAddress: billingAddress || {},
      metadata: {
        customerEmail: user.email,
        customerName: user.name
      },
      succeededAt: paymentIntentId ? new Date() : null
    });

    // Clear user's cart
    user.cart = [];
    await user.save();

    // Send order confirmation email
    try {
      const populatedOrder = await Order.findById(order._id).populate('items.product');
      await sendOrderConfirmationEmail(populatedOrder, user);
      console.log('📧 Order confirmation email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    // Send WhatsApp notification
    try {
      // Use customer phone from checkout form OR user profile phone
      const phoneNumber = orderData?.customer?.phone || user.phone;
      
      if (phoneNumber) {
        console.log('📱 Attempting to send WhatsApp to:', phoneNumber);
        
        const whatsappResult = await sendOrderStatusWhatsApp(
          phoneNumber, 
          'confirmed', 
          order._id.toString().substring(0, 8).toUpperCase()
        );
        
        if (whatsappResult.success) {
          console.log('✅ WhatsApp notification sent to:', phoneNumber);
        } else {
          console.log('⚠️ WhatsApp notification failed:', whatsappResult.reason || whatsappResult.error);
          
          // Fallback to SMS if WhatsApp fails
          const smsResult = await sendOrderStatusSMS(
            phoneNumber, 
            'confirmed', 
            order._id.toString().substring(0, 8).toUpperCase()
          );
          
          if (smsResult.success) {
            console.log('✅ SMS notification sent to:', phoneNumber);
          } else {
            console.log('SMS notification not sent:', smsResult.reason || smsResult.error);
          }
        }
      } else {
        console.log('⚠️ No phone number provided - skipping WhatsApp/SMS notification');
        console.log('   Customer phone:', orderData?.customer?.phone);
        console.log('   User phone:', user.phone);
      }
    } catch (notificationError) {
      console.error('Failed to send WhatsApp/SMS notification:', notificationError.message);
    }

    res.status(201).json({
      message: 'Payment processed successfully',
      order,
      payment,
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      message: 'Payment processing failed', 
      error: error.message 
    });
  }
};

// Get payment by ID
exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId)
      .populate('order')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      message: 'Failed to fetch payment', 
      error: error.message 
    });
  }
};

// Get all payments for a user
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({ user: userId })
      .populate('order')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch payments', 
      error: error.message 
    });
  }
};

// Verify payment status with Stripe
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      message: 'Failed to verify payment', 
      error: error.message 
    });
  }
};

// ADMIN: Get all payments
exports.adminGetAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};
    
    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('order')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch payments', 
      error: error.message 
    });
  }
};

// ADMIN: Process refund
exports.adminRefundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ 
        message: 'Can only refund succeeded payments' 
      });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason: reason || 'requested_by_customer'
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundDetails = {
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      refundReason: reason,
      refundedAt: new Date()
    };
    payment.refundedAt = new Date();

    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);
    if (order) {
      order.payment.status = 'refunded';
      order.status = 'cancelled';
      await order.save();
    }

    res.status(200).json({
      message: 'Refund processed successfully',
      payment,
      refund
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      message: 'Refund failed', 
      error: error.message 
    });
  }
};

// Get payment statistics (for admin dashboard)
exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const succeededPayments = await Payment.countDocuments({ status: 'succeeded' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });
    const refundedPayments = await Payment.countDocuments({ status: 'refunded' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount.total' } } }
    ]);

    const refundedAmount = await Payment.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$refundDetails.refundAmount' } } }
    ]);

    res.status(200).json({
      totalPayments,
      succeededPayments,
      failedPayments,
      refundedPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      refundedAmount: refundedAmount[0]?.total || 0,
      netRevenue: (totalRevenue[0]?.total || 0) - (refundedAmount[0]?.total || 0)
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
};
