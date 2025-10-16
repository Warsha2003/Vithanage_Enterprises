import React from 'react';
import './CartDrawer.css';
import { useCart } from './CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { isOpen, closeCart, items, updateQuantity, removeItem, totals, loading } = useCart();
  const { formatPrice } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={closeCart}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3 className="cart-drawer-title">Your Cart ({totals.count})</h3>
          <button className="cart-drawer-close" onClick={closeCart}>×</button>
        </div>
        <div className="cart-drawer-content">
          {items.length === 0 ? (
            <div className="empty-cart">Your cart is empty.</div>
          ) : (
            items.map((item) => (
              <div className="cart-item-row" key={item.product?._id || Math.random()}>
                <img className="cart-item-image" src={item.product?.imageUrl || 'https://via.placeholder.com/64?text=Img'} alt={item.product?.name || 'Product'} />
                <div>
                  <p className="cart-item-name">{item.product?.name}</p>
                  <p className="cart-item-brand">{item.product?.brand}</p>
                  <div className="cart-item-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.product._id, Math.max(1, item.quantity - 1))} disabled={loading}>-</button>
                    <input className="qty-input" type="number" value={item.quantity} onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value || 1));
                      updateQuantity(item.product._id, v);
                    }} />
                    <button className="qty-btn" onClick={() => updateQuantity(item.product._id, item.quantity + 1)} disabled={loading}>+</button>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatPrice(item.product?.price || 0)}</span>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.product._id)} disabled={loading}>Remove</button>
                </div>
                <div style={{ fontWeight: 700 }}>{formatPrice((item.product?.price || 0) * item.quantity)}</div>
              </div>
            ))
          )}
        </div>
        <div className="cart-drawer-footer">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="totals-row">
            <span>Shipping</span>
            <span>{formatPrice(totals.shipping)}</span>
          </div>
          <div className="totals-row" style={{ fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
          <button className="checkout-btn" onClick={() => { closeCart(); navigate('/place-order'); }} disabled={loading || items.length === 0}>Place Order</button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;


