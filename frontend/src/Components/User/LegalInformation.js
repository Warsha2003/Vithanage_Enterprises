import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faFileContract, faShield, faGavel, faCopyright, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './LegalInformation.css';

const LegalInformation = () => {
  return (
    <div className="legal-info-container">
      <div className="legal-header">
        <div className="legal-hero">
          <FontAwesomeIcon icon={faGavel} className="legal-hero-icon" />
          <h1>Legal Information</h1>
          <p className="legal-subtitle">Important legal terms, conditions, and compliance information for Vithanage Enterprises.</p>
          <p className="last-updated">Last updated: October 2025</p>
        </div>
      </div>

      <div className="legal-content">
        <div className="legal-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faFileContract} className="section-icon" />
            <h2>Terms of Service</h2>
          </div>
          <div className="section-content">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using the Vithanage Enterprises website and services, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h3>2. Use License</h3>
            <ul>
              <li>Permission is granted to temporarily download one copy of the materials on Vithanage Enterprises' website for personal, non-commercial transitory viewing only.</li>
              <li>This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials.</li>
              <li>Use the materials for any commercial purpose or for any public display (commercial or non-commercial).</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website.</li>
            </ul>

            <h3>3. Account Terms</h3>
            <ul>
              <li>You are responsible for maintaining the security of your account and password.</li>
              <li>You must provide accurate and complete registration information.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faShoppingCart} className="section-icon" />
            <h2>Purchase Terms & Conditions</h2>
          </div>
          <div className="section-content">
            <h3>Order Acceptance</h3>
            <p>All orders are subject to acceptance by Vithanage Enterprises. We reserve the right to refuse or cancel any order for any reason.</p>
            
            <h3>Pricing and Payment</h3>
            <ul>
              <li>All prices are listed in Sri Lankan Rupees (LKR) and include applicable taxes unless otherwise stated.</li>
              <li>Prices are subject to change without notice.</li>
              <li>Payment must be received in full before order processing.</li>
              <li>We accept major credit cards, debit cards, and bank transfers.</li>
            </ul>

            <h3>Shipping and Delivery</h3>
            <ul>
              <li>Delivery times are estimates and not guaranteed.</li>
              <li>Risk of loss transfers to you upon delivery to the carrier.</li>
              <li>Additional charges may apply for remote locations.</li>
              <li>We are not responsible for delays caused by customs or other authorities.</li>
            </ul>
          </div>
        </div>

        <div className="legal-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faShield} className="section-icon" />
            <h2>Warranty & Returns</h2>
          </div>
          <div className="section-content">
            <h3>Product Warranty</h3>
            <div className="warranty-grid">
              <div className="warranty-item">
                <h4>Manufacturer Warranty</h4>
                <p>All products come with manufacturer warranty as specified by each brand.</p>
              </div>
              <div className="warranty-item">
                <h4>Quality Guarantee</h4>
                <p>We guarantee all products are genuine and in perfect working condition.</p>
              </div>
              <div className="warranty-item">
                <h4>Return Policy</h4>
                <p>30-day return policy for unused items in original packaging.</p>
              </div>
              <div className="warranty-item">
                <h4>Repair Services</h4>
                <p>Authorized repair services available through our service centers.</p>
              </div>
            </div>

            <h3>Limitation of Liability</h3>
            <p>Vithanage Enterprises shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our products or services.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faCopyright} className="section-icon" />
            <h2>Intellectual Property</h2>
          </div>
          <div className="section-content">
            <h3>Copyright</h3>
            <p>The website design, text, graphics, and other content are protected by copyright and other intellectual property laws.</p>
            
            <h3>Trademarks</h3>
            <ul>
              <li>"Vithanage Enterprises" and related logos are trademarks of our company.</li>
              <li>Product names and logos are trademarks of their respective manufacturers.</li>
              <li>Unauthorized use of any trademark is prohibited.</li>
            </ul>

            <h3>User Content</h3>
            <p>By submitting content (reviews, comments, images), you grant us a non-exclusive, royalty-free license to use, reproduce, and display such content.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faExclamationTriangle} className="section-icon" />
            <h2>Disclaimers</h2>
          </div>
          <div className="section-content">
            <div className="disclaimer-box">
              <h3>Website Use</h3>
              <p>The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions, and terms.</p>
            </div>
            
            <div className="disclaimer-box">
              <h3>Product Information</h3>
              <p>While we strive for accuracy, product specifications, availability, and prices are subject to change without notice. Please verify details before purchase.</p>
            </div>
            
            <div className="disclaimer-box">
              <h3>Third-Party Links</h3>
              <p>Our website may contain links to third-party websites. We are not responsible for the content or practices of these external sites.</p>
            </div>
          </div>
        </div>

        <div className="legal-section">
          <div className="section-header">
            <h2>Compliance & Regulations</h2>
          </div>
          <div className="section-content">
            <h3>Sri Lankan Law</h3>
            <p>These terms are governed by and construed in accordance with the laws of Sri Lanka, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.</p>
            
            <h3>Consumer Protection</h3>
            <p>This agreement complies with the Consumer Affairs Authority of Sri Lanka and applicable consumer protection laws.</p>
            
            <h3>Data Protection</h3>
            <p>Our data handling practices comply with applicable privacy laws and regulations. See our Privacy Policy for details.</p>
            
            <h3>Import/Export Compliance</h3>
            <p>All products comply with Sri Lankan import regulations and international export controls where applicable.</p>
          </div>
        </div>

        <div className="contact-section">
          <div className="contact-card">
            <h2>Legal Questions or Concerns?</h2>
            <p>For legal inquiries or to report compliance issues, please contact our legal department:</p>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Legal Department:</strong> legal@vithanageenterprises.com
              </div>
              <div className="contact-item">
                <strong>Compliance Officer:</strong> compliance@vithanageenterprises.com
              </div>
              <div className="contact-item">
                <strong>Business Address:</strong> 123 Business Street, Colombo 03, Sri Lanka
              </div>
              <div className="contact-item">
                <strong>Registration:</strong> Company No. PV 12345 (Sri Lanka)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalInformation;