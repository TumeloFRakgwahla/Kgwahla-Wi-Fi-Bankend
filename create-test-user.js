const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('./models/Tenant');

async function createTestUser() {
  try {
    // Connect to MongoDB - adjust connection string as needed
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kgwahla-wifi');

    // Check if test user already exists
    const existingUser = await Tenant.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('test123', 10);

    // Create test user with wifi access enabled
    const testUser = new Tenant({
      name: 'Test User',
      roomNumber: '101',
      idNumber: '123456789',
      phone: '+1234567890',
      email: 'test@example.com',
      passwordHash: passwordHash,
      status: 'active',
      wifiAccess: true, // Enable wifi access for testing
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    await testUser.save();
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Phone: +1234567890');
    console.log('Password: test123');
    console.log('WiFi Access: Enabled');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();