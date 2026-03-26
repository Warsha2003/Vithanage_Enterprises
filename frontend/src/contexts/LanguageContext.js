import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const STORAGE_KEY = 'vithanage_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  // Set language and save to localStorage
  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      // Update document language attribute
      document.documentElement.lang = lang;
    }
  }, []);

  // Get translation by key path (e.g., 'nav.home')
  const t = useCallback((keyPath, fallback = '') => {
    const keys = keyPath.split('.');
    let value = translations[language];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English if key not found in current language
        value = translations.en;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return fallback || keyPath;
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : fallback || keyPath;
  }, [language]);

  // Get all translations for current language
  const currentTranslations = useMemo(() => translations[language] || translations.en, [language]);

  // Available languages
  const languages = useMemo(() => [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇱🇰' }
  ], []);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    translations: currentTranslations,
    languages,
    isRTL: false // None of our languages are RTL
  }), [language, setLanguage, t, currentTranslations, languages]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
