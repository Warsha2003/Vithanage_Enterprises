# Email Notification System Documentation

## Overview
Complete email notification system for Vithanage Enterprises e-commerce platform with beautiful HTML templates and automated sending.

## Features Implemented

### 1. **Order Confirmation Emails**
- **Trigger**: Automatically sent when a new order is created
- **Content**: Order details, items purchased, total amount, shipping address
- **Template**: Professional HTML with gradient header, itemized list, call-to-action button

### 2. **Shipping Update Emails**
- **Trigger**: Sent when admin updates order processing status
- **Statuses**: Processing, Shipped, Out for Delivery, Delivered
- **Content**: Order tracking information, current status, tracking number (if available)
- **Special**: Includes "Write a Review" button when order is delivered

### 3. **Password Reset Emails**
- **Trigger**: User requests password reset via `/api/auth/forgot-password`
- **Content**: Secure reset link with token (expires in 1 hour)
- **Security**: Tokens are hashed in database, generic response for non-existent emails
- **Template**: Security warnings, expiration notice, one-click reset button

### 4. **Promotional Campaign Emails**
- **Trigger**: Admin sends bulk email via `/api/email-campaigns/send-campaign`
- **Content**: Customizable title, message, discount %, promo code, validity period
- **Targeting**: Send to all users or specific user list
- **Features**: Batch sending with error tracking, results summary

### 5. **Review Request Emails**
- **Trigger**: Automatically sent 24 hours after order is marked as delivered
- **Content**: Order details, product list, review link
- **Purpose**: Encourage customer feedback and improve product ratings

## API Endpoints

### Authentication & Password Reset
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }

POST /api/auth/reset-password
Body: { "token": "reset_token", "newPassword": "newpass123" }
```

### Email Campaigns (Admin Only)
```
POST /api/email-campaigns/send-campaign
Headers: { "x-auth-token": "admin_token" }
Body: {
  "campaign": {
    "subject": "Special Offer!",
    "title": "Summer Sale 2026",
    "message": "Get amazing discounts on all products!",
    "discount": 25,
    "promoCode": "SUMMER25",
    "validUntil": "2026-08-31"
  },
  "targetUsers": ["user_id_1", "user_id_2"] // Optional, omit to send to all
}

GET /api/email-campaigns/target-users
Headers: { "x-auth-token": "admin_token" }
Response: { "total": 150, "users": [...] }
```

## Configuration

### 1. Environment Variables (.env)
```env
# Email Service Configuration
EMAIL_SERVICE=gmail              # gmail, outlook, yahoo, etc.
EMAIL_USER=your-email@gmail.com  # Your email address
EMAIL_PASSWORD=your-app-password # App-specific password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended)
1. Go to Google Account Settings → Security
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
4. Use this password in `EMAIL_PASSWORD`

### 3. Other Email Services
```javascript
// Outlook/Hotmail
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com

// Yahoo
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com

// Custom SMTP
// Modify emailService.js to use custom SMTP settings:
{
  host: 'smtp.yourdomain.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
}
```

## Email Templates

All templates include:
- ✅ Mobile-responsive design
- ✅ Professional gradient headers
- ✅ Call-to-action buttons
- ✅ Company branding
- ✅ Footer with copyright and unsubscribe
- ✅ Inline CSS for email client compatibility

### Template Customization

Edit `/BackEnd/Services/emailService.js` to customize:
- Colors (change gradient values)
- Logo (add image URL)
- Content structure
- Button links
- Footer text

Example color change:
```javascript
// Change from purple gradient to blue
.header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
.button { background: #3b82f6; }
```

## Automated Emails Flow

### Order Lifecycle
```
1. User places order
   → Order Confirmation Email sent immediately

2. Admin approves order
   → (No email)

3. Admin updates to "Preparing"
   → Processing Email sent

4. Admin updates to "Shipped"
   → Shipping Update Email sent

5. Admin updates to "Out for Delivery"
   → Delivery Update Email sent

6. Admin updates to "Delivered"
   → Delivery Confirmation Email sent
   → 24 hours later: Review Request Email sent
```

### Password Reset Flow
```
1. User clicks "Forgot Password"
   → POST /api/auth/forgot-password
   → Reset Email sent with token link

2. User clicks link in email
   → Opens frontend reset page with token

3. User enters new password
   → POST /api/auth/reset-password
   → Password updated, token invalidated
```

## Testing

### 1. Test Order Confirmation
```bash
# Create an order (requires authentication)
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -d '{
    "items": [...],
    "shippingAddress": {...},
    "payment": {...}
  }'
```

### 2. Test Password Reset
```bash
# Request reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset password (use token from email)
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_from_email",
    "newPassword": "newpass123"
  }'
```

### 3. Test Promotional Campaign
```bash
curl -X POST http://localhost:5000/api/email-campaigns/send-campaign \
  -H "Content-Type: application/json" \
  -H "x-auth-token: ADMIN_TOKEN" \
  -d '{
    "campaign": {
      "subject": "Test Campaign",
      "title": "Flash Sale!",
      "message": "50% off everything!",
      "discount": 50,
      "promoCode": "TEST50"
    }
  }'
```

## Troubleshooting

### Email Not Sending
1. **Check credentials**: Verify EMAIL_USER and EMAIL_PASSWORD in .env
2. **Gmail security**: Ensure App Password is used, not regular password
3. **Check logs**: Look for error messages in backend console
4. **Test connection**: Run test email manually

### Gmail "Less Secure App" Error
- Solution: Use App Password instead of account password
- Link: https://support.google.com/accounts/answer/185833

### Emails Going to Spam
1. Add SPF record to your domain
2. Use authenticated domain email
3. Avoid spam trigger words in subject
4. Test with different email clients

### Token Expired
- Reset tokens expire in 1 hour
- User must request new reset link
- Tokens are single-use only

## Production Deployment

### Important Changes
1. **Use environment variables**: Never commit credentials
2. **Use professional email**: Switch from Gmail to business domain
3. **Add email queue**: Use Bull or similar for large campaigns
4. **Add rate limiting**: Prevent email spam/abuse
5. **Add unsubscribe**: Implement unsubscribe functionality
6. **Monitor**: Track email delivery rates

### Recommended Services
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5000 emails/month free
- **Amazon SES**: Very cheap, high deliverability
- **Postmark**: Transactional email focused

### Example SendGrid Setup
```javascript
// Install: npm install @sendgrid/mail
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'user@example.com',
  from: 'noreply@vithanageenterprises.com',
  subject: 'Order Confirmation',
  html: htmlTemplate
};

await sgMail.send(msg);
```

## Email Analytics

Track email performance:
- Open rates (requires tracking pixels)
- Click-through rates (use tracked links)
- Conversion rates (promo code usage)
- Bounce rates (invalid emails)

## Best Practices

1. **Always provide value**: Don't spam customers
2. **Mobile-first**: 60%+ of emails opened on mobile
3. **Clear CTAs**: One primary action per email
4. **Personalization**: Use customer name and order details
5. **Test thoroughly**: Send test emails before campaigns
6. **Timing matters**: Send at optimal times (avoid weekends)
7. **A/B testing**: Test subject lines and content
8. **Compliance**: Include unsubscribe link, privacy policy

## Files Created

```
BackEnd/
├── Services/
│   └── emailService.js          # Email sending service & templates
├── Controllers/
│   └── emailCampaignController.js  # Promotional campaign logic
├── Routes/
│   └── emailCampaignRoutes.js   # Campaign API endpoints
├── Models/
│   └── User.js                  # Added resetPasswordToken fields
└── .env.example                 # Updated with email config
```

## Support

For issues or questions:
1. Check backend console logs
2. Verify .env configuration
3. Test with single email first
4. Review emailService.js for errors

---

**Email System Status**: ✅ Fully Functional
**Last Updated**: January 27, 2026
