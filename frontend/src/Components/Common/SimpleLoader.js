import React from 'react';
import './SimpleLoader.css';

const SimpleLoader = ({ 
  message = "Loading...", 
  subtitle = ""
}) => {
  return (
    <div className="vithanage-simple-loading">
      <div className="vithanage-simple-content">
        <div className="vithanage-simple-spinner"></div>
        <div className="vithanage-simple-text">{message}</div>
        {subtitle && <div className="vithanage-simple-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default SimpleLoader;