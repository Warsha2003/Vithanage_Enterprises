import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <h1>Vithanage Enterprises</h1>
          </Link>
        </div>
        
        <div className="search-bar">
          <input type="text" placeholder="Search for products..." />
          <button className="search-button">Search</button>
        </div>
        
        <div className="navbar-links">
          <Link to="/" className="nav-link" style={{ textDecoration: 'none', color: 'white' }}>Home</Link>
          <div className="nav-link">Deals</div>
          <div className="nav-link">Contact</div>
          {user && (
            <div className="nav-link cart">
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-count">0</span>
            </div>
          )}
          
          {user ? (
            <div className="user-menu">
              <div className="nav-link user">
                <i className="fas fa-user"></i>
                <span className="user-name">{user.name}</span>
              </div>
              <div className="dropdown-menu">
                {user.isAdmin && (
                  <Link to="/admin" className="dropdown-item">
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/products" className="dropdown-item">
                  View Products
                </Link>
                <div className="dropdown-item">My Profile</div>
                <div className="dropdown-item">My Orders</div>
                <div className="dropdown-item" onClick={handleLogout}>Logout</div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-link user" style={{ textDecoration: 'none', color: 'white' }}>
              <i className="fas fa-user"></i>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;