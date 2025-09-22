import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const readAuth = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return { token, userStr };
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promotionLoading, setPromotionLoading] = useState(false);

  const { token } = readAuth();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const fetchCart = useCallback(async () => {
    try {
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/cart', {
        headers: { 
          'x-auth-token': token, 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        localStorage.setItem('userCart', JSON.stringify(data));
        document.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (_) {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    // bootstrap from localStorage for instant UI
    const saved = localStorage.getItem('userCart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch (_) {}
    }
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (productId, qty = 1) => {
    if (!token) return { ok: false, message: 'NOT_AUTHENTICATED' };
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: qty })
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        localStorage.setItem('userCart', JSON.stringify(data));
        document.dispatchEvent(new Event('cartUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (!token) return { ok: false };
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/cart/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        localStorage.setItem('userCart', JSON.stringify(data));
        document.dispatchEvent(new Event('cartUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const removeItem = useCallback(async (productId) => {
    if (!token) return { ok: false };
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: { 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        localStorage.setItem('userCart', JSON.stringify(data));
        document.dispatchEvent(new Event('cartUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const clearCart = useCallback(async () => {
    if (!token) return { ok: false };
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/cart/clear', {
        method: 'DELETE',
        headers: { 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setItems([]);
        localStorage.setItem('userCart', JSON.stringify([]));
        document.dispatchEvent(new Event('cartUpdated'));
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (it.product?.price || 0) * it.quantity, 0);
    const shipping = items.length > 0 ? 0 : 0;
    const discount = appliedPromotion ? appliedPromotion.discountAmount : 0;
    const total = subtotal + shipping - discount;
    const count = items.reduce((sum, it) => sum + it.quantity, 0);
    return { subtotal, shipping, discount, total, count };
  }, [items, appliedPromotion]);

  // Promotion methods
  const validatePromotionCode = useCallback(async (code) => {
    if (!token || !code.trim()) return { success: false, message: 'Invalid input' };
    
    setPromotionLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: code.trim(),
          orderValue: totals.subtotal,
          products: items.map(item => item.product._id)
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAppliedPromotion({
          code: code.trim(),
          promotionId: data.data.promotionId,
          discountAmount: data.data.discountAmount,
          promotion: data.data.promotion
        });
        return { success: true, message: data.message, discount: data.data.discountAmount };
      } else {
        return { success: false, message: data.message || 'Invalid promotion code' };
      }
    } catch (error) {
      return { success: false, message: 'Error validating promotion code' };
    } finally {
      setPromotionLoading(false);
    }
  }, [token, totals.subtotal, items]);

  const removePromotion = useCallback(() => {
    setAppliedPromotion(null);
  }, []);

  const placeOrder = useCallback(async () => {
    // Placeholder: depends on order API; for now just clear
    const res = await clearCart();
    return res;
  }, [clearCart]);

  const value = useMemo(() => ({
    items,
    isOpen,
    loading,
    totals,
    appliedPromotion,
    promotionLoading,
    openCart,
    closeCart,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    placeOrder,
    validatePromotionCode,
    removePromotion
  }), [items, isOpen, loading, totals, appliedPromotion, promotionLoading, openCart, closeCart, fetchCart, addItem, updateQuantity, removeItem, clearCart, placeOrder, validatePromotionCode, removePromotion]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};


