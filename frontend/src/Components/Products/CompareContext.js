import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CompareContext = createContext(null);

const MAX_COMPARE_ITEMS = 4;

export const CompareProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('compareItems');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return [];
      }
    }
    return [];
  });

  const addToCompare = useCallback((product) => {
    setItems(prev => {
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return prev;
      }
      if (prev.some(item => item._id === product._id)) {
        return prev;
      }
      const newItems = [...prev, product];
      localStorage.setItem('compareItems', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setItems(prev => {
      const newItems = prev.filter(item => item._id !== productId);
      localStorage.setItem('compareItems', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setItems([]);
    localStorage.removeItem('compareItems');
  }, []);

  const isInCompare = useCallback((productId) => {
    return items.some(item => item._id === productId);
  }, [items]);

  const toggleCompare = useCallback((product) => {
    if (isInCompare(product._id)) {
      removeFromCompare(product._id);
    } else {
      addToCompare(product);
    }
  }, [isInCompare, addToCompare, removeFromCompare]);

  const canAddMore = useMemo(() => items.length < MAX_COMPARE_ITEMS, [items]);
  const count = useMemo(() => items.length, [items]);

  const value = useMemo(() => ({
    items,
    count,
    canAddMore,
    maxItems: MAX_COMPARE_ITEMS,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    toggleCompare
  }), [items, count, canAddMore, addToCompare, removeFromCompare, clearCompare, isInCompare, toggleCompare]);

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};
