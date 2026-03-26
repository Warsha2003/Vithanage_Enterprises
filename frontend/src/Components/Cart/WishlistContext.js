import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get fresh token each time
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchWishlist = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setItems([]);
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/wishlist', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
        localStorage.setItem('userWishlist', JSON.stringify(data.wishlist || []));
        document.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  }, []);

  // Listen for auth changes and fetch wishlist
  useEffect(() => {
    // Bootstrap from localStorage for instant UI
    const saved = localStorage.getItem('userWishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch (_) {}
    }
    
    // Initial fetch
    fetchWishlist();

    // Listen for auth changes
    const handleAuthChange = () => {
      const token = getToken();
      if (token) {
        fetchWishlist();
      } else {
        setItems([]);
        localStorage.removeItem('userWishlist');
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId) => {
    const token = getToken();
    console.log('🛒 Adding to wishlist:', productId, 'Token exists:', !!token);
    
    if (!token) {
      console.warn('❌ No token found for wishlist add');
      return { ok: false, message: 'NOT_AUTHENTICATED' };
    }
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
      
      const data = await res.json();
      console.log('📦 Wishlist API response:', res.status, data);
      
      if (res.ok) {
        setItems(data.wishlist || []);
        localStorage.setItem('userWishlist', JSON.stringify(data.wishlist || []));
        document.dispatchEvent(new Event('wishlistUpdated'));
        return { ok: true, message: 'Added to wishlist' };
      }
      console.warn('❌ Wishlist add failed:', data.message);
      return { ok: false, message: data.message || 'Failed to add' };
    } catch (e) {
      console.error('Error adding to wishlist:', e);
      return { ok: false, message: 'Error adding to wishlist' };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    const token = getToken();
    if (!token) return { ok: false };
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
        localStorage.setItem('userWishlist', JSON.stringify(data.wishlist || []));
        document.dispatchEvent(new Event('wishlistUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      console.error('Error removing from wishlist:', e);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleWishlist = useCallback(async (productId) => {
    const isInList = items.some(item => item._id === productId);
    if (isInList) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  }, [items, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId) => {
    return items.some(item => item._id === productId);
  }, [items]);

  const moveToCart = useCallback(async (productId) => {
    const token = getToken();
    if (!token) return { ok: false, message: 'NOT_AUTHENTICATED' };
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/move-to-cart', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
        localStorage.setItem('userWishlist', JSON.stringify(data.wishlist || []));
        document.dispatchEvent(new Event('wishlistUpdated'));
        document.dispatchEvent(new Event('cartUpdated'));
        return { ok: true, message: 'Moved to cart' };
      }
      return { ok: false };
    } catch (e) {
      console.error('Error moving to cart:', e);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearWishlist = useCallback(async () => {
    const token = getToken();
    if (!token) return { ok: false };
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/clear', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        setItems([]);
        localStorage.setItem('userWishlist', JSON.stringify([]));
        document.dispatchEvent(new Event('wishlistUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      console.error('Error clearing wishlist:', e);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const count = useMemo(() => items.length, [items]);

  const value = useMemo(() => ({
    items,
    loading,
    count,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    moveToCart,
    clearWishlist
  }), [items, loading, count, fetchWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, moveToCart, clearWishlist]);

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
