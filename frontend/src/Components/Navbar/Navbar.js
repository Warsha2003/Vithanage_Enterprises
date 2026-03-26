import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faSignOutAlt, faSignInAlt, faSearch, faBars, faTimes, faFire, faTag, faStar, faGift, faHeart } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../Cart/CartContext';
import { useWishlist } from '../Cart/WishlistContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import CurrencySelector from '../Common/CurrencySelector';
import LanguageSwitcher from '../Common/LanguageSwitcher';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { openCart, totals } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const userMenuRef = React.useRef(null);

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
    } else {
      // Ensure user state is null if no stored data
      setUser(null);
      setShowUserMenu(false);
    }
    
    // Fetch categories for navigation
    fetchCategories();
  }, []);
  
  // Listen for storage changes and token removal
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!storedUser || !token) {
        setUser(null);
        setShowUserMenu(false);
        setShowMobileMenu(false);
      }
    };
    
    // Check periodically for token removal (especially for admin logout)
    const tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token && user) {
        setUser(null);
        setShowUserMenu(false);
        setShowMobileMenu(false);
      }
    }, 1000);
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenCheckInterval);
    };
  }, [user]);

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
    const isAdmin = user?.isAdmin;
    
    // Clear user state first
    setUser(null);
    setShowUserMenu(false);
    setShowMobileMenu(false);
    
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Clear cart count in UI
    setCartCount(0);
    
    // Trigger cart update events to clear cart counts in all components
    if (window.clearCartOnLogout) {
      window.clearCartOnLogout();
    }
    
    // Different handling for admin vs regular user
    if (isAdmin) {
      // For admin, force immediate redirect to ensure clean state
      window.location.replace('/');
    } else {
      // For regular users, use normal navigation
      navigate('/');
    }
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
                placeholder={t('nav.search', 'Search for products, brands and more...')}
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
            {user && localStorage.getItem('token') ? (
              <div 
                ref={userMenuRef}
                className="user-wrapper"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <FontAwesomeIcon icon={faUser} className="user-icon" />
                <div className="user-info">
                  <span className="user-greeting">Hello, {user.name}</span>
                  <span className="user-account">{t('nav.myProfile', 'Account & Lists')}</span>
                </div>
                {showUserMenu && user && localStorage.getItem('token') && (
                  <div className="user-dropdown">
                    <Link to="/my-profile" className="dropdown-item">{t('nav.myProfile', 'My Profile')}</Link>
                    {!user.isAdmin && (
                      <>
                        <Link to="/my-orders" className="dropdown-item">{t('nav.myOrders', 'My Orders')}</Link>
                        <Link to="/my-reviews" className="dropdown-item">{t('auth.myReviews', 'My Reviews')}</Link>
                      </>
                    )}
                    <hr className="dropdown-divider" />
                    <div className="dropdown-item currency-container">
                      <CurrencySelector inline={true} />
                    </div>
                    <div className="dropdown-item language-container">
                      <LanguageSwitcher />
                    </div>
                    <hr className="dropdown-divider" />
                    <Link to="/privacy-policy" className="dropdown-item">Privacy Policy</Link>
                    <Link to="/legal-information" className="dropdown-item">Legal Information</Link>
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
            
            {/* Wishlist Icon */}
            <div 
              className="wishlist-wrapper" 
              onClick={() => navigate('/wishlist')}
              title={t('nav.wishlist', 'My Wishlist')}
            >
              <FontAwesomeIcon icon={faHeart} className="wishlist-icon" />
              {user && wishlistCount > 0 && (
                <span className="wishlist-badge">{wishlistCount}</span>
              )}
            </div>
            
            {/* Cart Icon */}
            <div 
              className="cart-wrapper" 
              onClick={() => { if (user) openCart(); else navigate('/login'); }}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
              {user && cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
              <span className="cart-text">{t('nav.cart', 'Cart')}</span>
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
            <Link to="/" className={`secondary-link ${location.pathname === '/' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faFire} />
              {t('nav.home', 'Home')}
            </Link>
            <Link to="/best-sellers" className={`secondary-link ${location.pathname === '/best-sellers' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faStar} />
              {t('nav.bestSellers', 'Best Sellers')}
            </Link>
            <Link to="/todays-deals" className={`secondary-link sale-link ${location.pathname === '/todays-deals' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faTag} />
              {t('nav.todaysDeals', "Today's Deals")}
            </Link>
            <Link to="/new-arrivals" className={`secondary-link ${location.pathname === '/new-arrivals' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faGift} />
              {t('nav.newArrivals', 'New Arrivals')}
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
            <Link to="/" onClick={() => setShowMobileMenu(false)} className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/best-sellers" onClick={() => setShowMobileMenu(false)} className={location.pathname === '/best-sellers' ? 'active' : ''}>Best Sellers</Link>
            <Link to="/todays-deals" onClick={() => setShowMobileMenu(false)} className={location.pathname === '/todays-deals' ? 'active' : ''}>Today's Deals</Link>
            <Link to="/new-arrivals" onClick={() => setShowMobileMenu(false)} className={location.pathname === '/new-arrivals' ? 'active' : ''}>New Arrivals</Link>
            {user && !user.isAdmin && <Link to="/my-orders" onClick={() => setShowMobileMenu(false)}>My Orders</Link>}
            {user && !user.isAdmin && <Link to="/my-reviews" onClick={() => setShowMobileMenu(false)}>My Reviews</Link>}
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
