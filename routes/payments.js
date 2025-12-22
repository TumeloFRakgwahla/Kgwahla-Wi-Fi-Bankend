const express = require('express');
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const { sendWiFiActivationEmail } = require('../utils/notifications');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload payment (POP)
router.post('/upload', auth, upload.single('proofOfPayment'), async (req, res) => {
  const { type } = req.body;
  const tenantId = req.user.id;

  try {
    const paymentData = {
      tenantId,
      type: 'POP',
      fileUrl: req.file ? `uploaded_${Date.now()}_${req.file.originalname}` : null,
    };

    // Store file data if present
    if (req.file) {
      paymentData.fileData = req.file.buffer;
      paymentData.fileMimeType = req.file.mimetype;
      paymentData.fileName = req.file.originalname;
    }

    const payment = new Payment(paymentData);
    await payment.save();
    res.json({ message: 'Payment uploaded', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit cash payment
router.post('/cash', auth, async (req, res) => {
  const tenantId = req.user.id;
  try {
    const payment = new Payment({ tenantId, type: 'cash' });
    await payment.save();
    res.json({ message: 'Cash payment submitted', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment status
router.get('/status', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ tenantId: req.user.id });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all payments (admin)
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find().populate('tenantId', 'name roomNumber phone email');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve payment (admin)
router.post('/approve/:id', auth, adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.status = 'approved';
    payment.approvedAt = new Date();
    await payment.save();
    // Enable wifi access
    const tenant = await Tenant.findById(payment.tenantId);
    tenant.wifiAccess = true;
    await tenant.save();

    // Send WiFi activation email notification
    try {
      if (tenant.email) {
        await sendWiFiActivationEmail(tenant);
      }
    } catch (notificationError) {
      console.error('WiFi activation email failed:', notificationError);
      // Don't fail the approval if email fails
    }

    res.json({ message: 'Payment approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject payment (admin)
router.post('/reject/:id', auth, adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.status = 'rejected';
    await payment.save();
    res.json({ message: 'Payment rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View payment proof
router.get('/proof/:id', auth, adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Check for fileData first, then fall back to fileUrl (for older payments)
    if (payment.fileData) {
      // Set appropriate headers
      res.set({
        'Content-Type': payment.fileMimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${payment.fileName || 'payment-proof'}"`,
      });
      // Send the file data
      res.send(payment.fileData);
    } else if (payment.fileUrl) {
      // For older payments, return a message since file is not stored
      res.set('Content-Type', 'text/html');
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>Payment Proof</h2>
            <p>File: ${payment.fileUrl}</p>
            <p><em>Note: This is an older payment. File data is not stored in the database.</em></p>
            <p><em>Please check the original uploaded file if available.</em></p>
          </body>
        </html>
      `);
    } else {
      return res.status(404).json({ message: 'No proof file found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;