import React, { createContext, useContext, useState, useEffect } from 'react';

const LoyaltyContext = createContext();

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within LoyaltyProvider');
  }
  return context;
};

export const LoyaltyProvider = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [pointsValue, setPointsValue] = useState(0);
  const [config, setConfig] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch points when user logs in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMyPoints();
    } else {
      setPoints(0);
      setPointsValue(0);
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('token');
      if (newToken) {
        fetchMyPoints();
      } else {
        setPoints(0);
        setPointsValue(0);
        setTransactions([]);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-token': token
    };
  };

  const fetchMyPoints = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/loyalty/my-points', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setPoints(data.currentPoints);
        setPointsValue(data.pointsValue);
        setConfig(data.config);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching loyalty points:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (pointsToRedeem, orderId = null) => {
    try {
      const response = await fetch('http://localhost:5000/api/loyalty/redeem', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pointsToRedeem, orderId })
      });

      const data = await response.json();

      if (response.ok) {
        setPoints(data.remainingPoints);
        setPointsValue(data.remainingPoints * (config?.pointsValueLKR || 1));
        return { success: true, discountValue: data.discountValue };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      return { success: false, error: 'Failed to redeem points' };
    }
  };

  const calculateDiscount = (pointsToUse) => {
    if (!config) return 0;
    return pointsToUse * config.pointsValueLKR;
  };

  const calculatePointsForOrder = (orderTotal) => {
    if (!config) return 0;
    return Math.floor(orderTotal / 100) * config.pointsPer100LKR;
  };

  const value = {
    points,
    pointsValue,
    config,
    transactions,
    loading,
    fetchMyPoints,
    redeemPoints,
    calculateDiscount,
    calculatePointsForOrder
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
};

export default LoyaltyContext;
