import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faShoppingCart, faCreditCard, faTruck, 
  faUserPlus, faEye, faPlus, faCheckCircle,
  faShieldAlt, faUndo, faHeadset, faStar,
  faMapMarkerAlt, faCalendarAlt, faBoxOpen, faThumbsUp
} from '@fortawesome/free-solid-svg-icons';
import './HowToBuy.css';

function HowToBuy() {
  const buyingSteps = [
    {
      icon: faUserPlus,
      title: 'Create Account',
      description: 'Sign up for a free account or login if you already have one. It only takes a minute!'
    },
    {
      icon: faSearch,
      title: 'Browse Products',
      description: 'Explore our extensive catalog or use the search bar to find exactly what you need.'
    },
    {
      icon: faEye,
      title: 'Check Details',
      description: 'View product specifications, read reviews, and check availability in your area.'
    },
    {
      icon: faPlus,
      title: 'Add to Cart',
      description: 'Select quantity and add your desired products to the shopping cart.'
    },
    {
      icon: faShoppingCart,
      title: 'Review Cart',
      description: 'Check your cart, update quantities if needed, and proceed to checkout.'
    },
    {
      icon: faCreditCard,
      title: 'Secure Payment',
      description: 'Choose your payment method and complete the transaction securely.'
    },
    {
      icon: faTruck,
      title: 'Fast Delivery',
      description: 'Track your order and receive it at your doorstep within the estimated time.'
    },
    {
      icon: faThumbsUp,
      title: 'Enjoy & Review',
      description: 'Enjoy your purchase and leave a review to help other customers.'
    }
  ];

  const paymentMethods = [
    'Credit/Debit Cards (Visa, MasterCard, American Express)',
    'PayPal',
    'Bank Transfer',
    'Cash on Delivery (COD)',
    'Digital Wallets',
    'Buy Now, Pay Later'
  ];

  const deliveryOptions = [
    {
      title: 'Standard Delivery',
      time: '3-5 Business Days',
      cost: 'Free for orders over $50'
    },
    {
      title: 'Express Delivery',
      time: '1-2 Business Days',
      cost: '$9.99'
    },
    {
      title: 'Same Day Delivery',
      time: 'Within 24 Hours',
      cost: '$19.99 (Selected Cities)'
    }
  ];

  const tips = [
    {
      icon: faSearch,
      title: 'Use Filters',
      description: 'Narrow down your search using price, brand, and feature filters to find the perfect product.'
    },
    {
      icon: faStar,
      title: 'Read Reviews',
      description: 'Check customer reviews and ratings to make informed purchasing decisions.'
    },
    {
      icon: faShieldAlt,
      title: 'Check Warranty',
      description: 'Always verify warranty information and what\'s included with your purchase.'
    },
    {
      icon: faMapMarkerAlt,
      title: 'Verify Address',
      description: 'Double-check your delivery address to ensure smooth and timely delivery.'
    }
  ];

  return (
    <div className="how-to-buy-page">
      {/* Hero Section */}
      <section className="htb-hero">
        <div className="htb-container">
          <h1>How to Buy</h1>
          <p>Your complete guide to shopping with us - from browsing to delivery</p>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="htb-steps">
        <div className="htb-container">
          <h2>Easy 8-Step Buying Process</h2>
          <div className="steps-grid">
            {buyingSteps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">
                  <FontAwesomeIcon icon={step.icon} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="htb-payment">
        <div className="htb-container">
          <h2>Payment Options</h2>
          <div className="payment-content">
            <div className="payment-info">
              <h3>We Accept Multiple Payment Methods</h3>
              <ul>
                {paymentMethods.map((method, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    {method}
                  </li>
                ))}
              </ul>
              <div className="payment-security">
                <FontAwesomeIcon icon={faShieldAlt} />
                <span>All payments are secured with SSL encryption</span>
              </div>
            </div>
            <div className="payment-visual">
              <div className="payment-cards">
                <FontAwesomeIcon icon={faCreditCard} size="4x" />
                <p>Secure Payment Processing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="htb-delivery">
        <div className="htb-container">
          <h2>Delivery Options</h2>
          <div className="delivery-grid">
            {deliveryOptions.map((option, index) => (
              <div key={index} className="delivery-card">
                <FontAwesomeIcon icon={faTruck} className="delivery-icon" />
                <h3>{option.title}</h3>
                <div className="delivery-time">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>{option.time}</span>
                </div>
                <div className="delivery-cost">{option.cost}</div>
              </div>
            ))}
          </div>
          <div className="delivery-note">
            <FontAwesomeIcon icon={faBoxOpen} />
            <p>All orders are carefully packed and include tracking information</p>
          </div>
        </div>
      </section>

      {/* Shopping Tips */}
      <section className="htb-tips">
        <div className="htb-container">
          <h2>Shopping Tips</h2>
          <div className="tips-grid">
            {tips.map((tip, index) => (
              <div key={index} className="tip-card">
                <div className="tip-icon">
                  <FontAwesomeIcon icon={tip.icon} />
                </div>
                <h3>{tip.title}</h3>
                <p>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Policy */}
      <section className="htb-returns">
        <div className="htb-container">
          <div className="returns-content">
            <div className="returns-icon">
              <FontAwesomeIcon icon={faUndo} size="3x" />
            </div>
            <div className="returns-info">
              <h2>Easy Returns & Exchanges</h2>
              <p>
                Not satisfied with your purchase? We offer a <strong>30-day return policy</strong> 
                for most items. Simply contact our customer service team and we'll guide you 
                through the process.
              </p>
              <ul>
                <li>Free returns on orders over $100</li>
                <li>Quick refund processing (3-5 business days)</li>
                <li>Exchange options available</li>
                <li>No questions asked policy</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="htb-support">
        <div className="htb-container">
          <div className="support-content">
            <h2>Need Help?</h2>
            <p>Our customer support team is here to assist you every step of the way.</p>
            <div className="support-options">
              <div className="support-card">
                <FontAwesomeIcon icon={faHeadset} />
                <h3>24/7 Support</h3>
                <p>Chat, call, or email us anytime</p>
              </div>
              <div className="support-card">
                <FontAwesomeIcon icon={faSearch} />
                <h3>Help Center</h3>
                <p>Find answers in our FAQ section</p>
              </div>
              <div className="support-card">
                <FontAwesomeIcon icon={faShieldAlt} />
                <h3>Order Protection</h3>
                <p>Your purchases are protected</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="htb-cta">
        <div className="htb-container">
          <h2>Ready to Start Shopping?</h2>
          <p>Browse our extensive collection and find what you need today!</p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={() => window.location.href = '/products'}>
              Start Shopping
            </button>
            <button className="cta-secondary" onClick={() => window.location.href = '/contact'}>
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HowToBuy;