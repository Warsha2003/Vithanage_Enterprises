const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderItemId: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Defective Product',
      'Wrong Item Received',
      'Not as Described',
      'Damaged During Shipping',
      'Changed Mind',
      'Size/Color Issue',
      'Late Delivery',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  preferredResolution: {
    type: String,
    enum: ['refund', 'replacement', 'store_credit'],
    default: 'refund'
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'in_transit', 'received', 'refunded', 'completed', 'cancelled'],
    default: 'requested'
  },
  returnMethod: {
    type: String,
    enum: ['pickup', 'dropoff', 'mail_in'],
    default: 'pickup'
  },
  returnLabelUrl: { type: String, default: '' },
  adminResponse: { type: String, default: '' },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  refundedAmount: { type: Number, default: 0 },
  receivedAt: { type: Date },
  resolvedAt: { type: Date }
}, { timestamps: true });

returnRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
returnRequestSchema.index({ order: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);