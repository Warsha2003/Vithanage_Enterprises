import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import './PlaceOrder.css';

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { items, totals, fetchCart } = useCart();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      customer: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone
      },
      shippingAddress: {
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country
      },
      payment: {
        cardName: form.cardName,
        cardNumber: form.cardNumber,
        expiryMonth: form.expiryMonth,
        expiryYear: form.expiryYear,
        cvv: form.cvv
      },
      items: items,
      totals
    };
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        alert('Please log in to place your order.');
        navigate('/login');
        return;
      }
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log('ORDER SAVED:', data);
        alert('Successfully placed your order!');
        // Server clears the cart; sync client cache/UI
        localStorage.setItem('userCart', JSON.stringify([]));
        document.dispatchEvent(new Event('cartUpdated'));
        try { await fetchCart(); } catch (_) {}
        navigate('/');
      } else {
        console.error('Order creation failed:', data);
        alert(data?.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Order request error:', err);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="place-order-page">
      <div className="po-container">
        <h2>Place Your Order</h2>
        <div className="po-grid">
          <form className="po-form" onSubmit={onSubmit}>
            <fieldset>
              <legend>Contact</legend>
              <div className="po-row">
                <label>Full Name</label>
                <input name="fullName" value={form.fullName} onChange={onChange} required />
              </div>
              <div className="po-row">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} required />
              </div>
              <div className="po-row">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} required />
              </div>
            </fieldset>

            <fieldset>
              <legend>Shipping Address</legend>
              <div className="po-row">
                <label>Address Line 1</label>
                <input name="addressLine1" value={form.addressLine1} onChange={onChange} required />
              </div>
              <div className="po-row">
                <label>Address Line 2</label>
                <input name="addressLine2" value={form.addressLine2} onChange={onChange} />
              </div>
              <div className="po-row-3">
                <div>
                  <label>City</label>
                  <input name="city" value={form.city} onChange={onChange} required />
                </div>
                <div>
                  <label>State/Province</label>
                  <input name="state" value={form.state} onChange={onChange} required />
                </div>
                <div>
                  <label>Postal Code</label>
                  <input name="postalCode" value={form.postalCode} onChange={onChange} required />
                </div>
              </div>
              <div className="po-row">
                <label>Country</label>
                <input name="country" value={form.country} onChange={onChange} required />
              </div>
            </fieldset>

            <fieldset>
              <legend>Payment</legend>
              <div className="po-row">
                <label>Name on Card</label>
                <input name="cardName" value={form.cardName} onChange={onChange} required />
              </div>
              <div className="po-row">
                <label>Card Number</label>
                <input name="cardNumber" value={form.cardNumber} onChange={onChange} required />
              </div>
              <div className="po-row-3">
                <div>
                  <label>Expiry Month</label>
                  <input name="expiryMonth" value={form.expiryMonth} onChange={onChange} required />
                </div>
                <div>
                  <label>Expiry Year</label>
                  <input name="expiryYear" value={form.expiryYear} onChange={onChange} required />
                </div>
                <div>
                  <label>CVV</label>
                  <input name="cvv" value={form.cvv} onChange={onChange} required />
                </div>
              </div>
            </fieldset>

            <button className="po-submit" type="submit">Pay Now</button>
          </form>

          <aside className="po-summary">
            <h3>Order Summary</h3>
            <div className="po-summary-list">
              {items.map((it) => (
                <div className="po-summary-item" key={it.product?._id}>
                  <span>{it.product?.name} × {it.quantity}</span>
                  <span>${((it.product?.price || 0) * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="po-summary-line"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
            <div className="po-summary-line"><span>Shipping</span><span>${totals.shipping.toFixed(2)}</span></div>
            <div className="po-summary-line total"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;


