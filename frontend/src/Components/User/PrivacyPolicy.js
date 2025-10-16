import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faLock, faUserShield, faDatabase, faCookieBite, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <div className="privacy-header">
        <div className="privacy-hero">
          <FontAwesomeIcon icon={faShield} className="privacy-hero-icon" />
          <h1>Privacy Policy</h1>
          <p className="privacy-subtitle">Your privacy is our priority. Learn how we protect and handle your personal information.</p>
          <p className="last-updated">Last updated: October 2025</p>
        </div>
      </div>

      <div className="privacy-content">
        <div className="privacy-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faDatabase} className="section-icon" />
            <h2>Information We Collect</h2>
          </div>
          <div className="section-content">
            <h3>Personal Information</h3>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely)</li>
              <li>Account credentials and preferences</li>
            </ul>
            
            <h3>Automatically Collected Information</h3>
            <ul>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Website usage patterns and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faUserShield} className="section-icon" />
            <h2>How We Use Your Information</h2>
          </div>
          <div className="section-content">
            <ul>
              <li><strong>Order Processing:</strong> To fulfill and manage your orders</li>
              <li><strong>Customer Support:</strong> To respond to inquiries and provide assistance</li>
              <li><strong>Account Management:</strong> To maintain and secure your account</li>
              <li><strong>Communications:</strong> To send order updates and promotional offers</li>
              <li><strong>Improvements:</strong> To enhance our services and user experience</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faLock} className="section-icon" />
            <h2>Data Protection & Security</h2>
          </div>
          <div className="section-content">
            <div className="security-measures">
              <div className="security-item">
                <h3>Encryption</h3>
                <p>All sensitive data is encrypted using industry-standard SSL/TLS protocols</p>
              </div>
              <div className="security-item">
                <h3>Access Controls</h3>
                <p>Strict access controls limit who can view your personal information</p>
              </div>
              <div className="security-item">
                <h3>Secure Servers</h3>
                <p>Data is stored on secure servers with regular security updates</p>
              </div>
              <div className="security-item">
                <h3>Regular Monitoring</h3>
                <p>Continuous monitoring for unauthorized access or security breaches</p>
              </div>
            </div>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faCookieBite} className="section-icon" />
            <h2>Cookies & Tracking</h2>
          </div>
          <div className="section-content">
            <h3>Types of Cookies We Use</h3>
            <div className="cookie-types">
              <div className="cookie-type">
                <strong>Essential Cookies:</strong> Required for basic website functionality
              </div>
              <div className="cookie-type">
                <strong>Analytics Cookies:</strong> Help us understand how visitors use our site
              </div>
              <div className="cookie-type">
                <strong>Preference Cookies:</strong> Remember your settings and preferences
              </div>
              <div className="cookie-type">
                <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements
              </div>
            </div>
            <p>You can manage cookie preferences in your browser settings.</p>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faEnvelope} className="section-icon" />
            <h2>Your Rights & Choices</h2>
          </div>
          <div className="section-content">
            <div className="rights-grid">
              <div className="right-item">
                <h3>Access</h3>
                <p>Request a copy of your personal data</p>
              </div>
              <div className="right-item">
                <h3>Correction</h3>
                <p>Update or correct inaccurate information</p>
              </div>
              <div className="right-item">
                <h3>Deletion</h3>
                <p>Request deletion of your personal data</p>
              </div>
              <div className="right-item">
                <h3>Portability</h3>
                <p>Transfer your data to another service</p>
              </div>
              <div className="right-item">
                <h3>Opt-out</h3>
                <p>Unsubscribe from marketing communications</p>
              </div>
              <div className="right-item">
                <h3>Restrict Processing</h3>
                <p>Limit how we use your information</p>
              </div>
            </div>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <h2>Third-Party Services</h2>
          </div>
          <div className="section-content">
            <p>We may share information with trusted third-party services for:</p>
            <ul>
              <li>Payment processing (secure payment gateways)</li>
              <li>Shipping and delivery services</li>
              <li>Analytics and website optimization</li>
              <li>Customer support tools</li>
              <li>Marketing and advertising platforms</li>
            </ul>
            <p>All third parties are required to maintain appropriate data protection standards.</p>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <h2>Data Retention</h2>
          </div>
          <div className="section-content">
            <p>We retain your personal information only as long as necessary for:</p>
            <ul>
              <li>Fulfilling the purposes outlined in this policy</li>
              <li>Complying with legal obligations</li>
              <li>Resolving disputes and enforcing agreements</li>
              <li>Providing ongoing customer support</li>
            </ul>
          </div>
        </div>

        <div className="contact-section">
          <div className="contact-card">
            <h2>Questions About Privacy?</h2>
            <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</p>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Email:</strong> privacy@vithanageenterprises.com
              </div>
              <div className="contact-item">
                <strong>Phone:</strong> +94 11 234 5678
              </div>
              <div className="contact-item">
                <strong>Address:</strong> 123 Business Street, Colombo, Sri Lanka
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;