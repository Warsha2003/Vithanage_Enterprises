import React from 'react';
import './ModernLoader.css';

const ModernLoader = ({ 
  message = "Loading...", 
  subtitle = "Please wait while we prepare everything for you",
  type = "full" // "full", "mini", "button"
}) => {
  
  if (type === "mini") {
    return (
      <div className="vithanage-mini-loader">
        <div className="vithanage-mini-spinner"></div>
        <span>{message}</span>
      </div>
    );
  }

  if (type === "button") {
    return <div className="vithanage-btn-loading"></div>;
  }

  // Full screen loader
  return (
    <div className="vithanage-modern-loader">
      {/* Floating Particles Background */}
      <div className="vithanage-particles">
        <div className="vithanage-particle"></div>
        <div className="vithanage-particle"></div>
        <div className="vithanage-particle"></div>
        <div className="vithanage-particle"></div>
      </div>

      <div className="vithanage-loader-content">
        {/* Animated Company Logo */}
        <div className="vithanage-logo-container">
          <div className="vithanage-animated-logo">
            V
          </div>
        </div>

        {/* Unique Multi-Ring Spinner */}
        <div className="vithanage-unique-spinner">
          <div className="vithanage-spinner-ring"></div>
          <div className="vithanage-spinner-ring"></div>
          <div className="vithanage-spinner-ring"></div>
        </div>

        {/* Progress Bar */}
        <div className="vithanage-progress-container">
          <div className="vithanage-progress-bar"></div>
        </div>

        {/* Loading Text with Typewriter Effect */}
        <div className="vithanage-loading-text">
          {message}
        </div>
        
        <div className="vithanage-loading-subtitle">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

export default ModernLoader;