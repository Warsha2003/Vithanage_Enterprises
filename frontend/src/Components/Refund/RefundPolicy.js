import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUndo, faShieldAlt, faClock, faCheckCircle,
  faTimesCircle, faExchangeAlt, faCalculator, faQuestionCircle,
  faBox, faTruck, faCreditCard, faFileAlt,
  faExclamationTriangle, faInfoCircle, faPhoneAlt, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../../contexts/SettingsContext';
import './RefundPolicy.css';

function RefundPolicy() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('policy');

  const refundSteps = [
    {
      step: 1,
      icon: faBox,
      title: 'Check Eligibility',
      description: 'Verify that your item meets our return criteria (within 30 days, original condition)'
    },
    {
      step: 2,
      icon: faFileAlt,
      title: 'Request Return',
      description: 'Go to My Orders and click "Return Item" or contact our support team'
    },
    {
      step: 3,
      icon: faTruck,
      title: 'Ship the Item',
      description: 'Pack the item securely and ship it back using our prepaid return label'
    },
    {
      step: 4,
      icon: faCheckCircle,
      title: 'Get Your Refund',
      description: 'Once we receive and inspect the item, your refund will be processed within 3-5 business days'
    }
  ];

  const eligibleItems = [
    { icon: faCheckCircle, text: 'Items in original packaging and condition', eligible: true },
    { icon: faCheckCircle, text: 'Products returned within 30 days of purchase', eligible: true },
    { icon: faCheckCircle, text: 'Items with original receipts or order confirmation', eligible: true },
    { icon: faCheckCircle, text: 'Unused products with all accessories included', eligible: true },
    { icon: faTimesCircle, text: 'Personalized or customized items', eligible: false },
    { icon: faTimesCircle, text: 'Items damaged by misuse or wear', eligible: false },
    { icon: faTimesCircle, text: 'Products returned after 30 days', eligible: false },
    { icon: faTimesCircle, text: 'Items without original packaging', eligible: false }
  ];

  const refundMethods = [
    {
      method: 'Credit/Debit Card',
      timeframe: '3-5 business days',
      description: 'Refunded to the original payment method',
      icon: faCreditCard
    },
    {
      method: 'PayPal',
      timeframe: '1-2 business days',
      description: 'Instant refund to your PayPal account',
      icon: faCreditCard
    },
    {
      method: 'Store Credit',
      timeframe: 'Immediate',
      description: 'Get store credit for future purchases',
      icon: faFileAlt
    },
    {
      method: 'Bank Transfer',
      timeframe: '5-7 business days',
      description: 'Direct deposit to your bank account',
      icon: faCreditCard
    }
  ];

  const faqs = [
    {
      question: 'How long do I have to return an item?',
      answer: 'You have 30 days from the delivery date to return most items. Some categories may have different return windows.'
    },
    {
      question: 'Do I need to pay for return shipping?',
      answer: 'No, we provide free return shipping labels for most returns. Simply print the label and attach it to your package.'
    },
    {
      question: 'Can I exchange an item instead of returning it?',
      answer: 'Yes! You can exchange items for different sizes, colors, or models. The exchange process is similar to returns.'
    },
    {
      question: 'What if my item arrives damaged?',
      answer: 'If you receive a damaged item, contact us immediately. We\'ll arrange for a replacement or full refund at no cost to you.'
    },
    {
      question: 'How will I know when my refund is processed?',
      answer: 'You\'ll receive email notifications at each step: when we receive your return, when it\'s processed, and when the refund is issued.'
    },
    {
      question: 'Can I return sale or clearance items?',
      answer: 'Yes, sale and clearance items can be returned following the same policy, as long as they meet our return criteria.'
    }
  ];

  return (
    <div className="refund-policy-page">
      {/* Hero Section */}
      <section className="refund-hero">
        <div className="refund-container">
          <FontAwesome icon={faUndo} className="hero-icon" />
          <h1>Refund & Return Policy</h1>
          <p>Easy returns, fast refunds - your satisfaction is our priority</p>
          <div className="policy-highlights">
            <div className="highlight-item">
              <FontAwesomeIcon icon={faClock} />
              <span>30-Day Returns</span>
            </div>
            <div className="highlight-item">
              <FontAwesomeIcon icon={faShieldAlt} />
              <span>Free Return Shipping</span>
            </div>
            <div className="highlight-item">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>Fast Processing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="policy-tabs">
        <div className="refund-container">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'policy' ? 'active' : ''}`}
              onClick={() => setActiveTab('policy')}
            >
              <FontAwesomeIcon icon={faFileAlt} />
              Return Policy
            </button>
            <button 
              className={`tab-btn ${activeTab === 'process' ? 'active' : ''}`}
              onClick={() => setActiveTab('process')}
            >
              <FontAwesomeIcon icon={faUndo} />
              Return Process
            </button>
            <button 
              className={`tab-btn ${activeTab === 'exchange' ? 'active' : ''}`}
              onClick={() => setActiveTab('exchange')}
            >
              <FontAwesomeIcon icon={faExchangeAlt} />
              Exchanges
            </button>
            <button 
              className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <FontAwesomeIcon icon={faQuestionCircle} />
              FAQ
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="tab-content">
        <div className="refund-container">
          
          {/* Return Policy Tab */}
          {activeTab === 'policy' && (
            <div className="policy-content">
              <div className="policy-overview">
                <h2>Our Return Policy</h2>
                <p>
                  We want you to be completely satisfied with your purchase. If you're not happy with an item, 
                  you can return it within <strong>30 days</strong> of delivery for a full refund or exchange.
                </p>
              </div>

              <div className="eligibility-section">
                <h3>What Can Be Returned?</h3>
                <div className="eligibility-grid">
                  <div className="eligible-items">
                    <h4 className="eligible-title">✅ Returnable Items</h4>
                    {eligibleItems.filter(item => item.eligible).map((item, index) => (
                      <div key={index} className="eligibility-item eligible">
                        <FontAwesomeIcon icon={item.icon} />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ineligible-items">
                    <h4 className="ineligible-title">❌ Non-Returnable Items</h4>
                    {eligibleItems.filter(item => !item.eligible).map((item, index) => (
                      <div key={index} className="eligibility-item ineligible">
                        <FontAwesomeIcon icon={item.icon} />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="refund-methods-section">
                <h3>Refund Methods & Timeframes</h3>
                <div className="refund-methods-grid">
                  {refundMethods.map((method, index) => (
                    <div key={index} className="refund-method-card">
                      <FontAwesomeIcon icon={method.icon} className="method-icon" />
                      <h4>{method.method}</h4>
                      <div className="timeframe">{method.timeframe}</div>
                      <p>{method.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Return Process Tab */}
          {activeTab === 'process' && (
            <div className="process-content">
              <h2>How to Return an Item</h2>
              <p>Follow these simple steps to return your item and get your refund:</p>
              
              <div className="steps-timeline">
                {refundSteps.map((step, index) => (
                  <div key={index} className="step-item">
                    <div className="step-number">{step.step}</div>
                    <div className="step-icon">
                      <FontAwesomeIcon icon={step.icon} />
                    </div>
                    <div className="step-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="quick-return">
                <h3>Start Your Return</h3>
                <div className="return-options">
                  <button className="return-btn primary" onClick={() => window.location.href = '/my-orders'}>
                    <FontAwesomeIcon icon={faBox} />
                    View My Orders
                  </button>
                  <button className="return-btn secondary" onClick={() => alert('Support coming soon!')}>
                    <FontAwesomeIcon icon={faPhoneAlt} />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exchange Tab */}
          {activeTab === 'exchange' && (
            <div className="exchange-content">
              <h2>Product Exchanges</h2>
              <div className="exchange-info">
                <div className="exchange-text">
                  <p>
                    Need a different size, color, or model? No problem! Exchanges follow the same 
                    easy process as returns, but instead of a refund, we'll send you the replacement item.
                  </p>
                  
                  <div className="exchange-benefits">
                    <h3>Exchange Benefits:</h3>
                    <ul>
                      <li><FontAwesome icon={faCheckCircle} /> Same 30-day return window</li>
                      <li><FontAwesome icon={faCheckCircle} /> Free exchange shipping</li>
                      <li><FontAwesome icon={faCheckCircle} /> Priority processing for exchanges</li>
                      <li><FontAwesome icon={faCheckCircle} /> No restocking fees</li>
                    </ul>
                  </div>
                </div>
                
                <div className="exchange-visual">
                  <div className="exchange-diagram">
                    <div className="exchange-step">
                      <FontAwesome icon={faBox} />
                      <span>Send Original</span>
                    </div>
                    <div className="exchange-arrow">⇄</div>
                    <div className="exchange-step">
                      <FontAwesome icon={faCheckCircle} />
                      <span>Receive New</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="price-difference">
                <h3>Price Differences</h3>
                <div className="price-cards">
                  <div className="price-card">
                    <FontAwesome icon={faCalculator} />
                    <h4>Higher Price</h4>
                    <p>Pay the difference before we ship your replacement</p>
                  </div>
                  <div className="price-card">
                    <FontAwesome icon={faCreditCard} />
                    <h4>Lower Price</h4>
                    <p>We'll refund the difference to your original payment method</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="faq-content">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div className="faq-question">
                      <FontAwesome icon={faQuestionCircle} />
                      <h3>{faq.question}</h3>
                    </div>
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Important Notice */}
      <section className="important-notice">
        <div className="refund-container">
          <div className="notice-content">
            <FontAwesome icon={faExclamationTriangle} className="notice-icon" />
            <div className="notice-text">
              <h3>Important Notice</h3>
              <p>
                This refund policy applies to purchases made through {settings.siteName}. 
                For items purchased from third-party sellers, please check the individual seller's return policy. 
                We reserve the right to refuse returns that don't meet our criteria or show signs of misuse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="support-section">
        <div className="refund-container">
          <div className="support-content">
            <h2>Still Have Questions?</h2>
            <p>Our customer support team is here to help with your return or refund questions.</p>
            <div className="support-options">
              <div className="support-card">
                <FontAwesome icon={faEnvelope} />
                <h3>Email Support</h3>
                <p>{settings.contactEmail || 'support@vithanage.com'}</p>
                <span>Response within 24 hours</span>
              </div>
              <div className="support-card">
                <FontAwesome icon={faPhoneAlt} />
                <h3>Phone Support</h3>
                <p>{settings.supportPhone || '+1 (555) 123-4567'}</p>
                <span>Mon-Fri 9AM-8PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// FontAwesome shorthand component
const FontAwesome = ({ icon, className = '' }) => (
  <FontAwesomeIcon icon={icon} className={className} />
);

export default RefundPolicy;