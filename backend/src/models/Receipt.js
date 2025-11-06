const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
  licenseId: { type: String, required: true, unique: true, index: true },
  clipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clip' },
  buyer: { type: String, required: true, index: true },
  txHash: { type: String, index: true },
  ipfsCid: { type: String, required: true },
  price: { type: String },
  startTs: { type: Date },
  expiryTs: { type: Date, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Receipt', ReceiptSchema);