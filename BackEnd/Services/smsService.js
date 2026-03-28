// SMS & WhatsApp Service - Twilio Integration
// To enable: Sign up at https://www.twilio.com (free trial available)
// Add these to your .env file:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone_number
// TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (Twilio Sandbox number, or your approved WhatsApp sender)

const twilio = require('twilio');

// Initialize Twilio client (will be null if credentials not set)
let client = null;

const initTwilio = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS service initialized');
    return true;
  }
  
  console.log('ℹ️ SMS service not configured (Twilio credentials missing)');
  return false;
};

// Format phone number for Sri Lanka
const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Sri Lanka country code if not present
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('94')) {
    cleaned = '94' + cleaned;
  }
  
  return '+' + cleaned;
};

// Send SMS
const sendSMS = async (to, message) => {
  if (!client) {
    console.log('SMS not sent (service not configured):', message.substring(0, 50));
    return { success: false, reason: 'SMS service not configured' };
  }

  try {
    const formattedNumber = formatPhoneNumber(to);
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log(`SMS sent to ${formattedNumber}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

// Order status SMS templates
const orderStatusMessages = {
  confirmed: (orderNumber) => 
    `Vithanage Enterprises: Your order #${orderNumber} has been confirmed! We'll notify you when it ships. Thank you for shopping with us! 🛍️`,
  
  processing: (orderNumber) => 
    `Vithanage Enterprises: Your order #${orderNumber} is being processed. We'll update you soon!`,
  
  shipped: (orderNumber, trackingNumber = '') => 
    `Vithanage Enterprises: Great news! Your order #${orderNumber} has been shipped! ${trackingNumber ? `Track: ${trackingNumber}` : ''} 📦`,
  
  delivered: (orderNumber) => 
    `Vithanage Enterprises: Your order #${orderNumber} has been delivered! Thank you for shopping with us. Please rate your experience! ⭐`,
  
  cancelled: (orderNumber) => 
    `Vithanage Enterprises: Your order #${orderNumber} has been cancelled. If you didn't request this, please contact us.`,
  
  refundProcessed: (orderNumber, amount) => 
    `Vithanage Enterprises: Refund of LKR ${amount} for order #${orderNumber} has been processed. It may take 3-5 business days to appear.`
};

// Send order status SMS
const sendOrderStatusSMS = async (phone, status, orderNumber, extra = {}) => {
  const template = orderStatusMessages[status];
  if (!template) {
    console.log(`No SMS template for status: ${status}`);
    return { success: false, reason: 'Unknown status' };
  }

  let message;
  if (status === 'shipped') {
    message = template(orderNumber, extra.trackingNumber);
  } else if (status === 'refundProcessed') {
    message = template(orderNumber, extra.amount);
  } else {
    message = template(orderNumber);
  }

  return sendSMS(phone, message);
};

// Send promotional SMS
const sendPromotionalSMS = async (phone, title, discount) => {
  const message = `Vithanage Enterprises: ${title}! Get ${discount}% off on selected items. Shop now at vithanageenterprises.lk 🎉 Reply STOP to unsubscribe.`;
  return sendSMS(phone, message);
};

// Send OTP SMS
const sendOTPSMS = async (phone, otp) => {
  const message = `Vithanage Enterprises: Your verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
};

// Send WhatsApp message via Twilio
const sendWhatsApp = async (to, message) => {
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!from) {
    console.log('WhatsApp notification not sent: TWILIO_WHATSAPP_FROM missing in environment');
    return { success: false, reason: 'TWILIO_WHATSAPP_FROM not configured' };
  }

  if (!client) {
    console.log('WhatsApp not sent (Twilio service not configured):', message.substring(0, 50));
    return { success: false, reason: 'Twilio service not configured' };
  }

  try {
    const formattedNumber = 'whatsapp:' + formatPhoneNumber(to);

    const result = await client.messages.create({
      body: message,
      from,
      to: formattedNumber
    });

    console.log(`WhatsApp sent to ${formattedNumber}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
};

// WhatsApp order confirmation message
const sendOrderConfirmationWhatsApp = async (phone, orderNumber, items, total) => {
  const itemList = Array.isArray(items)
    ? items.map(i => `• ${i.name} x${i.quantity}`).join('\n')
    : '';

  const message =
    `🛍️ *Vithanage Enterprises*\n\n` +
    `Thank you for your order!\n\n` +
    `*Order #${orderNumber}* has been placed successfully.\n\n` +
    (itemList ? `*Items:*\n${itemList}\n\n` : '') +
    `*Total: LKR ${total}*\n\n` +
    `We will notify you once your order is confirmed and shipped. 📦`;

  return sendWhatsApp(phone, message);
};

// WhatsApp order status update message
const sendOrderStatusWhatsApp = async (phone, orderNumber, status) => {
  const statusMessages = {
    confirmed:  `✅ *Vithanage Enterprises*\n\nYour order *#${orderNumber}* has been confirmed! We'll notify you when it ships. 🛍️`,
    processing: `⚙️ *Vithanage Enterprises*\n\nYour order *#${orderNumber}* is being processed. We'll update you soon!`,
    shipped:    `📦 *Vithanage Enterprises*\n\nGreat news! Your order *#${orderNumber}* has been shipped!`,
    delivered:  `🎉 *Vithanage Enterprises*\n\nYour order *#${orderNumber}* has been delivered! Thank you for shopping with us. Please rate your experience! ⭐`,
    cancelled:  `❌ *Vithanage Enterprises*\n\nYour order *#${orderNumber}* has been cancelled. If you didn't request this, please contact us.`
  };

  const message = statusMessages[status];
  if (!message) {
    console.log(`No WhatsApp template for status: ${status}`);
    return { success: false, reason: 'Unknown status' };
  }

  return sendWhatsApp(phone, message);
};

module.exports = {
  initTwilio,
  sendSMS,
  sendOrderStatusSMS,
  sendPromotionalSMS,
  sendOTPSMS,
  sendWhatsApp,
  sendOrderConfirmationWhatsApp,
  sendOrderStatusWhatsApp
};
