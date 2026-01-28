# 🚀 Quick Setup Guide - Payment Gateway

## Prerequisites
- Node.js installed
- MongoDB running
- Stripe account (free at stripe.com)

## Step-by-Step Setup

### 1️⃣ Get Stripe API Keys (2 minutes)

1. Go to https://dashboard.stripe.com/register
2. Create a free account (no credit card needed for test mode)
3. Navigate to **Developers → API Keys**
4. You'll see two keys:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend - keep this private!)

### 2️⃣ Backend Configuration

1. Create `.env` file in `BackEnd/` folder:
```bash
cd BackEnd
copy .env.example .env
```

2. Edit `BackEnd/.env` and add your Stripe secret key:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
MONGODB_URI=mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/test
PORT=5000
```

3. Packages are already installed! Just restart the server:
```bash
npm start
```

### 3️⃣ Frontend Configuration

1. Create `.env` file in `frontend/` folder:
```bash
cd frontend
copy .env.example .env
```

2. Edit `frontend/.env` and add your Stripe publishable key:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

3. **IMPORTANT:** Also update the key in `frontend/src/Components/Cart/Checkout.js` (Line 10):
```javascript
const stripePromise = loadStripe('pk_test_YOUR_ACTUAL_KEY_HERE');
```

4. Packages are already installed! Just restart:
```bash
npm start
```

### 4️⃣ Test the Payment System

1. Start backend: `cd BackEnd && npm start`
2. Start frontend: `cd frontend && npm start`
3. Go to http://localhost:3000
4. Add products to cart
5. Go to checkout
6. Use Stripe test card:
   - **Card Number:** 4242 4242 4242 4242
   - **Expiry:** 12/25 (any future date)
   - **CVV:** 123 (any 3 digits)
   - **ZIP:** 12345 (any 5 digits)
7. Complete payment and see order confirmation!

## 🎯 What You Get

### New Pages:
- ✅ `/checkout` - Secure payment page
- ✅ `/order-confirmation` - Success page after payment

### Payment Methods:
- ✅ Credit/Debit Cards (Visa, MasterCard, Amex, etc.)
- ✅ Cash on Delivery (COD)

### Features:
- ✅ Secure Stripe payment processing
- ✅ Real-time payment validation
- ✅ Order tracking with payment status
- ✅ Admin refund capabilities
- ✅ Payment history for users
- ✅ Beautiful checkout UI

## 🧪 Test Cards

| Card Number | Result |
|------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Declined |
| 4000 0000 0000 9995 | ❌ Insufficient Funds |
| 4000 0027 6000 3184 | 🔐 3D Secure Required |

## 🔍 Verify Everything Works

### Check Backend:
```bash
# In BackEnd folder
npm start
# Should see: "Server running on port 5000" with no errors
```

### Check Frontend:
```bash
# In frontend folder
npm start
# Should open browser at http://localhost:3000
```

### Test Complete Flow:
1. ✅ Add product to cart
2. ✅ Click "Proceed to Checkout"
3. ✅ Fill shipping address
4. ✅ Click "Proceed to Payment"
5. ✅ See Checkout page with Stripe payment form
6. ✅ Enter test card: 4242 4242 4242 4242
7. ✅ Click "Pay Now"
8. ✅ See Order Confirmation page
9. ✅ Check "My Orders" to see the order

## 📂 File Changes Summary

### New Files Created:
```
BackEnd/
├── Models/Payment.js ✨
├── Controllers/paymentController.js ✨
├── Routes/paymentRoutes.js ✨
└── .env.example ✨

frontend/
├── src/Components/Cart/
│   ├── Checkout.js ✨
│   ├── Checkout.css ✨
│   ├── PaymentForm.js ✨
│   ├── PaymentForm.css ✨
│   ├── OrderConfirmation.js ✨
│   └── OrderConfirmation.css ✨
└── .env.example ✨
```

### Modified Files:
```
BackEnd/
├── app.js (added payment routes + dotenv)
└── Models/Order.js (updated payment fields)

frontend/
├── src/App.js (added new routes)
└── src/Components/Cart/PlaceOrder.js (updated to use new checkout)
```

## ⚠️ Important Notes

1. **Never commit `.env` files** - They contain secret keys
2. **Test mode is free** - No real charges in test mode
3. **Live mode requires verification** - Stripe will ask for business details
4. **Keep secret key private** - Only use in backend, never in frontend
5. **HTTPS required for production** - Stripe requires secure connection

## 🆘 Troubleshooting

**Backend won't start?**
- Check if `.env` file exists in `BackEnd/` folder
- Verify Stripe secret key starts with `sk_test_`
- Make sure port 5000 is not in use

**Payment form doesn't show?**
- Check browser console for errors
- Verify publishable key is updated in `Checkout.js`
- Make sure frontend `.env` has the publishable key

**Payment fails?**
- Use test card: 4242 4242 4242 4242
- Check backend console for errors
- Verify MongoDB is connected

## 📚 Full Documentation

See `PAYMENT_GATEWAY_DOCUMENTATION.md` for complete details on:
- API endpoints
- Database schema
- Security features
- Admin features
- Future enhancements

---

## ✅ You're Done!

Your e-commerce site now has a professional payment gateway! 🎉

Questions? Check the full documentation or review the code comments.
