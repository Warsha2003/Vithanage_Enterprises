const Order = require('../Models/Order');
const User = require('../Models/User');
const Product = require('../Models/Product');

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
    const orderItems = [];
    for (const item of cartItems) {
      const productId = item.product._id || item.product;
      const product = await Product.findById(productId);
      if (!product) continue;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
    }

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
      items: orderItems,
      totals: { subtotal, discount, shipping, total },
      promotion: promotionData,
      shippingAddress: shippingAddress || {},
      customer: customer || {},
      payment: { method: 'card', last4, status: 'paid' },
      status: 'pending'
    });

    // Clear user's cart after order
    user.cart = [];
    await user.save();

    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error('Error creating order:', error);
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
    await order.save();
    res.status(200).json({ message: 'Order status updated', order });
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
    await order.save();
    res.status(200).json({ message: 'Processing updated', order });
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


