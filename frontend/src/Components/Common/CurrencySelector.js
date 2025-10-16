import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faGlobe, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useCurrency } from '../../contexts/CurrencyContext';
import './CurrencySelector.css';

const CurrencySelector = ({ inline = false }) => {
  const { currency, currencies, changeCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!currencies || currencies.length === 0) {
    return <div>Loading currencies...</div>;
  }

  const handleCurrencyChange = (newCurrency) => {
    changeCurrency(newCurrency);
    setIsOpen(false);
  };

  const currentCurrency = currencies.find(c => c.code === currency);

  if (inline) {
    return (
      <div className="currency-dropdown-item" ref={dropdownRef}>
        <div className="currency-simple-selector">
          <label htmlFor="currency-select" className="currency-label">Currency:</label>
          <select 
            id="currency-select"
            value={currency} 
            onChange={(e) => {
              e.stopPropagation();
              changeCurrency(e.target.value);
            }}
            className="currency-select"
            onClick={(e) => e.stopPropagation()}
          >
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="currency-selector">
      <button 
        className="currency-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FontAwesomeIcon icon={faGlobe} className="currency-icon" />
        <span className="currency-text">
          {currentCurrency?.symbol} {currency}
        </span>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="currency-overlay" onClick={() => setIsOpen(false)} />
          <div className="currency-dropdown">
            <div className="currency-dropdown-header">
              <h3>Select Currency</h3>
            </div>
            <div className="currency-list">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  className={`currency-item ${currency === curr.code ? 'active' : ''}`}
                  onClick={() => handleCurrencyChange(curr.code)}
                >
                  <div className="currency-info">
                    <span className="currency-symbol">{curr.symbol}</span>
                    <div className="currency-details">
                      <span className="currency-code">{curr.code}</span>
                      <span className="currency-name">{curr.name}</span>
                    </div>
                  </div>
                  {currency === curr.code && (
                    <FontAwesomeIcon icon={faCheck} className="selected-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;