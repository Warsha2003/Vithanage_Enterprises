import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, faSearch, faShoppingCart, faTruck,
  faUndo, faCreditCard, faUserCircle, faCog,
  faHeadset, faEnvelope, faPhone, faComments,
  faChevronRight, faExternalLinkAlt, faBook
} from '@fortawesome/free-solid-svg-icons';
import './HelpCenter.css';

function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const helpCategories = [
    {
      id: 'orders',
      icon: faShoppingCart,
      title: 'Orders & Payment',
      description: 'Help with placing orders, payment issues, and order management',
      count: 12
    },
    {
      id: 'shipping',
      icon: faTruck,
      title: 'Shipping & Delivery',
      description: 'Information about delivery times, tracking, and shipping options',
      count: 8
    },
    {
      id: 'returns',
      icon: faUndo,
      title: 'Returns & Refunds',
      description: 'How to return items and get refunds or exchanges',
      count: 10
    },
    {
      id: 'account',
      icon: faUserCircle,
      title: 'Account & Security',
      description: 'Managing your account, passwords, and privacy settings',
      count: 6
    },
    {
      id: 'products',
      icon: faCog,
      title: 'Products & Services',
      description: 'Product information, warranties, and technical support',
      count: 15
    },
    {
      id: 'billing',
      icon: faCreditCard,
      title: 'Billing & Pricing',
      description: 'Payment methods, invoices, and pricing questions',
      count: 7
    }
  ];

  const popularTopics = [
    {
      question: 'How do I track my order?',
      category: 'shipping',
      link: '/my-orders',
      isExternal: false
    },
    {
      question: 'What is your return policy?',
      category: 'returns',
      link: '/refund-policy',
      isExternal: false
    },
    {
      question: 'How do I change my password?',
      category: 'account',
      answer: 'Go to your account settings and click on "Change Password". Enter your current password and then your new password twice to confirm.'
    },
    {
      question: 'What payment methods do you accept?',
      category: 'billing',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, bank transfers, and cash on delivery in selected areas.'
    },
    {
      question: 'How long does delivery take?',
      category: 'shipping',
      answer: 'Standard delivery takes 3-5 business days. Express delivery (1-2 days) and same-day delivery are also available in selected cities.'
    },
    {
      question: 'How do I cancel my order?',
      category: 'orders',
      answer: 'You can cancel your order within 1 hour of placement by going to "My Orders" and clicking "Cancel Order". After this, please contact support.'
    },
    {
      question: 'Do you offer warranties on products?',
      category: 'products',
      answer: 'Yes, all products come with manufacturer warranties. Extended warranty options are available at checkout for selected items.'
    },
    {
      question: 'How do I create an account?',
      category: 'account',
      link: '/login',
      isExternal: false
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our customer service team',
      icon: faHeadset,
      action: () => alert('Support contact coming soon!'),
      color: '#007bff'
    },
    {
      title: 'Live Chat',
      description: 'Chat with us for instant help',
      icon: faComments,
      action: () => alert('Live chat coming soon!'),
      color: '#28a745'
    },
    {
      title: 'Email Support',
      description: 'Send us your questions via email',
      icon: faEnvelope,
      action: () => window.open('mailto:support@vithanage.com'),
      color: '#6f42c1'
    },
    {
      title: 'Call Us',
      description: '24/7 phone support available',
      icon: faPhone,
      action: () => window.open('tel:+15551234567'),
      color: '#dc3545'
    }
  ];

  const filteredTopics = activeCategory === 'all' 
    ? popularTopics 
    : popularTopics.filter(topic => topic.category === activeCategory);

  const handleSearch = (e) => {
    e.preventDefault();
    // Simple search implementation
    if (searchQuery.trim()) {
      const searchResults = popularTopics.filter(topic => 
        topic.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.answer && topic.answer.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      console.log('Search results:', searchResults);
      // You can implement actual search results display here
    }
  };

  return (
    <div className="help-center-page">
      {/* Hero Section */}
      <section className="help-hero">
        <div className="help-container">
          <FontAwesomeIcon icon={faQuestionCircle} className="hero-icon" />
          <h1>Help Center</h1>
          <p>Find answers to your questions and get the help you need</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="help-search">
            <input
              type="text"
              placeholder="Search for help topics, orders, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <FontAwesome icon={faSearch} />
            </button>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <div className="help-container">
          <h2>Need Immediate Help?</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <div 
                key={index} 
                className="quick-action-card"
                onClick={action.action}
                style={{ '--action-color': action.color }}
              >
                <FontAwesome icon={action.icon} className="action-icon" />
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="help-categories-section">
        <div className="help-container">
          <h2>Browse by Category</h2>
          <div className="categories-grid">
            {helpCategories.map((category) => (
              <div 
                key={category.id}
                className={`category-card ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <FontAwesome icon={category.icon} className="category-icon" />
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className="topic-count">{category.count} topics</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="popular-topics-section">
        <div className="help-container">
          <div className="topics-header">
            <h2>
              {activeCategory === 'all' ? 'Popular Topics' : 
               helpCategories.find(cat => cat.id === activeCategory)?.title + ' - Frequently Asked Questions'}
            </h2>
            {activeCategory !== 'all' && (
              <button 
                className="show-all-btn"
                onClick={() => setActiveCategory('all')}
              >
                Show All Topics
              </button>
            )}
          </div>
          
          <div className="topics-list">
            {filteredTopics.map((topic, index) => (
              <div key={index} className="topic-item">
                <div className="topic-question">
                  <FontAwesome icon={faQuestionCircle} />
                  <h3>{topic.question}</h3>
                  {topic.link && (
                    <FontAwesome 
                      icon={topic.isExternal ? faExternalLinkAlt : faChevronRight} 
                      className="topic-arrow"
                    />
                  )}
                </div>
                
                {topic.answer && (
                  <div className="topic-answer">
                    <p>{topic.answer}</p>
                  </div>
                )}
                
                {topic.link && (
                  <div className="topic-link">
                    <button 
                      className="link-btn"
                      onClick={() => window.location.href = topic.link}
                    >
                      {topic.isExternal ? 'Learn More' : 'Go to Page'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="resources-section">
        <div className="help-container">
          <h2>Additional Resources</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <FontAwesome icon={faBook} className="resource-icon" />
              <h3>Shopping Guide</h3>
              <p>Learn how to shop with us from start to finish</p>
              <button onClick={() => window.location.href = '/how-to-buy'}>
                View Guide
              </button>
            </div>
            
            <div className="resource-card">
              <FontAwesome icon={faUndo} className="resource-icon" />
              <h3>Return Policy</h3>
              <p>Complete information about returns and refunds</p>
              <button onClick={() => window.location.href = '/refund-policy'}>
                Read Policy
              </button>
            </div>
            
            <div className="resource-card">
              <FontAwesome icon={faCog} className="resource-icon" />
              <h3>Terms & Conditions</h3>
              <p>Our terms of service and legal information</p>
              <button onClick={() => window.location.href = '/terms-conditions'}>
                View Terms
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="contact-support-section">
        <div className="help-container">
          <div className="contact-content">
            <h2>Still Need Help?</h2>
            <p>Our support team is available 24/7 to assist you with any questions or concerns.</p>
            <div className="contact-methods">
              <div className="contact-method">
                <FontAwesome icon={faEnvelope} />
                <div>
                  <h4>Email Support</h4>
                  <p>support@vithanage.com</p>
                  <span>Response within 24 hours</span>
                </div>
              </div>
              <div className="contact-method">
                <FontAwesome icon={faPhone} />
                <div>
                  <h4>Phone Support</h4>
                  <p>+1 (555) 123-4567</p>
                  <span>Available 24/7</span>
                </div>
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

export default HelpCenter;