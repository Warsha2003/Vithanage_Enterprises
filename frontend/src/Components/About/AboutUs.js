import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, faTruck, faHeadset, faStar, 
  faAward, faUsers, faGlobe, faHeart,
  faCheckCircle, faBolt, faThumbsUp, faMedal
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../../contexts/SettingsContext';
import './AboutUs.css';

function AboutUs() {
  const { settings } = useSettings();

  const achievements = [
    { icon: faUsers, number: '50,000+', label: 'Happy Customers' },
    { icon: faStar, number: '4.8/5', label: 'Customer Rating' },
    { icon: faAward, number: '5+', label: 'Years Experience' },
    { icon: faGlobe, number: '100+', label: 'Cities Served' }
  ];

  const features = [
    {
      icon: faShieldAlt,
      title: 'Secure Shopping',
      description: 'Your personal and payment information is always protected with industry-leading encryption.'
    },
    {
      icon: faTruck,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery to your doorstep with real-time tracking and updates.'
    },
    {
      icon: faHeadset,
      title: '24/7 Support',
      description: 'Our dedicated customer service team is available around the clock to help you.'
    },
    {
      icon: faBolt,
      title: 'Easy Returns',
      description: 'Hassle-free returns and exchanges within 30 days of purchase with no questions asked.'
    }
  ];

  const values = [
    {
      icon: faHeart,
      title: 'Customer First',
      description: 'We prioritize our customers\' needs and satisfaction above everything else.'
    },
    {
      icon: faThumbsUp,
      title: 'Quality Guarantee',
      description: 'We only sell authentic, high-quality products from trusted brands and manufacturers.'
    },
    {
      icon: faMedal,
      title: 'Innovation',
      description: 'We continuously improve our services and embrace new technologies to serve you better.'
    },
    {
      icon: faCheckCircle,
      title: 'Transparency',
      description: 'Honest pricing, clear policies, and transparent communication in all our dealings.'
    }
  ];

  return (
    <div className="about-us-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About {settings.siteName}</h1>
          <p className="hero-tagline">
            Your trusted partner in electrical and electronic products, delivering quality and excellence since day one.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="about-story">
        <div className="about-container">
          <div className="story-content">
            <div className="story-text">
              <h2>Our Story</h2>
              <p>
                Founded with a vision to revolutionize the way people shop for electrical and electronic products, 
                <strong> {settings.siteName}</strong> has grown from a small startup to one of the leading e-commerce 
                platforms in the industry.
              </p>
              <p>
                We began our journey with a simple mission: to make high-quality electrical products accessible 
                to everyone at competitive prices. Today, we serve thousands of satisfied customers across multiple 
                cities, offering an extensive range of products from trusted brands.
              </p>
              <p>
                Our commitment to excellence, customer satisfaction, and innovation has made us the preferred 
                choice for electrical solutions among homeowners, businesses, and professionals alike.
              </p>
            </div>
            <div className="story-image">
              <div className="about-image-placeholder">
                <FontAwesomeIcon icon={faGlobe} size="4x" />
                <p>Serving customers worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="about-achievements">
        <div className="about-container">
          <h2>Our Achievements</h2>
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <FontAwesomeIcon icon={achievement.icon} className="achievement-icon" />
                <h3>{achievement.number}</h3>
                <p>{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <div className="about-container">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="about-container">
          <h2>Our Values</h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">
                  <FontAwesomeIcon icon={value.icon} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="about-container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              To empower every customer with access to the best electrical and electronic products, 
              backed by exceptional service, competitive pricing, and a seamless shopping experience. 
              We strive to be more than just an e-commerce platform - we aim to be your trusted 
              technology partner for life.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="about-cta">
        <div className="about-container">
          <div className="cta-content">
            <h2>Ready to Experience the Difference?</h2>
            <p>Join thousands of satisfied customers who trust us for their electrical needs.</p>
            <div className="cta-buttons">
              <button className="cta-primary" onClick={() => window.location.href = '/products'}>
                Shop Now
              </button>
              <button className="cta-secondary" onClick={() => window.location.href = '/contact'}>
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;