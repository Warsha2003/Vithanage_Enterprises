import React from 'react';
import { Link } from 'react-router-dom';
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
            <li><Link to="/about-us">About Us</Link></li>
            <li><Link to="/how-to-buy">How to Buy</Link></li>
            <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
            <li><Link to="/refund-policy">Refund & Return Policy</Link></li>
            <li><Link to="/help-center">Help Center</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-media-links">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-link facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer" className="social-link whatsapp">
              <i className="fab fa-whatsapp"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link youtube">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
          
          <h4>Payment Methods</h4>
          <div className="payment-methods">
            <div className="payment-icon cash-on-delivery" title="Cash on Delivery">
              <i className="fas fa-money-bill-wave"></i>
              <span>COD</span>
            </div>
            <div className="payment-icon mastercard" title="Mastercard">
              <i className="fab fa-cc-mastercard"></i>
            </div>
            <div className="payment-icon visa" title="Visa">
              <i className="fab fa-cc-visa"></i>
            </div>
            <div className="payment-icon google-pay" title="Google Pay">
              <i className="fab fa-google-pay"></i>
            </div>
          </div>
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