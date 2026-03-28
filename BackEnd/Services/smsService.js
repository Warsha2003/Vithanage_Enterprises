// SMS Service - Twilio Integration
// To enable: Sign up at https://www.twilio.com (free trial available)
// Add these to your .env file:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone_number

const twilio = require('twilio');

// Initialize Twilio client (will be null if credentials not set)
let client = null;

const ensureTwilioClient = () => {
  if (client) return true;
  return initTwilio();
};

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

// Check whether current credentials can access Twilio account APIs
const validateTwilioAuth = async () => {
  if (!ensureTwilioClient()) {
    return { success: false, reason: 'Twilio client not initialized' };
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const account = await client.api.v2010.accounts(accountSid).fetch();
    return {
      success: true,
      accountSid: account.sid,
      status: account.status,
      type: account.type
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    };
  }
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

// Log descriptive hints for common Twilio error codes
const logTwilioError = (error) => {
  if (error.code === 20003) {
    console.error('Twilio authentication failed. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.');
  } else if (error.code === 21608) {
    console.error('Twilio trial account: recipient phone number is not a verified number. Verify it at https://www.twilio.com/console/phone-numbers/verified');
  } else if (error.code === 63007 || error.code === 63038) {
    console.error('WhatsApp sandbox: recipient must first send the join keyword to the sandbox number.');
  }
};

// Send SMS
const sendSMS = async (to, message) => {
  if (!ensureTwilioClient()) {
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
    logTwilioError(error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    };
  }
};

// Send WhatsApp message (requires Twilio WhatsApp sandbox or approved sender)
const sendWhatsApp = async (to, message) => {
  if (!ensureTwilioClient()) {
    console.log('WhatsApp not sent (service not configured):', message.substring(0, 50));
    return { success: false, reason: 'WhatsApp service not configured' };
  }

  const whatsappFromRaw = process.env.TWILIO_WHATSAPP_FROM;
  if (!whatsappFromRaw) {
    console.log('WhatsApp not sent: TWILIO_WHATSAPP_FROM missing in environment');
    console.log('Add TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 (sandbox) to your .env file');
    return { success: false, reason: 'TWILIO_WHATSAPP_FROM missing in environment' };
  }

  // Ensure the from number has the whatsapp: prefix
  const whatsappFrom = whatsappFromRaw.startsWith('whatsapp:')
    ? whatsappFromRaw
    : `whatsapp:${whatsappFromRaw}`;

  try {
    const formattedNumber = formatPhoneNumber(to);
    const whatsappTo = formattedNumber.startsWith('whatsapp:')
      ? formattedNumber
      : `whatsapp:${formattedNumber}`;

    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    });

    console.log(`WhatsApp sent to ${whatsappTo}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending WhatsApp:', error.message);
    logTwilioError(error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    };
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

module.exports = {
  initTwilio,
  validateTwilioAuth,
  sendSMS,
  sendWhatsApp,
  sendOrderStatusSMS,
  sendPromotionalSMS,
  sendOTPSMS
};
