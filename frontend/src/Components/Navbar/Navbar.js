import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faSignOutAlt, faSignInAlt, faSearch, faBars, faTimes, faFire, faTag, faStar, faGift } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../Cart/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { openCart, totals } = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
        handleLogout();
      }
    }
    
    // Fetch categories for navigation
    fetchCategories();
  }, []);

  // Update cart count from Cart context
  useEffect(() => {
    setCartCount(totals.count || 0);
  }, [totals.count]);

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse user data", error);
          handleLogout();
        }
      } else {
        setUser(null);
        setCartCount(0);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const products = await response.json();
      const uniqueCategories = [...new Set(products.map(product => product.category))];
      setCategories(uniqueCategories.slice(0, 8)); // Get first 8 categories
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Clear cart count in UI
    setCartCount(0);
    
    // Clear user state
    setUser(null);
    setShowUserMenu(false);
    
    // Trigger cart update events to clear cart counts in all components
    if (window.clearCartOnLogout) {
      window.clearCartOnLogout();
    }
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="main-navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-brand">
            <Link to="/" className="brand-logo">
              <span className="brand-icon">{settings.siteName.charAt(0).toUpperCase()}</span>
              <span className="brand-text">{settings.siteName.slice(1)}</span>
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="navbar-search">
            <form onSubmit={handleSearch} className="search-container">
              <input 
                type="text" 
                placeholder="Search for products, brands and more..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </form>
          </div>
          
          {/* Right Side Actions */}
          <div className="navbar-actions">
            {/* User Menu */}
            {user ? (
              <div 
                className="user-wrapper"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <FontAwesomeIcon icon={faUser} className="user-icon" />
                <div className="user-info">
                  <span className="user-greeting">Hello, {user.name}</span>
                  <span className="user-account">Account & Lists</span>
                </div>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link to="/my-orders" className="dropdown-item">My Orders</Link>
                    {user && <Link to="/my-reviews" className="dropdown-item">My Reviews</Link>}
                    {user?.isAdmin && <Link to="/admin" className="dropdown-item admin-link">Admin Dashboard</Link>}
                    <hr className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-wrapper">
                <FontAwesomeIcon icon={faSignInAlt} className="login-icon" />
                <div className="login-info">
                  <span className="login-greeting">Hello, Sign in</span>
                  <span className="login-account">Account & Lists</span>
                </div>
              </Link>
            )}
            
            {/* Cart Icon */}
            <div 
              className="cart-wrapper" 
              onClick={() => { if (user) openCart(); else navigate('/login'); }}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
              {user && cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
              <span className="cart-text">Cart</span>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <FontAwesomeIcon icon={showMobileMenu ? faTimes : faBars} />
            </button>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation Bar */}
      <nav className="secondary-navbar">
        <div className="secondary-container">
          {/* Quick Links */}
          <div className="quick-links">
            <Link to="/" className="secondary-link">
              <FontAwesomeIcon icon={faFire} />
              Home
            </Link>
            <Link to="/products?featured=true" className="secondary-link">
              <FontAwesomeIcon icon={faStar} />
              Best Sellers
            </Link>
            <Link to="/products?sale=true" className="secondary-link sale-link">
              <FontAwesomeIcon icon={faTag} />
              Today's Deals
            </Link>
            <Link to="/products?new=true" className="secondary-link">
              <FontAwesomeIcon icon={faGift} />
              New Arrivals
            </Link>
          </div>
          
          {/* Categories */}
          <div className="category-links">
            {categories.map((category, index) => (
              <Link 
                key={index}
                to={`/products?category=${encodeURIComponent(category)}`} 
                className="category-link"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <h3>Menu</h3>
            <button onClick={() => setShowMobileMenu(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="mobile-menu-content">
            <Link to="/" onClick={() => setShowMobileMenu(false)}>Home</Link>
            <Link to="/products?featured=true" onClick={() => setShowMobileMenu(false)}>Best Sellers</Link>
            <Link to="/products?sale=true" onClick={() => setShowMobileMenu(false)}>Today's Deals</Link>
            <Link to="/products?new=true" onClick={() => setShowMobileMenu(false)}>New Arrivals</Link>
            <Link to="/my-orders" onClick={() => setShowMobileMenu(false)}>My Orders</Link>
            {user && <Link to="/my-reviews" onClick={() => setShowMobileMenu(false)}>My Reviews</Link>}
            {user?.isAdmin && <Link to="/admin" onClick={() => setShowMobileMenu(false)}>Admin</Link>}
            
            <hr />
            <h4>Categories</h4>
            {categories.map((category, index) => (
              <Link 
                key={index}
                to={`/products?category=${encodeURIComponent(category)}`} 
                onClick={() => setShowMobileMenu(false)}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
