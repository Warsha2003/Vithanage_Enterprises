const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('./Models/User');
const Product = require('./Models/Product');
const Order = require('./Models/Order');

async function createTestOrder() {
  try {
    console.log('Creating test order...');

    // Find any user (or create one)
    let user = await User.findOne({ email: { $exists: true } });
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }
    console.log('Found user:', user.name, user.email);

    // Find any product (or create one)
    let product = await Product.findOne({});
    if (!product) {
      console.log('No products found. Please create a product first.');
      return;
    }
    console.log('Found product:', product.name);

    // Create test order
    const testOrder = new Order({
      user: user._id,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }],
      totals: {
        subtotal: product.price,
        shipping: 0,
        total: product.price
      },
      status: 'approved', // This allows reviews
      processing: {
        step: 'finished', // This also allows reviews
        stepIndex: 5,
        updatedAt: new Date()
      },
      shippingAddress: {
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country'
      },
      customer: {
        fullName: user.name,
        email: user.email,
        phone: '123-456-7890'
      }
    });

    await testOrder.save();
    console.log('✅ Test order created successfully!');
    console.log('Order ID:', testOrder._id);
    console.log('User can now review product:', product.name);
    
  } catch (error) {
    console.error('❌ Error creating test order:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestOrder();