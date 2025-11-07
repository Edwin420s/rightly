const User = require('../models/User');
const Nonce = require('../models/Nonce');
const { createSignMessage } = require('../utils/eip712');
const logger = require('../utils/logger');

class AuthController {
  async getNonce(req, res) {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      let nonceDoc = await Nonce.findOne({ address: address.toLowerCase() });
      
      if (!nonceDoc) {
        nonceDoc = new Nonce({ 
          address: address.toLowerCase(), 
          nonce: Math.floor(Math.random() * 1000000) 
        });
        await nonceDoc.save();
      }

      const message = createSignMessage(address, nonceDoc.nonce);

      res.json({
        success: true,
        nonce: nonceDoc.nonce,
        message,
        address: address.toLowerCase()
      });

    } catch (error) {
      logger.error('Error generating nonce:', error);
      res.status(500).json({ error: 'Failed to generate nonce' });
    }
  }

  async verifySignature(req, res) {
    try {
      const { address, signature, message } = req.body;

      if (!address || !signature || !message) {
        return res.status(400).json({ error: 'Address, signature, and message are required' });
      }

      // Find or create user
      const user = await User.findOrCreate(address);
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User authenticated: ${address}`);

      res.json({
        success: true,
        user: {
          walletAddress: user.walletAddress,
          username: user.username,
          bio: user.bio,
          avatarCID: user.avatarCID,
          socialLinks: user.socialLinks,
          creatorStats: user.creatorStats,
          buyerStats: user.buyerStats,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        },
        message: 'Authentication successful'
      });

    } catch (error) {
      logger.error('Error verifying signature:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { username, bio, email, socialLinks, preferences } = req.body;
      const walletAddress = req.walletAddress;

      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates = {};
      if (username !== undefined) {
        // Check if username is available
        if (username !== user.username) {
          const existingUser = await User.findOne({ 
            username, 
            walletAddress: { $ne: walletAddress.toLowerCase() } 
          });
          if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
          }
          updates.username = username;
        }
      }
      if (bio !== undefined) updates.bio = bio;
      if (email !== undefined) updates.email = email;
      if (socialLinks !== undefined) updates.socialLinks = { ...user.socialLinks, ...socialLinks };
      if (preferences !== undefined) updates.preferences = { ...user.preferences, ...preferences };

      const updatedUser = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        updates,
        { new: true, runValidators: true }
      );

      logger.info(`Profile updated for user: ${walletAddress}`);

      res.json({
        success: true,
        user: {
          walletAddress: updatedUser.walletAddress,
          username: updatedUser.username,
          bio: updatedUser.bio,
          email: updatedUser.email,
          socialLinks: updatedUser.socialLinks,
          preferences: updatedUser.preferences,
          isVerified: updatedUser.isVerified,
          createdAt: updatedUser.createdAt
        }
      });

    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async getUserProfile(req, res) {
    try {
      const { address } = req.params;

      const user = await User.findOne({ walletAddress: address.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          walletAddress: user.walletAddress,
          username: user.username,
          bio: user.bio,
          avatarCID: user.avatarCID,
          socialLinks: user.socialLinks,
          creatorStats: user.creatorStats,
          buyerStats: user.buyerStats,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const walletAddress = req.walletAddress;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { buffer, mimetype } = req.file;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
      }

      // Validate file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      }

      const ipfs = require('../services/ipfs');
      const cid = await ipfs.pinFile(buffer, `avatar-${walletAddress}`);
      
      // Update user avatar
      const user = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { avatarCID: cid },
        { new: true }
      );

      logger.info(`Avatar uploaded for user: ${walletAddress}, CID: ${cid}`);

      res.json({
        success: true,
        avatarCID: cid,
        avatarUrl: ipfs.getGatewayURL(cid)
      });

    } catch (error) {
      logger.error('Error uploading avatar:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
}

module.exports = new AuthController();