const express = require('express');
const { auth } = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const AccessLog = require('../models/AccessLog');

const router = express.Router();

// Enable access
router.post('/enable', auth, async (req, res) => {
  const { deviceMAC } = req.body;
  const tenantId = req.user.id;
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || !tenant.wifiAccess) return res.status(403).json({ message: 'Access not allowed' });
    const log = new AccessLog({ tenantId, deviceMAC });
    await log.save();
    res.json({ message: 'Access enabled', log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disable access
router.post('/disable', auth, async (req, res) => {
  const { deviceMAC } = req.body;
  const tenantId = req.user.id;
  try {
    const log = await AccessLog.findOne({ tenantId, deviceMAC, disconnectedAt: null });
    if (log) {
      log.disconnectedAt = new Date();
      await log.save();
    }
    // Disable wifiAccess if no active logs
    const activeLogs = await AccessLog.find({ tenantId, disconnectedAt: null });
    if (activeLogs.length === 0) {
      const tenant = await Tenant.findById(tenantId);
      tenant.wifiAccess = false;
      await tenant.save();
    }
    res.json({ message: 'Access disabled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;