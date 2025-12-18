// Authentication Routes
// This file handles all user authentication: registration, login, and user profile
// It uses JWT (JSON Web Tokens) for secure authentication

const express = require('express'); // Web framework
const bcrypt = require('bcryptjs'); // For password hashing (security)
const jwt = require('jsonwebtoken'); // For creating authentication tokens
const Tenant = require('../models/Tenant'); // User data model
const Admin = require('../models/Admin'); // Admin data model
const { auth } = require('../middleware/auth'); // Authentication middleware

const router = express.Router(); // Create a router for these routes

// REGISTER NEW TENANT
// POST /api/auth/register
// Creates a new user account
router.post('/register', async (req, res) => {
  // Get user data from the request body (what user typed in the form)
  const { name, roomNumber, idNumber, phone, email, password, expiryDate } = req.body;

  try {
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
      passwordHash, // Store hashed password
      expiryDate
    });

    // Save to database
    await tenant.save();

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

module.exports = router;