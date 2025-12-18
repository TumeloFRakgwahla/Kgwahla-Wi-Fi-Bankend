const express = require('express');
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Upload payment (POP)
router.post('/upload', auth, upload.single('proofOfPayment'), async (req, res) => {
  const { type } = req.body;
  const tenantId = req.user.id;
  const fileUrl = req.file ? req.file.path : null;
  try {
    const payment = new Payment({ tenantId, type: 'POP', fileUrl });
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

module.exports = router;