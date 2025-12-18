const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const Tenant = require('../models/Tenant');

const router = express.Router();

// List/search tenants
router.get('/', auth, adminAuth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) {
    query = { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] };
  }
  try {
    const tenants = await Tenant.find(query);
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Block tenant
router.post('/block', auth, adminAuth, async (req, res) => {
  const { tenantId } = req.body;
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    tenant.status = 'blocked';
    tenant.wifiAccess = false;
    await tenant.save();
    res.json({ message: 'Tenant blocked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve tenant (for cash payments)
router.post('/approve/:id', auth, adminAuth, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // Find pending cash payment
    const Payment = require('../models/Payment');
    const pendingPayment = await Payment.findOne({
      tenantId: req.params.id,
      type: 'cash',
      status: 'pending'
    });

    if (pendingPayment) {
      pendingPayment.status = 'approved';
      pendingPayment.approvedAt = new Date();
      await pendingPayment.save();
    }

    tenant.wifiAccess = true;
    tenant.status = 'active';
    await tenant.save();

    res.json({ message: 'Tenant approved and WiFi access enabled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;