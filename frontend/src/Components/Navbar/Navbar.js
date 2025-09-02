import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingCart, 
  faSearch, 
  faSignOutAlt, 
  faTachometerAlt, 
  faBoxOpen, 
  faUserCircle, 
  faShoppingBag
} from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in - check both localStorage and sessionStorage
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Only consider user as logged in if both user data and token exist
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        console.log("Navbar: User is logged in", JSON.parse(storedUser).name);
      } catch (err) {
        console.error("Error parsing user data:", err);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
      }
    } else {
      // Clear any incomplete auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  }, []);
  
  const handleLogout = () => {
    // Clear from both storage types
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.replace('/');
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1>Vithanage Enterprises</h1>
          </Link>
        </div>
        
        <form className="search-bar" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search for products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </form>
        
        <div className="navbar-links">
          <Link to="/" className="nav-link">
            <span>Home</span>
          </Link>
          <Link to="/products" className="nav-link">
            <span>Products</span>
          </Link>
          <Link to="/deals" className="nav-link">
            <span>Deals</span>
          </Link>
          <Link to="/contact" className="nav-link">
            <span>Contact</span>
          </Link>
          
          {user && (
            <Link to="/cart" className="nav-link cart">
              <FontAwesomeIcon icon={faShoppingCart} />
              <span className="cart-count">0</span>
            </Link>
          )}
          
          {user ? (
            <div className="user-menu">
              <div className="nav-link user">
                <FontAwesomeIcon icon={faUserCircle} />
                <span className="user-name">{user.name}</span>
              </div>
              <div className="dropdown-menu">
                {user.isAdmin && (
                  <Link to="/admin" className="dropdown-item">
                    <FontAwesomeIcon icon={faTachometerAlt} style={{ marginRight: '10px' }} />
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/products" className="dropdown-item">
                  <FontAwesomeIcon icon={faBoxOpen} style={{ marginRight: '10px' }} />
                  View Products
                </Link>
                <Link to="/profile" className="dropdown-item">
                  <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '10px' }} />
                  My Profile
                </Link>
                <Link to="/orders" className="dropdown-item">
                  <FontAwesomeIcon icon={faShoppingBag} style={{ marginRight: '10px' }} />
                  My Orders
                </Link>
                <div className="dropdown-item" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '10px' }} />
                  Logout
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-link user">
              <FontAwesomeIcon icon={faUserCircle} />
              <span style={{ marginLeft: '5px' }}>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;