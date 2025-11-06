const mongoose = require('mongoose');

const SplitSchema = new mongoose.Schema({
  address: { type: String, required: true },
  bps: { type: Number, required: true }
}, { _id: false });

const ClipSchema = new mongoose.Schema({
  onchainClipId: { type: Number, index: true },
  creator: { type: String, required: true, index: true },
  assetCID: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  price: { type: String, required: true },
  durationDays: { type: Number, default: 7 },
  splits: { type: [SplitSchema], default: [] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Clip', ClipSchema);