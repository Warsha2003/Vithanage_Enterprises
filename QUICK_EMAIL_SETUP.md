# Quick Email Setup Guide

## Step 1: Configure Email Credentials

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Windows Computer" (or your device)
   - Click "Generate"
   - Copy the 16-character password (e.g., "abcd efgh ijkl mnop")

3. **Update .env file**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop  # App password (remove spaces)
   FRONTEND_URL=http://localhost:3000
   ```

### Option B: Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
FRONTEND_URL=http://localhost:3000
```

## Step 2: Test Email System

### Test 1: Create a User Account
```bash
# Register a new user with YOUR real email
POST http://localhost:5000/api/auth/register
{
  "name": "Test User",
  "email": "your-real-email@gmail.com",
  "password": "password123"
}
```

### Test 2: Place an Order
- Login to frontend: http://localhost:3000
- Add products to cart
- Complete checkout
- **Check your email** for Order Confirmation

### Test 3: Password Reset
```bash
POST http://localhost:5000/api/auth/forgot-password
{
  "email": "your-real-email@gmail.com"
}
# Check your email for reset link
```

### Test 4: Admin Campaign (Requires Admin Account)
```bash
POST http://localhost:5000/api/email-campaigns/send-campaign
Headers: { "x-auth-token": "ADMIN_TOKEN" }
{
  "campaign": {
    "subject": "Test Sale",
    "title": "Summer Sale 2026",
    "message": "Get 50% off all products!",
    "discount": 50,
    "promoCode": "SUMMER50"
  }
}
# All users will receive promotional email
```

## Common Issues

### ❌ "Invalid login" Error
**Solution**: Use App Password, not your regular Gmail password

### ❌ "Less secure app" Error
**Solution**: Gmail no longer supports less secure apps. Must use App Password

### ❌ Email not received
**Checklist**:
- [ ] Check spam/junk folder
- [ ] Verify EMAIL_USER is correct
- [ ] Verify EMAIL_PASSWORD has no spaces
- [ ] Check backend console for errors
- [ ] Try sending to different email address

### ❌ "EAUTH" Error
**Solution**: 
1. Double-check email credentials
2. Regenerate App Password
3. Make sure 2FA is enabled (Gmail)

## Email Features

✅ **Order Confirmation** - Sent automatically when order is placed
✅ **Shipping Updates** - Sent when admin changes order status
✅ **Password Reset** - Secure token-based reset links
✅ **Promotional Campaigns** - Bulk emails to all users
✅ **Review Requests** - Sent 24hrs after delivery

## API Endpoints Summary

```
POST   /api/auth/forgot-password      # Request password reset
POST   /api/auth/reset-password       # Reset with token
POST   /api/email-campaigns/send-campaign  # Send promo (admin)
GET    /api/email-campaigns/target-users   # Get users list (admin)
```

## Production Tips

1. **Use professional email service**:
   - SendGrid (100 emails/day free)
   - Mailgun (5000/month free)
   - Amazon SES (cheapest)

2. **Add email queue** for large campaigns

3. **Track metrics**:
   - Open rates
   - Click rates
   - Conversion rates

4. **Include unsubscribe link** (required by law)

---

**Ready to use!** Backend is running on port 5000 with full email support.
