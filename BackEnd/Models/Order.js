const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
});

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, default: '' },
  location: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const guestCustomerSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true }
}, { _id: false });

const trackingSchema = new mongoose.Schema({
  courier: { type: String, trim: true, default: '' },
  trackingNumber: { type: String, trim: true, default: '' },
  trackingUrl: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['not_assigned', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'], default: 'not_assigned' },
  estimatedDeliveryDate: { type: Date },
  events: [trackingEventSchema]
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestCheckout: { type: Boolean, default: false },
  guestCustomer: guestCustomerSchema,
  guestToken: { type: String },
  items: [orderItemSchema],
  totals: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  promotion: {
    code: String,
    promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
    discountAmount: { type: Number, default: 0 },
    discountType: String
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'Delivered'], default: 'pending' },
  tracking: {
    type: trackingSchema,
    default: () => ({})
  },
  processing: {
    step: { 
      type: String, 
      enum: ['none', 'preparing', 'packing', 'waiting_to_delivery', 'on_the_way', 'finished'], 
      default: 'none' 
    },
    stepIndex: { type: Number, default: 0 }, // 0..5
    updatedAt: { type: Date }
  },
  shippingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  customer: {
    fullName: String,
    email: String,
    phone: String
  },
  payment: {
    method: { type: String, enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery'], default: 'card' },
    last4: String,
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'paid' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    transactionId: String
  },
  // Cancellation tracking
  cancelledAt: { type: Date },
  cancelledBy: { type: String, enum: ['user', 'admin'] },
  // Delivery tracking
  deliveredAt: { type: Date },
  returnStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'received', 'refunded', 'completed'],
    default: 'none'
  },
  returnRequestedAt: { type: Date },
  returnResolvedAt: { type: Date }
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.orderNumber = `ORD-${Date.now().toString().slice(-6)}-${suffix}`;
  }

  if (!this.tracking) {
    this.tracking = {};
  }

  if (!Array.isArray(this.tracking.events)) {
    this.tracking.events = [];
  }

  next();
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'processing.step': 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ guestToken: 1 }, { sparse: true });
orderSchema.index({ 'tracking.trackingNumber': 1 });

module.exports = mongoose.model('Order', orderSchema);



