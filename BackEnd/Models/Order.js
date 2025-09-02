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

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totals: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
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
    method: { type: String, default: 'card' },
    last4: String,
    status: { type: String, default: 'paid' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);


