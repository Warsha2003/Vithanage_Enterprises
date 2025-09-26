import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './Footer.css';

function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>{settings.siteName}</h3>
          <p>{settings.siteDescription}</p>
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
          <p>{settings.businessAddress}</p>
          <p>Email: {settings.contactEmail}</p>
          <p>Phone: {settings.supportPhone}</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 {settings.siteName}. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;