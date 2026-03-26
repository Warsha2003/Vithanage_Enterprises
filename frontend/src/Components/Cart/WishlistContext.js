import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);

const readAuth = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return { token, userStr };
};

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const { token } = readAuth();

  const fetchWishlist = useCallback(async () => {
    try {
      if (!token) {
        setItems([]);
        return;
      }
      const res = await fetch('http://localhost:5000/api/wishlist', {
        headers: { 
          'x-auth-token': token, 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
        localStorage.setItem('userWishlist', JSON.stringify(data.wishlist || []));
        document.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (_) {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    // bootstrap from localStorage for instant UI
    const saved = localStorage.getItem('userWishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch (_) {}
    }
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId) => {
    if (!token) return { ok: false, message: 'NOT_AUTHENTICATED' };
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
        localStorage.setItem('userWishlist', JSON.stringify(data.wishlist || []));
        document.dispatchEvent(new Event('wishlistUpdated'));
        return { ok: true, message: 'Added to wishlist' };
      }
      const errorData = await res.json();
      return { ok: false, message: errorData.message || 'Failed to add' };
    } catch (e) {
      return { ok: false, message: 'Error adding to wishlist' };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!token) return { ok: false };
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: { 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
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
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

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
    if (!token) return { ok: false, message: 'NOT_AUTHENTICATED' };
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/move-to-cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
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
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const clearWishlist = useCallback(async () => {
    if (!token) return { ok: false };
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wishlist/clear', {
        method: 'DELETE',
        headers: { 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setItems([]);
        localStorage.setItem('userWishlist', JSON.stringify([]));
        document.dispatchEvent(new Event('wishlistUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

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
