const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://tumelorakgwahla_db_user:fSNiBPn2c7v6xKR2@kgwahla-wi-fi.k2a295v.mongodb.net/kgwahla-wifi');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@skyline.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create admin
    const admin = new Admin({
      name: 'System Administrator',
      email: 'admin@skyline.com',
      passwordHash: passwordHash,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@skyline.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
