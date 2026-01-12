// Authentication Routes
// This file handles all user authentication: registration, login, and user profile
// It uses JWT (JSON Web Tokens) for secure authentication

const express = require('express'); // Web framework
const bcrypt = require('bcryptjs'); // For password hashing (security)
const jwt = require('jsonwebtoken'); // For creating authentication tokens
const crypto = require('crypto'); // For generating reset tokens
const Tenant = require('../models/Tenant'); // User data model
const Admin = require('../models/Admin'); // Admin data model
const { auth } = require('../middleware/auth'); // Authentication middleware
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/notifications'); // Notification utilities

const router = express.Router(); // Create a router for these routes

// REGISTER NEW TENANT
// POST /api/auth/register
// Creates a new user account
router.post('/register', async (req, res) => {
  // Get user data from the request body (what user typed in the form)
  const { name, roomNumber, idNumber, phone, email, macAddress, password, expiryDate } = req.body;

  try {
    // Validate South African ID number (13 digits)
    if (!/^\d{13}$/.test(idNumber)) {
      return res.status(400).json({ message: 'Please provide a valid 13-digit South African ID number' });
    }

    // Validate South African cell phone number
    const cleanPhone = phone.replace(/\s|-/g, '');
    if (!/^(\+27|0)[6-8][0-9]{8}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please provide a valid South African cell phone number' });
    }

    // Check if user already exists (by email or ID number)
    const existing = await Tenant.findOne({ $or: [{ email }, { idNumber }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password for security (never store plain passwords!)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new tenant in database
    const tenant = new Tenant({
      name,
      roomNumber,
      idNumber,
      phone,
      email,
      macAddress,
      passwordHash, // Store hashed password
      expiryDate
    });

    // Save to database
    await tenant.save();

    // Send welcome email notification (don't block registration if notification fails)
    try {
      if (tenant.email) {
        await sendWelcomeEmail(tenant);
      }
    } catch (notificationError) {
      console.error('Email notification failed:', notificationError);
      // Don't fail registration if email fails
    }

    // Send success response
    res.status(201).json({ message: 'Tenant registered successfully!' });

  } catch (error) {
    // Send error response if something went wrong
    res.status(500).json({ message: error.message });
  }
});

// TENANT LOGIN
// POST /api/auth/login
// Logs in a tenant user and returns a JWT token
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone number

  try {
    // Find user by email OR phone number
    const tenant = await Tenant.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    // Check if user exists and password is correct
    if (!tenant || !(await bcrypt.compare(password, tenant.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token (like a temporary ID card that expires in 1 hour)
    const token = jwt.sign(
      { id: tenant._id, role: 'tenant' }, // User info stored in token
      process.env.JWT_SECRET, // Secret key to sign the token
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Send token and user data back to frontend
    res.json({ token, tenant });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN LOGIN
// POST /api/auth/admin/login
// Logs in an admin user with longer token expiry
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });

    // Check if admin exists and password is correct
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Create JWT token (expires in 2 hours for admins)
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Send token and admin data (without password)
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET CURRENT USER PROFILE
// GET /api/auth/me
// Returns the current logged-in user's profile data
router.get('/me', auth, async (req, res) => {
  try {
    // Find user by ID from JWT token (added by auth middleware)
    const tenant = await Tenant.findById(req.user.id).select('-passwordHash'); // Don't send password

    if (!tenant) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send user data back
    res.json(tenant);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FORGOT PASSWORD
// POST /api/auth/forgot-password
// Generates a reset token and sends reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const tenant = await Tenant.findOne({ email });
    if (!tenant) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set token expiry (1 hour from now)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    tenant.resetToken = resetToken;
    tenant.resetTokenExpiry = resetTokenExpiry;
    await tenant.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(tenant, resetToken);
      res.json({ message: 'Password reset email sent successfully' });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't expose email failure to user for security
      res.json({ message: 'Password reset email sent successfully' });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// RESET PASSWORD
// POST /api/auth/reset-password
// Resets password using the reset token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find user by reset token and check if token is still valid
    const tenant = await Tenant.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() } // Token not expired
    });

    if (!tenant) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    tenant.passwordHash = passwordHash;
    tenant.resetToken = undefined;
    tenant.resetTokenExpiry = undefined;
    await tenant.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;