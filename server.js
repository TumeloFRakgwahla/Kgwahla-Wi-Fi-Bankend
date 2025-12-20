// Kgwahla Wi-Fi Backend Server
// This is the main server file that sets up our Express.js application
// It handles all the API routes for authentication, payments, tenants, and WiFi access

// Import required packages
const express = require('express'); // Web framework for Node.js - helps us create API endpoints
const cors = require('cors'); // Allows requests from different domains (like our frontend)
require('dotenv').config(); // Loads environment variables from .env file (like database passwords)
const connectDB = require('./config/db'); // Our database connection function

// Create Express application - this is our web server
const app = express();
const PORT = process.env.PORT || 3000; // Use port from environment or default to 3000

// Middleware to connect to database
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Middleware - these run on every request before it reaches our routes
app.use(cors()); // Enable CORS so frontend can talk to backend
app.use(express.json()); // Parse JSON data from requests (like form data)
// Note: File serving disabled in serverless - use cloud storage for production

// Import route handlers - these contain the actual API logic
const authRoutes = require('./routes/auth'); // Handles login, register, user management
const paymentRoutes = require('./routes/payments'); // Handles payment uploads and verification
const tenantRoutes = require('./routes/tenants'); // Handles tenant management for admins
const accessRoutes = require('./routes/access'); // Handles WiFi access control

// Set up API routes - all our API endpoints start with /api
app.use('/api/auth', authRoutes); // Authentication routes: /api/auth/login, /api/auth/register
app.use('/api/payments', paymentRoutes); // Payment routes: /api/payments/upload, /api/payments/status
app.use('/api/tenants', tenantRoutes); // Tenant routes: /api/tenants (admin only)
app.use('/api/access', accessRoutes); // Access routes: /api/access/enable, /api/access/disable

// Basic route to check if server is running - like a "hello world" for our API
app.get('/', (req, res) => {
  res.send('Kgwahla Wi-Fi Backend is running!');
});

// Start the server and listen for requests (only in development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for Vercel serverless deployment
module.exports = app;