// Scheduler for automated tasks like expiry reminders

const cron = require('node-cron');
const Tenant = require('../models/Tenant');
const { sendExpiryReminderEmail } = require('./notifications');

// Check for tenants whose WiFi access is expiring soon or has expired
const checkExpiringTenants = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    // Find tenants whose expiry date is within 3 days or has passed
    const expiringTenants = await Tenant.find({
      expiryDate: { $lte: threeDaysFromNow },
      status: { $ne: 'blocked' } // Don't send to blocked users
    });

    console.log(`Found ${expiringTenants.length} tenants with expiring access`);

    for (const tenant of expiringTenants) {
      // Check if expiry date has passed
      if (tenant.expiryDate <= now) {
        // Access has expired - disable WiFi access
        tenant.wifiAccess = false;
        tenant.status = 'inactive';
        await tenant.save();
        console.log(`Disabled WiFi access for expired tenant: ${tenant.email}`);
      }

      // Send reminder email
      try {
        await sendExpiryReminderEmail(tenant);
        console.log(`Sent expiry reminder to: ${tenant.email}`);
      } catch (emailError) {
        console.error(`Failed to send expiry reminder to ${tenant.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error checking expiring tenants:', error);
  }
};

// Schedule the check to run daily at 9 AM
const startScheduler = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running daily expiry check...');
    checkExpiringTenants();
  });

  console.log('Scheduler started - expiry checks will run daily at 9:00 AM');
};

// Export for manual testing or initialization
module.exports = {
  startScheduler,
  checkExpiringTenants
};