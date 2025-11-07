const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true
  },
  username: {
    type: String,
    sparse: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    sparse: true,
    trim: true,
    lowercase: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatarCID: {
    type: String
  },
  socialLinks: {
    twitter: String,
    website: String,
    instagram: String
  },
  creatorStats: {
    totalClips: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalEarnings: { type: String, default: '0' },
    avgRating: { type: Number, default: 0 }
  },
  buyerStats: {
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: String, default: '0' }
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find or create user by wallet address
UserSchema.statics.findOrCreate = async function(walletAddress) {
  let user = await this.findOne({ walletAddress: walletAddress.toLowerCase() });
  
  if (!user) {
    user = new this({
      walletAddress: walletAddress.toLowerCase(),
      username: `user_${walletAddress.slice(2, 8).toLowerCase()}`
    });
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('User', UserSchema);