import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faShoppingCart, 
  faSignInAlt, 
  faMinus, 
  faPlus, 
  faTrash 
} from '@fortawesome/free-solid-svg-icons';
import './Cart.css';
import CartItem from './CartItem';

const Cart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
      setIsLoggedIn(true);
      // Load cart from localStorage then fetch from API
      loadCartFromLocalStorage();
      fetchCart(token);
    } else {
      // If not logged in, redirect to login page
      setIsLoggedIn(false);
      setLoading(false);
      
      // Store the current page as redirect destination
      sessionStorage.setItem('loginRedirect', '/cart');
      
      // Redirect to login page
      console.log("User not logged in, redirecting to login");
      navigate('/login');
    }
    
    // Listen for auth changes
    window.addEventListener('auth-change', handleAuthChange);
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      if (isLoggedIn) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          fetchCart(token);
        }
      } else {
        loadCartFromLocalStorage();
      }
    };
    
    document.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      document.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);
  
  // Handle auth changes (login/logout)
  const handleAuthChange = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
      setIsLoggedIn(true);
      fetchCart(token);
    } else {
      setIsLoggedIn(false);
      // On logout, still show cached cart data
      loadCartFromLocalStorage();
    }
  };
  
  // Load cart data from localStorage
  const loadCartFromLocalStorage = () => {
    const savedCart = localStorage.getItem('userCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
          const savedTotal = parsedCart.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
          }, 0);
          setCartTotal(savedTotal);
        } else if (parsedCart.items && Array.isArray(parsedCart.items)) {
          // Handle different cart storage formats
          setCartItems(parsedCart.items);
          const savedTotal = parsedCart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
          }, 0);
          setCartTotal(savedTotal);
        }
        
        setLoading(false);
        console.log('Loaded cart from localStorage:', parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        setCartItems([]);
        setCartTotal(0);
        setLoading(false);
      }
    } else {
      setCartItems([]);
      setCartTotal(0);
      setLoading(false);
    }
  };
  
  const fetchCart = async (token) => {
    try {
      // Then fetch fresh cart data from server
      const response = await fetch('/api/cart', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Cart data received from API:', data);
        
        // Update state with fresh data
        setCartItems(data);
        
        // Calculate cart total
        const total = data.reduce((total, item) => {
          return total + (item.product.price * item.quantity);
        }, 0);
        setCartTotal(total);
        
        // Cache cart data in localStorage
        localStorage.setItem('userCart', JSON.stringify(data));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch cart:', response.status, response.statusText, errorData);
        // If API fails, rely on the already loaded localStorage data
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // If API fails, rely on the already loaded localStorage data
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateCartItem = async (productId, quantity) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.log('No token available, cannot update cart');
      return;
    }
    
    try {
      // Optimistically update UI
      const updatedItems = cartItems.map(item => {
        if (item.product._id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
      
      setCartItems(updatedItems);
      
      // Update cart total
      const newTotal = updatedItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);
      setCartTotal(newTotal);
      
      // Save to localStorage immediately for persistence
      localStorage.setItem('userCart', JSON.stringify(updatedItems));
      
      // Use the global cart update function to notify all components
      if (window.updateCartCount) {
        window.updateCartCount();
      }
      
      // Update on server
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          productId,
          quantity
        })
      });
      
      if (response.ok) {
        // Fetch fresh cart data to ensure consistency
        fetchCart(token);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error updating cart item:', response.status, errorData);
        // The optimistic update remains in the UI
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      // The optimistic update remains in the UI
    }
  };
  
  // Remove item from cart
  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.log('No token available, cannot remove from cart');
      return;
    }
    
    try {
      // Optimistically update UI
      const updatedItems = cartItems.filter(item => item.product._id !== productId);
      setCartItems(updatedItems);
      
      // Update cart total
      const newTotal = updatedItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);
      setCartTotal(newTotal);
      
      // Save to localStorage immediately for persistence
      localStorage.setItem('userCart', JSON.stringify(updatedItems));
      
      // Use the global cart update function to notify all components
      if (window.updateCartCount) {
        window.updateCartCount();
      }
      
      // Remove on server
      const response = await fetch(`/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      if (response.ok) {
        // Fetch fresh cart data to ensure consistency
        fetchCart(token);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error removing cart item:', response.status, errorData);
        // The optimistic update remains in the UI
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      // The optimistic update remains in the UI
    }
  };

  if (loading) {
    return (
      <div className="cart-page loading">
        <div className="loading-spinner">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page error">
        <div className="error-message">
          <h2>Error Loading Cart</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>
            <FontAwesomeIcon icon={faShoppingCart} /> Shopping Cart
          </h1>
          <Link to="/products" className="continue-shopping-link">
            <FontAwesomeIcon icon={faChevronLeft} /> Continue Shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart-message">
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/products" className="shop-now-btn">Shop Now</Link>
          </div>
        ) : (
          <>
            <div className="cart-items-table">
              <div className="cart-table-header">
                <div className="cart-header-product">Product</div>
                <div className="cart-header-price">Price</div>
                <div className="cart-header-quantity">Quantity</div>
                <div className="cart-header-total">Total</div>
                <div className="cart-header-action"></div>
              </div>

              <div className="cart-items-list">
                {cartItems.map(item => (
                  <CartItem 
                    key={item.product._id} 
                    item={item} 
                    updateQuantity={updateCartItem} 
                    removeItem={removeFromCart} 
                  />
                ))}
              </div>
            </div>

            <div className="cart-summary">
              <div className="cart-summary-inner">
                <h2>Order Summary</h2>
                
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                {isLoggedIn ? (
                  <button className="checkout-button" onClick={() => navigate('/checkout')}>
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="login-to-checkout">
                    <p>Please login to complete your purchase</p>
                    <button className="checkout-button login-btn" onClick={() => navigate('/login')}>
                      <FontAwesomeIcon icon={faSignInAlt} /> Login to Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
