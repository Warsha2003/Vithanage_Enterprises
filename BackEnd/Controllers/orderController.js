const crypto = require('crypto');
const Order = require('../Models/Order');
const User = require('../Models/User');
const Product = require('../Models/Product');
const Payment = require('../Models/Payment');
const AuditLog = require('../Models/AuditLog');
const { sendOrderConfirmationEmail, sendShippingUpdateEmail, sendReviewRequestEmail } = require('../Services/emailService');
const { sendOrderStatusWhatsApp, sendOrderStatusSMS } = require('../Services/smsService');

const recordAudit = async (req, action, entityType, entityId, description, details = {}) => {
  try {
    await AuditLog.create({
      actorType: req.admin ? 'admin' : 'user',
      actorId: req.admin?.id || req.user?.id || null,
      actorModel: req.admin ? 'Admin' : 'User',
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      description,
      details,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    });
  } catch (error) {
    console.warn('Order audit log write failed:', error.message);
  }
};

const clearCache = async (req) => {
  const cache = req.app.get('cache');
  if (cache && cache.flush) {
    try { await cache.flush(); } catch (error) { console.warn('Failed to clear cache:', error.message); }
  }
};

const addTrackingEvent = (order, status, message, location = '') => {
  order.tracking = order.tracking || {};
  order.tracking.events = Array.isArray(order.tracking.events) ? order.tracking.events : [];
  order.tracking.events.push({ status, message, location, createdAt: new Date() });
};

const buildOrderItems = async (items = []) => {
  const orderItems = [];

  for (const item of items) {
    const productId = item?.product?._id || item?.product;
    if (!productId) continue;

    const product = await Product.findById(productId);
    if (!product) continue;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: Math.max(1, parseInt(item.quantity) || 1)
    });
  }

  return orderItems;
};

const buildTrackingSnapshot = (order, status = 'processing', message = 'Order created') => ({
  courier: order.tracking?.courier || '',
  trackingNumber: order.tracking?.trackingNumber || '',
  trackingUrl: order.tracking?.trackingUrl || '',
  status,
  estimatedDeliveryDate: order.tracking?.estimatedDeliveryDate || null,
  events: order.tracking?.events || [{ status: 'created', message, createdAt: new Date() }]
});

// Create order from payload and user's cart
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { customer, shippingAddress, payment, items: clientItems, totals, promotion } = req.body;

    const user = await User.findById(userId).populate({ path: 'cart.product', select: 'name price' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prefer server-side cart for safety; fallback to client payload if needed
    const cartItems = Array.isArray(user.cart) && user.cart.length > 0 ? user.cart : (Array.isArray(clientItems) ? clientItems : []);
    if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    // Normalize items
    const orderItems = await buildOrderItems(cartItems);

    if (orderItems.length === 0) return res.status(400).json({ message: 'No valid items in cart' });

    // Recalculate totals server-side
    const subtotal = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
    const shipping = 0;
    let discount = 0;
    
    // Handle promotion if provided
    let promotionData = null;
    if (promotion && promotion.code) {
      try {
        const Promotion = require('../Models/Promotion');
        const result = await Promotion.validateCode(promotion.code, userId, subtotal);
        if (result.valid) {
          discount = result.discountAmount;
          promotionData = {
            code: promotion.code,
            promotionId: result.promotion._id,
            discountAmount: discount,
            discountType: result.promotion.type
          };
          
          // Update promotion usage
          const promotionDoc = result.promotion;
          promotionDoc.usageCount += 1;
          promotionDoc.usedBy.push({
            user: userId,
            usedAt: new Date(),
            orderValue: subtotal,
            discountApplied: discount
          });
          await promotionDoc.save();
        }
      } catch (promoError) {
        console.log('Promotion validation error:', promoError.message);
        // Continue without promotion if there's an error
      }
    }
    
    const total = subtotal + shipping - discount;

    const last4 = (payment && payment.cardNumber) ? String(payment.cardNumber).slice(-4) : undefined;

    const order = await Order.create({
      user: userId,
      guestCheckout: false,
      items: orderItems,
      totals: { subtotal, discount, shipping, total },
      promotion: promotionData,
      shippingAddress: shippingAddress || {},
      customer: customer || {},
      payment: { method: 'card', last4, status: 'paid' },
      status: 'pending',
      tracking: buildTrackingSnapshot({ tracking: {} }, 'processing', 'Customer checkout completed')
    });

    // Clear user's cart after order
    user.cart = [];
    await user.save();

    // Send order confirmation email
    try {
      const populatedOrder = await Order.findById(order._id).populate('items.product');
      await sendOrderConfirmationEmail(populatedOrder, user);
      console.log('Order confirmation email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Send WhatsApp notification
    try {
      // Use customer phone from checkout form OR user profile phone
      const phoneNumber = (customer && customer.phone) || user.phone;
      
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
        console.log('   Customer phone:', customer?.phone);
        console.log('   User phone:', user.phone);
      }
    } catch (notificationError) {
      console.error('Failed to send WhatsApp/SMS notification:', notificationError.message);
      // Don't fail the order creation if notification fails
    }

    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createGuestOrder = async (req, res) => {
  try {
    const { customer, shippingAddress, payment, items: clientItems, totals, promotion } = req.body;

    if (!customer || !customer.fullName || !customer.email) {
      return res.status(400).json({ message: 'Guest name and email are required' });
    }

    const orderItems = await buildOrderItems(Array.isArray(clientItems) ? clientItems : []);
    if (orderItems.length === 0) {
      return res.status(400).json({ message: 'No valid items in cart' });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = totals?.shipping ?? 0;
    const discount = totals?.discount ?? 0;
    const total = subtotal + shipping - discount;
    const guestToken = crypto.randomBytes(24).toString('hex');
    const paymentMethod = payment?.method || 'card';
    const last4 = payment?.cardNumber ? String(payment.cardNumber).slice(-4) : undefined;

    const order = await Order.create({
      user: null,
      guestCheckout: true,
      guestCustomer: {
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone || ''
      },
      guestToken,
      items: orderItems,
      totals: { subtotal, discount, shipping, total },
      promotion: promotion?.code ? { code: promotion.code } : undefined,
      shippingAddress: shippingAddress || {},
      customer,
      payment: { method: paymentMethod, last4, status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid' },
      status: 'pending',
      tracking: buildTrackingSnapshot({ tracking: {} }, 'processing', 'Guest checkout completed')
    });

    await Payment.create({
      user: null,
      guestEmail: customer.email,
      guestName: customer.fullName,
      order: order._id,
      paymentMethod,
      status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'succeeded',
      amount: {
        total,
        currency: 'usd',
        subtotal,
        shipping,
        discount
      },
      cardDetails: last4 ? { last4 } : {},
      metadata: {
        customerEmail: customer.email,
        customerName: customer.fullName,
        customerPhone: customer.phone || ''
      },
      succeededAt: paymentMethod === 'cash_on_delivery' ? null : new Date()
    });

    res.status(201).json({
      message: 'Guest order created',
      order,
      guestAccessToken: guestToken
    });
  } catch (error) {
    console.error('Error creating guest order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: get all orders
exports.adminGetAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: update order status
exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    addTrackingEvent(order, status, `Order status updated to ${status}`);
    await order.save();
    res.status(200).json({ message: 'Order status updated', order });
    await clearCache(req);
    await recordAudit(req, 'order.status_update', 'Order', order._id, 'Updated order status', { status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: update processing step for approved orders
exports.adminUpdateProcessing = async (req, res) => {
  try {
    const { id } = req.params;
    const { step } = req.body;
    const allowed = ['none', 'preparing', 'packing', 'waiting_to_delivery', 'on_the_way', 'finished'];
    if (!allowed.includes(step)) {
      return res.status(400).json({ message: 'Invalid processing step' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'approved') return res.status(400).json({ message: 'Only approved orders can be processed' });

    const indexMap = {
      'none': 0,
      'preparing': 1,
      'packing': 2,
      'waiting_to_delivery': 3,
      'on_the_way': 4,
      'finished': 5
    };

    order.processing = {
      step,
      stepIndex: indexMap[step],
      updatedAt: new Date()
    };
    order.tracking = order.tracking || {};
    order.tracking.status = step === 'finished' ? 'delivered' : 'processing';
    if (step === 'on_the_way') {
      order.tracking.status = 'in_transit';
    }
    if (step === 'waiting_to_delivery') {
      order.tracking.status = 'shipped';
    }
    addTrackingEvent(order, order.tracking.status, `Processing step changed to ${step}`);
    await order.save();

    // Send shipping update email
    try {
      const user = await User.findById(order.user);
      const statusMap = {
        'preparing': 'Processing',
        'packing': 'Processing',
        'waiting_to_delivery': 'Shipped',
        'on_the_way': 'Out for Delivery',
        'finished': 'Delivered'
      };
      
      if (user && statusMap[step]) {
        await sendShippingUpdateEmail(order, user, statusMap[step]);
        console.log(`Shipping update email sent to: ${user.email}`);
        
        // Send WhatsApp notification for shipping updates
        if (user.phone) {
          const whatsappStatusMap = {
            'preparing': 'processing',
            'packing': 'processing',
            'waiting_to_delivery': 'shipped',
            'on_the_way': 'shipped',
            'finished': 'delivered'
          };
          
          const whatsappStatus = whatsappStatusMap[step];
          if (whatsappStatus) {
            const whatsappResult = await sendOrderStatusWhatsApp(
              user.phone,
              whatsappStatus,
              order._id.toString().substring(0, 8).toUpperCase(),
              step === 'waiting_to_delivery' || step === 'on_the_way' ? { trackingNumber: order.trackingNumber || '' } : {}
            );
            
            if (whatsappResult.success) {
              console.log(`✅ WhatsApp shipping update sent to: ${user.phone}`);
            } else {
              console.log(`⚠️ WhatsApp shipping update failed: ${whatsappResult.reason || whatsappResult.error}`);
            }
          }
        }
        
        // Send review request email when order is delivered
        if (step === 'finished') {
          // Send review request 24 hours after delivery
          setTimeout(async () => {
            try {
              const populatedOrder = await Order.findById(order._id).populate('items.product');
              await sendReviewRequestEmail(populatedOrder, user);
              console.log(`Review request email sent to: ${user.email}`);
            } catch (reviewEmailError) {
              console.error('Failed to send review request email:', reviewEmailError);
            }
          }, 24 * 60 * 60 * 1000); // 24 hours delay
        }
      }
    } catch (emailError) {
      console.error('Failed to send shipping update email:', emailError);
    }

    res.status(200).json({ message: 'Processing updated', order });
    await clearCache(req);
    await recordAudit(req, 'order.processing_update', 'Order', order._id, 'Updated order processing', { step });
  } catch (error) {
    console.error('Error updating processing:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const { id, orderNumber } = req.params;
    const token = req.query.token || req.body?.token;
    const query = id ? { _id: id } : { orderNumber };

    const order = await Order.findOne(query).populate('items.product', 'name imageUrl');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user) {
      const ownerId = order.user ? String(order.user) : null;
      if (ownerId !== String(req.user.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else if (order.guestCheckout) {
      if (!token || token !== order.guestToken) {
        return res.status(401).json({ message: 'Guest tracking token required' });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.status(200).json({
      orderNumber: order.orderNumber,
      status: order.status,
      processing: order.processing,
      tracking: order.tracking,
      returnStatus: order.returnStatus,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      items: order.items,
      totals: order.totals,
      guestCheckout: order.guestCheckout
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order by id (owner only)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel order (user can cancel pending or approved orders)
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user?.id;

    console.log('Canceling order request:', { 
      orderId, 
      userId, 
      userObject: req.user,
      params: req.params 
    });

    // Validate inputs
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Find order and verify ownership
    const order = await Order.findOne({ _id: orderId, user: userId });
    console.log('Order found:', order ? { 
      id: order._id, 
      status: order.status, 
      user: order.user 
    } : 'No order found');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or does not belong to you' 
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'approved'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Only pending or approved orders can be cancelled.`
      });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = 'user';
    
    const savedOrder = await order.save();
    console.log('Order cancelled successfully:', { 
      orderId: savedOrder._id, 
      newStatus: savedOrder.status,
      cancelledAt: savedOrder.cancelledAt
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: savedOrder
    });

  } catch (error) {
    console.error('Detailed error cancelling order:', {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

