const StockAlert = require('../Models/StockAlert');
const Product = require('../Models/Product');
const User = require('../Models/User');
const { sendEmail } = require('../Services/emailService');

// Create stock alert
exports.createAlert = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id || req.admin?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is already in stock
    if (product.stock > 0) {
      return res.status(400).json({ message: 'Product is already in stock' });
    }

    // Check if alert already exists
    const existingAlert = await StockAlert.findOne({ user: userId, product: productId });
    if (existingAlert) {
      return res.status(400).json({ message: 'You already have an alert for this product' });
    }

    // Create alert
    const alert = new StockAlert({
      user: userId,
      product: productId,
      email: user.email
    });

    await alert.save();

    res.status(201).json({ 
      message: 'Stock alert created successfully',
      alert 
    });
  } catch (error) {
    console.error('Error creating stock alert:', error);
    res.status(500).json({ message: 'Error creating stock alert' });
  }
};

// Get user's stock alerts
exports.getMyAlerts = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const alerts = await StockAlert.find({ user: userId })
      .populate('product', 'name imageUrl price stock')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

// Delete stock alert
exports.deleteAlert = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const alert = await StockAlert.findOneAndDelete({ 
      user: userId, 
      product: productId 
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert removed successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Error deleting alert' });
  }
};

// Check if user has alert for product
exports.checkAlert = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const alert = await StockAlert.findOne({ 
      user: userId, 
      product: productId 
    });

    res.json({ hasAlert: !!alert });
  } catch (error) {
    console.error('Error checking alert:', error);
    res.status(500).json({ message: 'Error checking alert' });
  }
};

// Send notifications for restocked products (called when inventory updated)
exports.notifyRestockedProducts = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product || product.stock <= 0) return;

    // Find all unnotified alerts for this product
    const alerts = await StockAlert.find({ 
      product: productId, 
      notified: false 
    }).populate('user', 'name email');

    for (const alert of alerts) {
      try {
        // Send email notification
        await sendEmail(
          alert.email,
          `Good News! ${product.name} is back in stock!`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">🎉 Product Back in Stock!</h2>
              <p>Hello,</p>
              <p>Great news! The product you were waiting for is now available:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">${product.name}</h3>
                <p style="color: #28a745; font-weight: bold;">✓ Now in stock</p>
                <p style="font-size: 18px; color: #333;">Price: LKR ${product.price.toLocaleString()}</p>
              </div>
              <a href="http://localhost:3000/products/${product._id}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                Shop Now
              </a>
              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                You received this email because you requested to be notified when this product was back in stock.
              </p>
            </div>
          `
        );

        // Mark alert as notified
        alert.notified = true;
        alert.notifiedAt = new Date();
        await alert.save();
      } catch (emailError) {
        console.error('Error sending stock notification email:', emailError);
      }
    }

    return alerts.length;
  } catch (error) {
    console.error('Error notifying restocked products:', error);
    return 0;
  }
};
