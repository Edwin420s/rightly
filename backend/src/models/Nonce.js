const mongoose = require('mongoose');

const NonceSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, index: true },
  nonce: { type: Number, default: 0 }
});

module.exports = mongoose.model('Nonce', NonceSchema);