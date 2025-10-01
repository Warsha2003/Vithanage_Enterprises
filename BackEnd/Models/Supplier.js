const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: "Please enter a valid email"
    }
  },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]+$/.test(v);
      },
      message: "Please enter a valid contact number"
    }
  },
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    }
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      default: function() {
        return this.quantity * this.unitPrice;
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  totalOrderValue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate total order value
supplierSchema.pre('save', function(next) {
  if (this.products && this.products.length > 0) {
    this.totalOrderValue = this.products.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  }
  this.updatedAt = Date.now();
  next();
});

// Method to add or update product for supplier
supplierSchema.methods.addOrUpdateProduct = function(productId, quantity, unitPrice) {
  console.log('addOrUpdateProduct called with:', { productId, quantity, unitPrice, type: typeof quantity, type2: typeof unitPrice });
  
  const existingProductIndex = this.products.findIndex(
    item => item.product.toString() === productId.toString()
  );

  console.log('Existing product index:', existingProductIndex);

  if (existingProductIndex > -1) {
    // Update existing product
    console.log('Updating existing product at index:', existingProductIndex);
    this.products[existingProductIndex].quantity = quantity;
    this.products[existingProductIndex].unitPrice = unitPrice;
    this.products[existingProductIndex].totalPrice = quantity * unitPrice;
    this.products[existingProductIndex].lastUpdated = Date.now();
  } else {
    // Add new product
    console.log('Adding new product to supplier');
    this.products.push({
      product: productId,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice
    });
  }
  
  console.log('Products array after modification:', this.products.length, 'items');
  return this.save();
};

// Method to remove product from supplier
supplierSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Static method to get suppliers with their products populated
supplierSchema.statics.getWithProducts = function() {
  return this.find()
    .populate('products.product', 'name category price imageUrl')
    .sort({ createdAt: -1 });
};

// Virtual for total products count
supplierSchema.virtual('totalProducts').get(function() {
  return this.products.length;
});

// Virtual for total quantity
supplierSchema.virtual('totalQuantity').get(function() {
  return this.products.reduce((total, item) => total + item.quantity, 0);
});

// Ensure virtual fields are serialized
supplierSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Supplier', supplierSchema);