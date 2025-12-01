import React, { createContext, useContext, useState, useEffect } from 'react';
import ModernLoader from '../Components/Common/ModernLoader';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Default settings - will be overridden by localStorage
    siteName: 'Vithanage Enterprises',
    siteDescription: 'Premium Electronics & Home Appliances',
    contactEmail: 'admin@vithanageenterprises.com',
    supportPhone: '+94 77 123 4567',
    businessAddress: 'Colombo, Sri Lanka',
    currency: 'LKR',
    currencySymbol: 'Rs',
    taxRate: 0.15,
    shippingRate: 500,
    freeShippingThreshold: 5000,
    lowStockThreshold: 10,
    emailNotifications: true,
    orderNotifications: true,
    stockAlerts: true,
    reviewNotifications: true,
    promotionNotifications: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    twoFactorAuth: false,
    loginAttempts: 5,
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    cacheEnabled: true,
    compressionEnabled: true,
    cdnEnabled: false
  });

  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
        console.log('✅ Settings loaded from localStorage:', parsedSettings);
      } else {
        console.log('ℹ️ No saved settings found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update settings and save to localStorage
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
      console.log('✅ Settings saved to localStorage:', updatedSettings);
      return true;
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      return false;
    }
  };

  // Format currency with proper symbol
  const formatCurrency = (amount) => {
    const symbols = {
      'LKR': 'Rs',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    
    const symbol = symbols[settings.currency] || settings.currency;
    return `${symbol} ${parseFloat(amount).toLocaleString()}`;
  };

  // Calculate price with tax
  const calculatePriceWithTax = (basePrice) => {
    return basePrice * (1 + settings.taxRate);
  };

  // Check if free shipping applies
  const isFreeShippingEligible = (orderTotal) => {
    return orderTotal >= settings.freeShippingThreshold;
  };

  // Get shipping cost for order
  const getShippingCost = (orderTotal) => {
    return isFreeShippingEligible(orderTotal) ? 0 : settings.shippingRate;
  };

  const contextValue = {
    settings,
    loading,
    updateSettings,
    loadSettings,
    formatCurrency,
    calculatePriceWithTax,
    isFreeShippingEligible,
    getShippingCost
  };

  if (loading) {
    return (
      <ModernLoader 
        message="Initializing Vithanage Enterprises"
        subtitle="Setting up your shopping experience..."
      />
    );
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;