import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    LKR: 300,
    EUR: 0.92,
    GBP: 0.79
  });

  const currencies = [
    { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupees' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  // Load currency preference from localStorage
  useEffect(() => {
    console.log('🔄 Initializing Currency System');
    
    // Check if this is an admin or regular user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.isAdmin || false;
    
    if (isAdmin) {
      console.log('👨‍💼 ADMIN USER detected - currency will be managed by admin settings');
    } else {
      console.log('👤 REGULAR USER - using saved currency preference or USD default');
    }
    
    // Check if user has saved a currency preference (for regular users)
    const savedCurrency = localStorage.getItem('selectedCurrency');
    
    if (savedCurrency && currencies.find(c => c.code === savedCurrency) && !isAdmin) {
      console.log('📱 User has saved currency preference:', savedCurrency);
      setCurrency(savedCurrency);
    } else {
      console.log('🆕 Defaulting to USD (admin will override via settings)');
      setCurrency('USD');
    }

    // Load exchange rates for conversions
    fetchExchangeRates();
  }, []);

  // Fetch exchange rates (in real app, this would be from an API)
  const fetchExchangeRates = async () => {
    try {
      // Exchange rates with USD as base (since database prices are in USD format)
      const rates = {
        USD: 1,          // Base currency
        LKR: 300,        // 1 USD = 300 LKR
        EUR: 0.92,       // 1 USD = 0.92 EUR  
        GBP: 0.79        // 1 USD = 0.79 GBP
      };
      setExchangeRates(rates);
      localStorage.setItem('exchangeRates', JSON.stringify(rates));
      console.log('💱 Exchange rates loaded:', rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  // Update exchange rates (for admin use)
  const updateExchangeRates = (newRates) => {
    setExchangeRates(newRates);
    localStorage.setItem('exchangeRates', JSON.stringify(newRates));
  };

  // Change currency - for regular users ONLY
  const changeCurrency = (newCurrency, isAdminChange = false) => {
    if (currencies.find(c => c.code === newCurrency)) {
      
      if (isAdminChange) {
        // Admin changes are handled separately - just update display
        console.log('🔧 ADMIN: Dashboard currency display updated to', newCurrency);
        setCurrency(newCurrency);
        return;
      }
      
      // Regular user currency change
      console.log(`� USER: Currency changed from ${currency} to ${newCurrency}`);
      setCurrency(newCurrency);
      
      // Save user preference (not admin preference)
      if (newCurrency === 'USD') {
        localStorage.removeItem('selectedCurrency');
      } else {
        localStorage.setItem('selectedCurrency', newCurrency);
      }
      
      localStorage.setItem('currencyChangeTimestamp', Date.now().toString());
      console.log('💾 User currency preference saved - affects main website only');
    }
  };

  // Set admin currency for dashboard display ONLY (doesn't affect user frontend)
  const setAdminCurrency = (adminCurrency) => {
    if (currencies.find(c => c.code === adminCurrency)) {
      console.log(`🔧 ADMIN ONLY: Dashboard currency set to ${adminCurrency} - NO EFFECT on main website`);
      
      // Check if we're in admin context (don't save to localStorage for users)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isAdmin) {
        // Only change currency for admin dashboard display
        setCurrency(adminCurrency);
        console.log('✅ Admin dashboard currency updated - main website remains USD for users');
      } else {
        console.warn('🚫 setAdminCurrency called by non-admin user - ignored');
      }
    }
  };

  // Convert price from LKR to selected currency
  const convertPrice = (priceInLKR) => {
    // Ensure we have a valid price in LKR
    if (!priceInLKR || priceInLKR === 0) return 0;
    
    const rate = exchangeRates[currency] || 1;
    const convertedPrice = parseFloat(priceInLKR) * rate;
    
    // Format with 2 decimal places for all currencies
    return parseFloat(convertedPrice.toFixed(2));
  };

  // Format price with currency symbol - PROPER CONVERSION
  const formatPrice = (databasePrice) => {
    // Handle invalid or zero prices
    if (!databasePrice || databasePrice === 0) {
      const currencyInfo = currencies.find(c => c.code === currency);
      const symbol = currencyInfo ? currencyInfo.symbol : '$';
      return `${symbol}0.00`;
    }
    
    // Database prices are stored in USD format
    const basePriceUSD = parseFloat(databasePrice);
    
    // Convert from USD to selected currency
    const rate = exchangeRates[currency] || 1;
    const convertedPrice = basePriceUSD * rate;
    
    const currencyInfo = currencies.find(c => c.code === currency);
    const symbol = currencyInfo ? currencyInfo.symbol : '$';
    
    const roundedPrice = Math.round(convertedPrice * 100) / 100;
    
    console.log(`💰 Price conversion: $${basePriceUSD} USD → ${symbol}${roundedPrice} ${currency} (rate: ${rate})`);
    
    return `${symbol}${roundedPrice.toFixed(2)}`;
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode = currency) => {
    const currencyInfo = currencies.find(c => c.code === currencyCode);
    return currencyInfo ? currencyInfo.symbol : 'Rs.';
  };

  // Get currency name
  const getCurrencyName = (currencyCode = currency) => {
    const currencyInfo = currencies.find(c => c.code === currencyCode);
    return currencyInfo ? currencyInfo.name : 'Sri Lankan Rupee';
  };

  // Validate if a price seems to be in LKR (for debugging)
  const validateLKRPrice = (price) => {
    const numPrice = parseFloat(price);
    // Most products should cost more than 100 LKR
    // If price is very small (< 10), it might be in USD/EUR already
    return numPrice >= 10;
  };

  // Convert any non-LKR price back to LKR (emergency fix function)
  const convertToLKR = (price, fromCurrency) => {
    if (fromCurrency === 'LKR') return price;
    const rate = exchangeRates[fromCurrency] || 1;
    return price / rate; // Reverse conversion
  };

  // Reset currency to USD and clear localStorage (for debugging)
  const resetToUSD = () => {
    console.log('Resetting currency to USD...');
    setCurrency('USD');
    localStorage.removeItem('selectedCurrency');
    localStorage.removeItem('currencyChangeTimestamp');
    console.log('Currency reset complete. Should show USD prices everywhere.');
  };
  
  // Force clear all currency cache on component mount
  const clearCurrencyCache = () => {
    localStorage.removeItem('selectedCurrency');
    localStorage.removeItem('currencyChangeTimestamp');
    localStorage.removeItem('exchangeRates');
  };

  const value = {
    currency,
    currencies,
    exchangeRates,
    changeCurrency,
    convertPrice,
    formatPrice,
    getCurrencySymbol,
    getCurrencyName,
    updateExchangeRates,
    fetchExchangeRates,
    validateLKRPrice,
    convertToLKR,
    resetToUSD,
    clearCurrencyCache,
    setAdminCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;