import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faSignOutAlt, faSignInAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

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

    // Get cart count from localStorage - use the same key as Products.js (userCart)
    const updateCartCountFromStorage = () => {
      const savedCart = localStorage.getItem('userCart') || localStorage.getItem('cart') || '[]';
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCartCount(parsedCart.length);
        } else if (parsedCart.items && Array.isArray(parsedCart.items)) {
          setCartCount(parsedCart.items.length);
        }
      } catch (error) {
        console.error("Failed to parse cart data", error);
        setCartCount(0);
      }
    };

    // Initial cart count
    updateCartCountFromStorage();

    // Listen for cart updates
    const handleStorageChange = () => {
      updateCartCountFromStorage();
    };

    const handleCartUpdated = (event) => {
      updateCartCountFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('cartUpdated', handleCartUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, []);

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
    
    // Trigger cart update events to clear cart counts in all components
    if (window.clearCartOnLogout) {
      window.clearCartOnLogout();
    }
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <nav className="navbar" style={{ backgroundColor: '#232f3e', color: 'white', padding: '0' }}>
      {/* Top bar with logo and search */}
      <div className="navbar-top" style={{ 
        padding: '15px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#232f3e'
      }}>
        <Link to="/" className="nav-logo" style={{ 
          color: 'white', 
          fontSize: '24px', 
          fontWeight: '700', 
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ color: '#ff9900', marginRight: '5px' }}>V</span>ithanage Enterprises
        </Link>
        
        {/* Search bar */}
        <div className="search-container" style={{ 
          flex: '1',
          margin: '0 20px',
          maxWidth: '600px',
          display: 'flex',
          height: '40px',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <input 
            type="text" 
            placeholder="Search for products..." 
            style={{ 
              flex: '1',
              border: 'none',
              padding: '0 15px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button style={{ 
            backgroundColor: '#ff9900', 
            border: 'none',
            padding: '0 15px',
            color: '#232f3e',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
        
        {/* User and Cart icons */}
        <div className="nav-icons" style={{ 
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* Cart icon with count */}
          <Link to="/cart" className="nav-icon cart-icon-wrapper" style={{ 
            position: 'relative', 
            marginRight: '20px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <FontAwesomeIcon icon={faShoppingCart} style={{ 
              color: 'white', 
              fontSize: '22px' 
            }} />
            {user && cartCount > 0 && (
              <span className="cart-count" style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ff9900',
                color: '#232f3e',
                borderRadius: '10px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '0 4px',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)'
              }}>
                {cartCount}
              </span>
            )}
          </Link>
          
          {/* User menu or login */}
          {user ? (
            <div className="user-menu" style={{
              position: 'relative',
              cursor: 'pointer'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'white'
              }}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight: '5px', color: 'white' }} />
                <span className="user-name" style={{ color: 'white' }}>
                  {user.name}
                </span>
              </div>
              <div className="dropdown-menu" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '4px',
                width: '200px',
                marginTop: '10px',
                zIndex: '1001',
                display: 'none'
              }}>
                <button onClick={handleLogout} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                  <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '8px', color: '#666' }} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-link login-link" style={{ 
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: '5px', color: 'white' }} />
              Login
            </Link>
          )}
        </div>
      </div>
      
      {/* Bottom navigation with links */}
      <div className="navbar-bottom" style={{ 
        backgroundColor: '#232f3e',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          <Link to="/" className="nav-link" style={{ 
            color: 'white',
            padding: '0 15px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s'
          }}>
            Home
          </Link>
          <Link to="/products" className="nav-link" style={{ 
            color: 'white',
            padding: '0 15px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s'
          }}>
            Products
          </Link>
          <Link to="/" className="nav-link" style={{ 
            color: 'white',
            padding: '0 15px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s'
          }}>
            Best Sellers
          </Link>
          <Link to="/" className="nav-link" style={{ 
            color: 'white',
            padding: '0 15px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s'
          }}>
            New Arrivals
          </Link>
          <Link to="/" className="nav-link" style={{ 
            color: '#ff9900',
            padding: '0 15px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s',
            fontWeight: '600'
          }}>
            Deals
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" className="nav-link" style={{ 
              color: 'white',
              padding: '0 15px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '3px solid transparent',
              transition: 'all 0.2s'
            }}>
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
