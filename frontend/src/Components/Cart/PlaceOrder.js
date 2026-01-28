import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import './PlaceOrder.css';

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { items, totals, fetchCart, appliedPromotion, validatePromotionCode, removePromotion, promotionLoading } = useCart();
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionMessage, setPromotionMessage] = useState('');
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [showPromotions, setShowPromotions] = useState(false);
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
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod' | 'bank'
  const [cardType, setCardType] = useState('visa'); // 'visa' | 'master'
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim()) return;
    setPromotionMessage('');
    
    const result = await validatePromotionCode(promotionCode);
    if (result.success) {
      setPromotionMessage(`✓ ${result.message}`);
      setPromotionCode('');
    } else {
      setPromotionMessage(`✗ ${result.message}`);
    }
  };

  const handleRemovePromotion = () => {
    removePromotion();
    setPromotionMessage('');
    setPromotionCode('');
  };

  // Fetch available promotions on component load
  React.useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/promotions/active');
        if (response.ok) {
          const data = await response.json();
          setAvailablePromotions(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };
    fetchPromotions();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    // Contact
    if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) newErrors.phone = 'Invalid phone number';

    // Shipping
    if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State/Province is required';
  if (!form.postalCode.trim()) newErrors.postalCode = 'Postal Code is required';
  else if (!/^\d+$/.test(form.postalCode.replace(/\s+/g, ''))) newErrors.postalCode = 'Postal Code must be numeric';
    if (!form.country.trim()) newErrors.country = 'Country is required';

    // Payment: validate only when Pay Online is selected
    if (paymentMethod === 'online') {
      if (!form.cardName.trim()) newErrors.cardName = 'Name on Card is required';
      if (!form.cardNumber.trim()) newErrors.cardNumber = 'Card Number is required';
      else {
        // Allow spaces in input but validate digits-only length exactly 16
        const cardDigits = form.cardNumber.replace(/\s/g, '');
        if (!/^\d+$/.test(cardDigits)) {
          newErrors.cardNumber = 'Card Number must contain digits only';
        } else if (cardDigits.length !== 16) {
          newErrors.cardNumber = 'Card Number must be exactly 16 digits';
        }
      }

      // Expiry month/year validation
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      if (!form.expiryMonth.trim()) newErrors.expiryMonth = 'Expiry Month is required';
      else if (!/^(0[1-9]|1[0-2])$/.test(form.expiryMonth)) newErrors.expiryMonth = 'Invalid month';

      if (!form.expiryYear.trim()) newErrors.expiryYear = 'Expiry Year is required';
      else if (!/^\d{4}$/.test(form.expiryYear)) newErrors.expiryYear = 'Invalid year';
      else {
        const yearNum = parseInt(form.expiryYear, 10);
        const monthNum = parseInt(form.expiryMonth, 10);
        if (yearNum < currentYear) {
          newErrors.expiryYear = `Expiry year must be ${currentYear} or later`;
        } else if (monthNum < 1 || monthNum > 12) {
          newErrors.expiryMonth = 'Invalid month';
        } else if (yearNum === currentYear && monthNum < currentMonth) {
          newErrors.expiryMonth = 'Card has already expired';
        }
      }
      if (!form.cvv.trim()) newErrors.cvv = 'CVV is required';
      else {
        const digitsOnlyCvv = form.cvv.replace(/\D/g, '');
        if (!/^\d{3}$/.test(digitsOnlyCvv)) newErrors.cvv = 'Invalid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Only validate shipping and customer info (not payment for new flow)
    const newErrors = {};
    // Contact
    if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) newErrors.phone = 'Invalid phone number';

    // Shipping
    if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State/Province is required';
    if (!form.postalCode.trim()) newErrors.postalCode = 'Postal Code is required';
    else if (!/^\d+$/.test(form.postalCode.replace(/\s+/g, ''))) newErrors.postalCode = 'Postal Code must be numeric';
    if (!form.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

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
      items: items,
      totals,
      promotion: appliedPromotion
    };
    
    // Navigate to checkout page with order data
    navigate('/checkout', { state: { orderData: payload } });
  };

  return (
    <div className="place-order-page">
      <div className="po-container">
        <h2>Place Your Order</h2>
        <div className="po-grid">
          <form className="po-form" onSubmit={onSubmit} noValidate>
            <fieldset>
              <legend>Contact</legend>
              <div className="po-row">
                <label>Full Name</label>
                <input name="fullName" value={form.fullName} onChange={onChange} required />
                {errors.fullName && <span className="po-error">{errors.fullName}</span>}
              </div>
              <div className="po-row">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} required />
                {errors.email && <span className="po-error">{errors.email}</span>}
              </div>
              <div className="po-row">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} required />
                {errors.phone && <span className="po-error">{errors.phone}</span>}
              </div>
            </fieldset>

            <fieldset>
              <legend>Shipping Address</legend>
              <div className="po-row">
                <label>Address Line 1</label>
                <input name="addressLine1" value={form.addressLine1} onChange={onChange} required />
                {errors.addressLine1 && <span className="po-error">{errors.addressLine1}</span>}
              </div>
              <div className="po-row">
                <label>Address Line 2</label>
                <input name="addressLine2" value={form.addressLine2} onChange={onChange} />
              </div>
              <div className="po-row-3">
                <div>
                  <label>City</label>
                  <input name="city" value={form.city} onChange={onChange} required />
                  {errors.city && <span className="po-error">{errors.city}</span>}
                </div>
                <div>
                  <label>State/Province</label>
                  <input name="state" value={form.state} onChange={onChange} required />
                  {errors.state && <span className="po-error">{errors.state}</span>}
                </div>
                <div>
                  <label>Postal Code</label>
                  <input name="postalCode" value={form.postalCode} onChange={onChange} required />
                  {errors.postalCode && <span className="po-error">{errors.postalCode}</span>}
                </div>
              </div>
              <div className="po-row">
                <label>Country</label>
                <input name="country" value={form.country} onChange={onChange} required />
                {errors.country && <span className="po-error">{errors.country}</span>}
              </div>
            </fieldset>

            <button className="po-submit" type="submit">Proceed to Payment</button>
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
            {totals.discount > 0 && (
              <div className="po-summary-line discount">
                <span>Discount ({appliedPromotion?.code})</span>
                <span>-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="po-summary-line"><span>Shipping</span><span>${totals.shipping.toFixed(2)}</span></div>
            <div className="po-summary-line total"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
            
            <div className="po-promotion-section">
              {!appliedPromotion ? (
                <>
                  <div className="po-promotion-input">
                    <input
                      type="text"
                      placeholder="Enter promotion code"
                      value={promotionCode}
                      onChange={(e) => setPromotionCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromotion()}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromotion}
                      disabled={promotionLoading || !promotionCode.trim()}
                    >
                      {promotionLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  
                  {availablePromotions.length > 0 && (
                    <div className="po-available-promotions">
                      <button 
                        type="button" 
                        className="show-promotions-btn"
                        onClick={() => setShowPromotions(!showPromotions)}
                      >
                        {showPromotions ? 'Hide' : 'Show'} Available Promotions ({availablePromotions.length})
                      </button>
                      
                      {showPromotions && (
                        <div className="promotions-list">
                          {availablePromotions.map(promo => (
                            <div key={promo._id} className="promotion-item">
                              <div className="promo-header">
                                <strong>{promo.code}</strong>
                                <span className="promo-discount">
                                  Save {promo.discountValue}{promo.type === 'percentage' ? '%' : '$'}
                                </span>
                              </div>
                              <p className="promo-description">{promo.description}</p>
                              <button 
                                type="button" 
                                className="use-promo-btn"
                                onClick={() => {
                                  setPromotionCode(promo.code);
                                  setShowPromotions(false);
                                }}
                              >
                                Use This Code
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {promotionMessage && (
                    <div className={`po-promotion-message ${promotionMessage.startsWith('✓') ? 'success' : 'error'}`}>
                      {promotionMessage}
                    </div>
                  )}
                </>
              ) : (
                <div className="po-applied-promotion">
                  <span>✓ Code "{appliedPromotion.code}" applied</span>
                  <button type="button" onClick={handleRemovePromotion}>Remove</button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;


