import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RecentlyViewedContext = createContext(null);

const MAX_ITEMS = 12;
const STORAGE_KEY = 'recentlyViewedProducts';

export const RecentlyViewedProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Save to localStorage whenever items change
  const saveToStorage = useCallback((newItems) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (_) {}
  }, []);

  const addToRecentlyViewed = useCallback((product) => {
    if (!product || !product._id) return;

    setItems(prev => {
      // Remove if already exists (to move it to front)
      const filtered = prev.filter(p => p._id !== product._id);
      
      // Add to front, keep essential fields only
      const newItem = {
        _id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand,
        rating: product.rating || product.averageRating,
        viewedAt: new Date().toISOString()
      };
      
      const newItems = [newItem, ...filtered].slice(0, MAX_ITEMS);
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  const clearRecentlyViewed = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({
    items,
    count: items.length,
    addToRecentlyViewed,
    clearRecentlyViewed
  }), [items, addToRecentlyViewed, clearRecentlyViewed]);

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
};
