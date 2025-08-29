import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Vithanage Enterprises</h3>
          <p>Your trusted source for premium electrical appliances since 2020.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>Home</li>
            <li>Products</li>
            <li>About Us</li>
            <li>Contact</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Categories</h3>
          <ul>
            <li>TVs</li>
            <li>Refrigerators</li>
            <li>Phones</li>
            <li>Washing Machines</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>123 Main Street<br />Colombo, Sri Lanka</p>
          <p>Email: info@vithanage.com</p>
          <p>Phone: +94 11 234 5678</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Vithanage Enterprises. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;