const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomNumber: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  macAddress: { type: String, required: true },
  passwordHash: { type: String, required: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  wifiAccess: { type: Boolean, default: false },
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);