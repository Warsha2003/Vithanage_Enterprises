const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // For Gmail, use App Password
    }
  });
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Vithanage Enterprises" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Order Confirmation Email
const sendOrderConfirmationEmail = async (order, user) => {
  const subject = `Order Confirmation - #${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .product-item { border-bottom: 1px solid #eee; padding: 15px 0; }
        .product-item:last-child { border-bottom: none; }
        .total { font-size: 20px; font-weight: bold; color: #667eea; margin-top: 20px; text-align: right; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase</p>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>We're excited to let you know that we've received your order and it's being processed.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
            
            <h3 style="margin-top: 20px;">Items Ordered:</h3>
            ${order.items.map(item => `
              <div class="product-item">
                <strong>${item.productName || item.name}</strong><br>
                Quantity: ${item.quantity} × Rs. ${item.price.toLocaleString()}<br>
                <strong>Subtotal: Rs. ${(item.quantity * item.price).toLocaleString()}</strong>
              </div>
            `).join('')}
            
            <div class="total">
              Total Amount: Rs. ${(order.totalAmount || order.totals?.total || 0).toLocaleString()}
            </div>
          </div>
          
          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>
              ${order.shippingAddress.name || user.name}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city ? order.shippingAddress.city + '<br>' : ''}
              ${order.shippingAddress.postalCode ? order.shippingAddress.postalCode + '<br>' : ''}
              Phone: ${order.shippingAddress.phone || user.phone}
            </p>
          </div>
          
          <p>You can track your order status in your account dashboard.</p>
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-orders" class="button">View Order Status</a>
          </center>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Vithanage Enterprises. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
};

// Shipping Update Email
const sendShippingUpdateEmail = async (order, user, status) => {
  const statusMessages = {
    'Processing': 'Your order is being prepared',
    'Shipped': 'Your order has been shipped',
    'Out for Delivery': 'Your order is out for delivery',
    'Delivered': 'Your order has been delivered'
  };
  
  const subject = `Order Update - ${status} - #${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
          <div class="status-badge">${status}</div>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>${statusMessages[status] || 'Your order status has been updated'}.</p>
          
          <div class="order-info">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Current Status:</strong> ${status}</p>
            ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          </div>
          
          ${status === 'Delivered' ? `
            <p>We hope you enjoy your purchase! We'd love to hear your feedback.</p>
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reviews" class="button">Write a Review</a>
            </center>
          ` : `
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-orders" class="button">Track Your Order</a>
            </center>
          `}
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Vithanage Enterprises. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
};

// Password Reset Email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request - Vithanage Enterprises';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password for your Vithanage Enterprises account.</p>
          
          <center>
            <a href="${resetUrl}" class="button">Reset Your Password</a>
          </center>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: white; padding: 10px; word-wrap: break-word; border-radius: 5px;">${resetUrl}</p>
          
          <div class="alert">
            <strong>⚠️ Security Notice:</strong><br>
            • This link will expire in 1 hour<br>
            • If you didn't request this reset, please ignore this email<br>
            • Never share this link with anyone
          </div>
          
          <p>For security reasons, this password reset link will expire in 1 hour.</p>
          
          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Vithanage Enterprises. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
};

// Promotional Campaign Email
const sendPromotionalEmail = async (user, campaign) => {
  const subject = campaign.subject || 'Special Offer from Vithanage Enterprises';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .promo-badge { display: inline-block; background: #ff6b6b; color: white; padding: 15px 25px; border-radius: 25px; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; }
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .product-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${campaign.title || 'Special Offer Just for You!'}</h1>
          ${campaign.discount ? `<div class="promo-badge">${campaign.discount}% OFF</div>` : ''}
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>${campaign.message || 'We have an exciting offer just for you!'}</p>
          
          ${campaign.promoCode ? `
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666;">Use Promo Code</p>
              <p style="margin: 10px 0; font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${campaign.promoCode}</p>
              <p style="margin: 0; font-size: 12px; color: #999;">Valid until ${campaign.validUntil ? new Date(campaign.validUntil).toLocaleDateString() : 'limited time'}</p>
            </div>
          ` : ''}
          
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" class="button">Shop Now</a>
          </center>
          
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            *Terms and conditions apply. Offer valid while stocks last.
          </p>
          
          <div class="footer">
            <p>Don't want to receive promotional emails? <a href="#">Unsubscribe</a></p>
            <p>&copy; ${new Date().getFullYear()} Vithanage Enterprises. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
};

// Review Request Email
const sendReviewRequestEmail = async (order, user) => {
  const subject = 'How was your experience? - Share Your Review';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .product-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; align-items: center; }
        .stars { font-size: 24px; color: #ffc107; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>We'd Love Your Feedback!</h1>
          <div class="stars">⭐⭐⭐⭐⭐</div>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Thank you for your recent purchase! We hope you're enjoying your new products.</p>
          <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Your Recent Order (#${order.orderNumber})</h3>
            ${order.items.slice(0, 3).map(item => `
              <div class="product-item">
                <div>
                  <strong>${item.productName || item.name}</strong><br>
                  <small>Quantity: ${item.quantity}</small>
                </div>
              </div>
            `).join('')}
          </div>
          
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reviews?order=${order._id}" class="button">Write a Review</a>
          </center>
          
          <p>It only takes a minute and means the world to us!</p>
          
          <div class="footer">
            <p>Thank you for choosing Vithanage Enterprises</p>
            <p>&copy; ${new Date().getFullYear()} Vithanage Enterprises. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendShippingUpdateEmail,
  sendPasswordResetEmail,
  sendPromotionalEmail,
  sendReviewRequestEmail
};
