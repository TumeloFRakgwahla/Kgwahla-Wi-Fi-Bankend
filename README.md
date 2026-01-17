# Kgwahla Wi-Fi Backend

Backend API for the Kgwahla Wi-Fi Management System built with Node.js, Express, and MongoDB.

## Features

- User authentication (tenants and admins)
- Payment verification and management
- Tenant management for admins
- WiFi access control
- Contact form handling
- Automated scheduling for access management

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **nodemailer** - Email notifications
- **node-cron** - Scheduled tasks

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd Kgwahla-Wi-Fi-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/kgwahla-wifi
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=3000
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

4. Start MongoDB if running locally.

## Running the Application

To start the server:
```bash
npm start
```

The server will run on `http://localhost:3000` (or the port specified in .env).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new tenant
- `POST /api/auth/login` - Tenant login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user profile

### Payments
- `POST /api/payments/upload` - Upload payment proof
- `POST /api/payments/cash` - Register cash payment
- `GET /api/payments/status` - Get payment history
- `POST /api/payments/approve/:id` - Admin approve payment
- `POST /api/payments/reject/:id` - Admin reject payment

### Tenants (Admin Only)
- `GET /api/tenants` - List all tenants
- `POST /api/tenants/block` - Block tenant
- `POST /api/tenants/approve/:id` - Approve tenant access

### Access Control
- `POST /api/access/enable` - Enable WiFi access
- `POST /api/access/disable` - Disable WiFi access

### Contact
- `POST /api/contact/submit` - Submit contact form

## Project Structure

```
Kgwahla-Wi-Fi-Backend/
├── config/
│   └── db.js                 # Database connection
├── middleware/
│   └── auth.js               # Authentication middleware
├── models/
│   ├── Admin.js              # Admin model
│   ├── Tenant.js             # Tenant model
│   ├── Payment.js            # Payment model
│   └── AccessLog.js          # Access log model
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── payments.js           # Payment routes
│   ├── tenants.js            # Tenant management routes
│   ├── access.js             # Access control routes
│   └── contact.js            # Contact routes
├── utils/
│   ├── notifications.js      # Email notifications
│   └── scheduler.js          # Automated tasks
├── uploads/                  # Uploaded files
├── server.js                 # Main server file
├── package.json
└── README.md
```

## Scripts

- `npm start` - Start the server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is for educational purposes.