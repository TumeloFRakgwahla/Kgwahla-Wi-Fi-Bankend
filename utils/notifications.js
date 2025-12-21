// Notification utilities for sending emails and SMS to tenants

const nodemailer = require('nodemailer');

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// SMS configuration (using Africa's Talking for South African SMS)
const sendSMS = async (phoneNumber, message) => {
  try {
    // Remove any spaces, dashes, or + from phone number
    const cleanNumber = phoneNumber.replace(/[\s\-+]/g, '');

    // Ensure it starts with country code
    const formattedNumber = cleanNumber.startsWith('27') ? cleanNumber : `27${cleanNumber.substring(1)}`;

    // Africa's Talking API call (you'll need to sign up and get API key)
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': process.env.AFRICAS_TALKING_API_KEY,
        'username': process.env.AFRICAS_TALKING_USERNAME
      },
      body: new URLSearchParams({
        to: `+${formattedNumber}`,
        message: message,
        from: process.env.SMS_SENDER_ID || 'KgwahlaWiFi'
      })
    });

    if (!response.ok) {
      console.error('SMS sending failed:', await response.text());
      return false;
    }

    console.log('SMS sent successfully to', formattedNumber);
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

// Send welcome email after registration
const sendWelcomeEmail = async (tenant) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tenant.email,
      subject: 'Welcome to Kgwahla Wi-Fi Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Kgwahla Wi-Fi!</h2>
          <p>Dear ${tenant.name},</p>
          <p>Thank you for registering with the Kgwahla Wi-Fi Management System.</p>
          <p><strong>Your Details:</strong></p>
          <ul>
            <li>Name: ${tenant.name}</li>
            <li>Room: ${tenant.roomNumber}</li>
            <li>ID Number: ${tenant.idNumber}</li>
            <li>MAC Address: ${tenant.macAddress}</li>
          </ul>
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Submit your payment proof to activate WiFi access</li>
            <li>Wait for admin approval</li>
            <li>Connect to the WiFi network</li>
          </ol>
          <p>If you have any questions, please contact the admin office.</p>
          <p>Best regards,<br>Kgwahla Wi-Fi Management Team</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('Welcome email sent to', tenant.email);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send welcome SMS after registration
const sendWelcomeSMS = async (tenant) => {
  const message = `Welcome ${tenant.name}! Your Kgwahla Wi-Fi registration is complete. Room: ${tenant.roomNumber}. Please submit payment to activate WiFi.`;
  return await sendSMS(tenant.phone, message);
};

// Send WiFi activation notification
const sendWiFiActivationEmail = async (tenant) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tenant.email,
      subject: 'WiFi Access Activated - Kgwahla Wi-Fi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">WiFi Access Activated! 🎉</h2>
          <p>Dear ${tenant.name},</p>
          <p>Great news! Your payment has been approved and your WiFi access is now active.</p>
          <p><strong>Connection Details:</strong></p>
          <ul>
            <li>Network Name: Skyline_Residences_5G</li>
            <li>Room: ${tenant.roomNumber}</li>
            <li>MAC Address: ${tenant.macAddress}</li>
            <li>Expiry Date: ${new Date(tenant.expiryDate).toLocaleDateString()}</li>
          </ul>
          <p>You can now connect to the WiFi network. If you experience any issues, please contact the admin office.</p>
          <p>Best regards,<br>Kgwahla Wi-Fi Management Team</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('WiFi activation email sent to', tenant.email);
    return true;
  } catch (error) {
    console.error('WiFi activation email error:', error);
    return false;
  }
};

// Send WiFi activation SMS
const sendWiFiActivationSMS = async (tenant) => {
  const expiryDate = new Date(tenant.expiryDate).toLocaleDateString();
  const message = `WiFi Activated! ${tenant.name}, your payment is approved. Network: Skyline_Residences_5G. Expires: ${expiryDate}. Enjoy your connection!`;
  return await sendSMS(tenant.phone, message);
};

module.exports = {
  sendWelcomeEmail,
  sendWelcomeSMS,
  sendWiFiActivationEmail,
  sendWiFiActivationSMS
};