/**
 * CartEvents - Utility functions for handling cart operations across components
 * 
 * This file provides consistent methods to update the cart and notify all components
 * about cart changes through custom events.
 */

// Function to update cart count and trigger relevant events
function updateCartCount() {
  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  // Create and dispatch a custom event
  const event = new CustomEvent('cartUpdated', {
    detail: { 
      count: token && storedUser ? getCartCount() : 0,
      isLoggedIn: !!(token && storedUser)
    }
  });
  document.dispatchEvent(event);
  
  // Also trigger storage event for cross-tab updates
  window.dispatchEvent(new Event('storage'));
}

// Function to add item to cart
function addToCart(item) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem('userCart')) || [];
  
  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
  
  if (existingItemIndex >= 0) {
    // If item exists, increase quantity
    cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
  } else {
    // If item doesn't exist, add to cart with quantity 1
    item.quantity = 1;
    cart.push(item);
  }
  
  // Save updated cart to localStorage
  localStorage.setItem('userCart', JSON.stringify(cart));
  
  // Update cart count and trigger events
  updateCartCount();
  
  return cart;
}

// Function to remove item from cart
function removeFromCart(itemId) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem('userCart')) || [];
  
  // Remove item from cart
  cart = cart.filter(item => item.id !== itemId);
  
  // Save updated cart to localStorage
  localStorage.setItem('userCart', JSON.stringify(cart));
  
  // Update cart count and trigger events
  updateCartCount();
  
  return cart;
}

// Function to update item quantity in cart
function updateCartItemQuantity(itemId, quantity) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem('userCart')) || [];
  
  // Find item in cart
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove item
      cart = cart.filter(item => item.id !== itemId);
    } else {
      // Otherwise update quantity
      cart[itemIndex].quantity = quantity;
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('userCart', JSON.stringify(cart));
    
    // Update cart count and trigger events
    updateCartCount();
  }
  
  return cart;
}

// Function to get current cart
function getCart() {
  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  // Only return cart if user is logged in
  if (token && storedUser) {
    return JSON.parse(localStorage.getItem('userCart')) || [];
  }
  return [];
}

// Function to get cart count
function getCartCount() {
  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  // Only return cart count if user is logged in
  if (token && storedUser) {
    const cart = getCart();
    return cart.length;
  }
  return 0;
}

// Function to clear cart on logout
function clearCartOnLogout() {
  // Don't actually clear cart data in localStorage to preserve it if user logs in again
  // Just notify all components that the cart count should be 0 for display purposes
  const event = new CustomEvent('cartUpdated', {
    detail: { 
      count: 0,
      isLoggedIn: false
    }
  });
  document.dispatchEvent(event);
  
  // Also trigger storage event for cross-tab updates
  window.dispatchEvent(new Event('storage'));
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
});

// Export functions for direct use
window.updateCartCount = updateCartCount;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.getCart = getCart;
window.getCartCount = getCartCount;
window.clearCartOnLogout = clearCartOnLogout;
