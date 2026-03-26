import React, { createContext, useContext, useState, useEffect } from 'react';

const StockAlertContext = createContext();

export const useStockAlert = () => {
  const context = useContext(StockAlertContext);
  if (!context) {
    throw new Error('useStockAlert must be used within a StockAlertProvider');
  }
  return context;
};

export const StockAlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's alerts
  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/stock-alerts/my-alerts', {
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create alert for product
  const createAlert = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login to set stock alerts');
    }

    try {
      const response = await fetch('http://localhost:5000/api/stock-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create alert');
      }

      await fetchAlerts();
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Remove alert for product
  const removeAlert = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/stock-alerts/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.product._id !== productId));
      }
    } catch (error) {
      console.error('Error removing alert:', error);
    }
  };

  // Check if product has alert
  const hasAlert = (productId) => {
    return alerts.some(a => a.product?._id === productId || a.product === productId);
  };

  // Load alerts on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAlerts();
    } else {
      setAlerts([]);
    }
  }, []);

  return (
    <StockAlertContext.Provider value={{
      alerts,
      loading,
      createAlert,
      removeAlert,
      hasAlert,
      fetchAlerts
    }}>
      {children}
    </StockAlertContext.Provider>
  );
};

export default StockAlertContext;
