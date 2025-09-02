const User = require('../Models/User');
const Product = require('../Models/Product');
const mongoose = require('mongoose');

// Get cart items for the current user
exports.getCartItems = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price imageUrl category brand'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.cart);
  } catch (error) {
    console.error('Error getting cart items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if product is already in cart
    const cartItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      // Product exists in cart, update quantity
      user.cart[cartItemIndex].quantity += quantity;
    } else {
      // Add new product to cart
      user.cart.push({ product: productId, quantity });
    }

    await user.save();

    // Return updated cart with populated product details
    const updatedUser = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price imageUrl category brand'
    });

    res.status(200).json(updatedUser.cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find product in cart
    const cartItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Update quantity
    user.cart[cartItemIndex].quantity = quantity;
    await user.save();

    // Return updated cart with populated product details
    const updatedUser = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price imageUrl category brand'
    });

    res.status(200).json(updatedUser.cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove product from cart
    user.cart = user.cart.filter(
      item => item.product.toString() !== productId
    );

    await user.save();

    // Return updated cart with populated product details
    const updatedUser = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price imageUrl category brand'
    });

    res.status(200).json(updatedUser.cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    res.status(200).json({ message: 'Cart cleared successfully', cart: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get cart count
exports.getCartCount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartCount = user.cart.reduce((total, item) => total + item.quantity, 0);
    
    res.status(200).json({ count: cartCount });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Transfer guest cart to user cart
exports.transferGuestCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid items format' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process each item in the guest cart
    for (const guestItem of items) {
      const productId = guestItem.product._id;
      const quantity = guestItem.quantity;

      // Skip invalid items
      if (!productId || !quantity) continue;

      // Check if product exists
      const productExists = await Product.findById(productId);
      if (!productExists) continue;

      // Check if product is already in user's cart
      const existingItemIndex = user.cart.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if product exists
        user.cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new product to cart
        user.cart.push({ product: productId, quantity });
      }
    }

    await user.save();

    // Return updated cart with populated product details
    const updatedUser = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price imageUrl category brand'
    });

    res.status(200).json({ 
      message: 'Guest cart transferred successfully',
      cart: updatedUser.cart 
    });
  } catch (error) {
    console.error('Error transferring guest cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
