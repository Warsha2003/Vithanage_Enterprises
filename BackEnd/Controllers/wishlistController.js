const User = require('../Models/User');
const Product = require('../Models/Product');
const mongoose = require('mongoose');

// Get wishlist items for the current user
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: 'name price imageUrl category brand stock rating'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.wishlist.length,
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();

    const updatedUser = await User.findById(userId).populate({
      path: 'wishlist',
      select: 'name price imageUrl category brand stock rating'
    });

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      count: updatedUser.wishlist.length,
      wishlist: updatedUser.wishlist
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.wishlist.findIndex(id => id.toString() === productId);
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    user.wishlist.splice(index, 1);
    await user.save();

    const updatedUser = await User.findById(userId).populate({
      path: 'wishlist',
      select: 'name price imageUrl category brand stock rating'
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: updatedUser.wishlist.length,
      wishlist: updatedUser.wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if product is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInWishlist = user.wishlist.some(id => id.toString() === productId);

    res.status(200).json({
      success: true,
      isInWishlist
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Move item from wishlist to cart
exports.moveToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if product is in wishlist
    const wishlistIndex = user.wishlist.findIndex(id => id.toString() === productId);
    if (wishlistIndex === -1) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    // Remove from wishlist
    user.wishlist.splice(wishlistIndex, 1);

    // Add to cart
    const cartIndex = user.cart.findIndex(item => item.product.toString() === productId);
    if (cartIndex > -1) {
      user.cart[cartIndex].quantity += 1;
    } else {
      user.cart.push({ product: productId, quantity: 1 });
    }

    await user.save();

    const updatedUser = await User.findById(userId)
      .populate({
        path: 'wishlist',
        select: 'name price imageUrl category brand stock rating'
      })
      .populate({
        path: 'cart.product',
        select: 'name price imageUrl category brand'
      });

    res.status(200).json({
      success: true,
      message: 'Product moved to cart',
      wishlist: updatedUser.wishlist,
      cart: updatedUser.cart
    });
  } catch (error) {
    console.error('Error moving to cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get wishlist count
exports.getWishlistCount = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.wishlist.length
    });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlist: []
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
