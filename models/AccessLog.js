const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  deviceMAC: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now },
  disconnectedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('AccessLog', accessLogSchema);