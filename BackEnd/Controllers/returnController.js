const ReturnRequest = require('../Models/ReturnRequest');
const Order = require('../Models/Order');
const Product = require('../Models/Product');

const getOrderItem = (order, productId, orderItemId) => {
  return order.items.find(item => {
    const matchesProduct = item.product && String(item.product) === String(productId);
    const matchesItem = orderItemId ? String(item._id) === String(orderItemId) : true;
    return matchesProduct && matchesItem;
  });
};

const isReturnEligible = (order) => {
  const eligibleStatuses = ['Delivered', 'approved'];
  const isFinishedProcessing = order.status === 'approved' && order.processing && order.processing.step === 'finished';

  if (order.status === 'rejected' || order.status === 'cancelled') {
    return { eligible: false, reason: 'Cannot request a return for cancelled or rejected orders' };
  }

  if (!eligibleStatuses.includes(order.status) && !isFinishedProcessing) {
    return { eligible: false, reason: 'Order must be delivered before a return can be requested' };
  }

  const referenceDate = order.deliveredAt || order.updatedAt;
  const daysSinceDelivery = Math.floor((new Date() - referenceDate) / (1000 * 60 * 60 * 24));
  if (daysSinceDelivery > 30) {
    return { eligible: false, reason: 'Return window (30 days) has expired' };
  }

  return { eligible: true, daysSinceDelivery };
};

exports.checkReturnEligibility = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderItem = getOrderItem(order, productId);
    if (!orderItem) {
      return res.status(400).json({ success: false, message: 'Product not found in this order' });
    }

    const result = isReturnEligible(order);
    res.json({ success: true, ...result, item: orderItem });
  } catch (error) {
    console.error('Check return eligibility error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId, productId, orderItemId, reason, description, quantity = 1, preferredResolution = 'refund' } = req.body;
    const userId = req.user.id;

    if (!orderId || !productId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or does not belong to you' });
    }

    const orderItem = getOrderItem(order, productId, orderItemId);
    if (!orderItem) {
      return res.status(400).json({ success: false, message: 'Product not found in this order' });
    }

    const eligibility = isReturnEligible(order);
    if (!eligibility.eligible) {
      return res.status(400).json({ success: false, message: eligibility.reason });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existingReturn = await ReturnRequest.findOne({ order: orderId, product: productId, status: { $in: ['requested', 'approved', 'in_transit', 'received'] } });
    if (existingReturn) {
      return res.status(400).json({ success: false, message: 'A return request already exists for this item' });
    }

    const returnRequest = await ReturnRequest.create({
      order: orderId,
      user: userId,
      product: productId,
      orderItemId: orderItemId || String(orderItem._id),
      reason,
      description,
      quantity: Math.max(1, Math.min(parseInt(quantity) || 1, orderItem.quantity)),
      preferredResolution
    });

    order.returnStatus = 'requested';
    order.returnRequestedAt = new Date();
    await order.save();

    const populatedReturn = await ReturnRequest.findById(returnRequest._id)
      .populate('order', 'orderNumber status totals createdAt deliveredAt')
      .populate('product', 'name imageUrl price');

    res.status(201).json({ success: true, message: 'Return request created successfully', data: populatedReturn });
  } catch (error) {
    console.error('Create return request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.getUserReturns = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const returns = await ReturnRequest.find({ user: userId })
      .populate('order', 'orderNumber status totals createdAt deliveredAt')
      .populate('product', 'name imageUrl price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ReturnRequest.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        returns,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Get user returns error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.getReturnById = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findOne({ _id: req.params.id, user: req.user.id })
      .populate('order', 'orderNumber status totals createdAt deliveredAt')
      .populate('product', 'name imageUrl price')
      .populate('adminId', 'name email');

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }

    res.json({ success: true, data: returnRequest });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.cancelReturnRequest = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findOne({ _id: req.params.id, user: req.user.id });
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }

    if (returnRequest.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Only requested returns can be cancelled' });
    }

    returnRequest.status = 'cancelled';
    returnRequest.resolvedAt = new Date();
    await returnRequest.save();

    await Order.findByIdAndUpdate(returnRequest.order, { returnStatus: 'none' });

    res.json({ success: true, message: 'Return request cancelled', data: returnRequest });
  } catch (error) {
    console.error('Cancel return error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};