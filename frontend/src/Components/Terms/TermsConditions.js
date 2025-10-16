import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileContract, faShieldAlt, faGavel, faUserShield,
  faExclamationTriangle, faInfoCircle, faEnvelope, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../../contexts/SettingsContext';
import './TermsConditions.css';

function TermsConditions() {
  const { settings } = useSettings();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: `By accessing and using ${settings.siteName}, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      id: 'use',
      title: 'Use License',
      content: `Permission is granted to temporarily download one copy of the materials on ${settings.siteName} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to reverse engineer any software; or remove any copyright or other proprietary notations from the materials.`
    },
    {
      id: 'disclaimer',
      title: 'Disclaimer',
      content: `The materials on ${settings.siteName} are provided on an 'as is' basis. ${settings.siteName} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`
    },
    {
      id: 'limitations',
      title: 'Limitations',
      content: `In no event shall ${settings.siteName} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ${settings.siteName}, even if ${settings.siteName} or a ${settings.siteName} authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.`
    },
    {
      id: 'accuracy',
      title: 'Accuracy of Materials',
      content: `The materials appearing on ${settings.siteName} could include technical, typographical, or photographic errors. ${settings.siteName} does not warrant that any of the materials on its website are accurate, complete, or current. ${settings.siteName} may make changes to the materials contained on its website at any time without notice. However ${settings.siteName} does not make any commitment to update the materials.`
    },
    {
      id: 'links',
      title: 'Links',
      content: `${settings.siteName} has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ${settings.siteName} of the site. Use of any such linked website is at the user's own risk.`
    },
    {
      id: 'modifications',
      title: 'Modifications',
      content: `${settings.siteName} may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.`
    },
    {
      id: 'governing',
      title: 'Governing Law',
      content: `These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which ${settings.siteName} operates and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.`
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our service. By using our service, you agree to the collection and use of information in accordance with our Privacy Policy.`
    },
    {
      id: 'account',
      title: 'User Accounts',
      content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party.`
    },
    {
      id: 'orders',
      title: 'Orders and Payment',
      content: `All orders placed through our website are subject to acceptance by ${settings.siteName}. We reserve the right to refuse or cancel any order for any reason. Payment must be made at the time of purchase through our approved payment methods. All prices are subject to change without notice.`
    },
    {
      id: 'shipping',
      title: 'Shipping and Returns',
      content: `We will make every effort to ship your order promptly. Delivery times are estimates and not guaranteed. Our return policy allows returns within 30 days of purchase for most items in original condition. Some items may have specific return restrictions.`
    }
  ];

  return (
    <div className="terms-conditions-page">
      {/* Hero Section */}
      <section className="terms-hero">
        <div className="terms-container">
          <div className="hero-content">
            <FontAwesomeIcon icon={faFileContract} className="hero-icon" />
            <h1>Terms & Conditions</h1>
            <p>Please read these terms and conditions carefully before using our services</p>
            <div className="last-updated">
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>Last updated: {currentDate}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="terms-overview">
        <div className="terms-container">
          <h2>Quick Overview</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <FontAwesomeIcon icon={faShieldAlt} className="overview-icon" />
              <h3>Your Rights</h3>
              <p>You have the right to use our services, return products, and receive support according to our policies.</p>
            </div>
            <div className="overview-card">
              <FontAwesomeIcon icon={faUserShield} className="overview-icon" />
              <h3>Your Responsibilities</h3>
              <p>Use our services lawfully, provide accurate information, and respect our intellectual property.</p>
            </div>
            <div className="overview-card">
              <FontAwesomeIcon icon={faGavel} className="overview-icon" />
              <h3>Our Obligations</h3>
              <p>We commit to providing quality products, secure transactions, and reliable customer service.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="terms-content">
        <div className="terms-container">
          <div className="terms-layout">
            {/* Table of Contents */}
            <div className="terms-toc">
              <h3>Table of Contents</h3>
              <ul>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      {index + 1}. {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Terms Sections */}
            <div className="terms-main">
              {sections.map((section, index) => (
                <div key={section.id} id={section.id} className="terms-section">
                  <h3>{index + 1}. {section.title}</h3>
                  <p>{section.content}</p>
                </div>
              ))}

              {/* Important Notice */}
              <div className="important-notice">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <div className="notice-content">
                  <h4>Important Notice</h4>
                  <p>
                    These terms and conditions constitute the entire agreement between you and {settings.siteName} 
                    regarding your use of the service. If any provision of these terms is found to be 
                    unenforceable, the remainder shall be enforced to the fullest extent permitted by law.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="terms-contact">
        <div className="terms-container">
          <div className="contact-content">
            <FontAwesomeIcon icon={faInfoCircle} className="contact-icon" />
            <div className="contact-info">
              <h3>Questions About These Terms?</h3>
              <p>
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <div className="contact-details">
                <div className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>{settings.contactEmail}</span>
                </div>
                <div className="contact-item">
                  <span>📍 {settings.businessAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="terms-cta">
        <div className="terms-container">
          <h2>Ready to Shop with Confidence?</h2>
          <p>Now that you understand our terms, start exploring our products!</p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={() => window.location.href = '/'}>
              Back to Home
            </button>
            <button className="cta-secondary" onClick={() => window.location.href = '/products'}>
              Start Shopping
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsConditions;