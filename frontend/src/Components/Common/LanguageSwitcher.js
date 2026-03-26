import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🌐 Language dropdown toggled, isOpen:', !isOpen);
    setIsOpen(!isOpen);
  };

  const handleSelect = (e, langCode) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🌐 Language changed to:', langCode);
    setLanguage(langCode);
    setIsOpen(false);
  };

  // Stop propagation on wrapper to prevent navbar dropdown from closing
  const handleWrapperClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="language-switcher-wrapper" onClick={handleWrapperClick}>
      <span className="language-label">Language:</span>
      <div className="language-switcher" ref={dropdownRef}>
        <button 
          type="button"
          className="language-toggle"
          onClick={handleToggle}
          aria-label="Select language"
        >
          <FontAwesomeIcon icon={faGlobe} className="globe-icon" />
          <span className="current-lang">{currentLang.flag} {currentLang.nativeName}</span>
          <FontAwesomeIcon icon={faChevronDown} className={`chevron ${isOpen ? 'open' : ''}`} />
        </button>

        {isOpen && (
          <div className="language-dropdown">
            {languages.map((lang) => (
              <button
                type="button"
                key={lang.code}
                className={`language-option ${language === lang.code ? 'active' : ''}`}
                onClick={(e) => handleSelect(e, lang.code)}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-name">{lang.nativeName}</span>
                <span className="lang-english">({lang.name})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
