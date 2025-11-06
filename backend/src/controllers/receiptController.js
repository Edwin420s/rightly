const Receipt = require('../models/Receipt');
const Clip = require('../models/Clip');
const logger = require('../utils/logger');

class ReceiptController {
  async getReceipt(req, res) {
    try {
      const { licenseId } = req.params;

      const receipt = await Receipt.findOne({ licenseId })
        .populate('clipId', 'title description assetCID creator');
      
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      // Verify receipt is still valid
      const now = new Date();
      if (receipt.expiryTs < now) {
        return res.status(410).json({ error: 'License has expired' });
      }

      res.json({
        receipt: {
          licenseId: receipt.licenseId,
          clip: receipt.clipId,
          buyer: receipt.buyer,
          txHash: receipt.txHash,
          ipfsCid: receipt.ipfsCid,
          price: receipt.price,
          startTs: receipt.startTs,
          expiryTs: receipt.expiryTs,
          isValid: receipt.expiryTs > now,
          daysRemaining: Math.ceil((receipt.expiryTs - now) / (1000 * 60 * 60 * 24))
        }
      });

    } catch (error) {
      logger.error('Error fetching receipt:', error);
      res.status(500).json({ error: 'Failed to fetch receipt' });
    }
  }

  async getUserReceipts(req, res) {
    try {
      const { address } = req.params;
      const { page = 1, limit = 20, activeOnly = true } = req.query;

      const query = { buyer: address.toLowerCase() };
      
      if (activeOnly === 'true') {
        query.expiryTs = { $gte: new Date() };
      }

      const receipts = await Receipt.find(query)
        .populate('clipId', 'title assetCID creator')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Receipt.countDocuments(query);

      // Add validity status to each receipt
      const now = new Date();
      const enhancedReceipts = receipts.map(receipt => ({
        ...receipt,
        isValid: receipt.expiryTs > now,
        daysRemaining: Math.ceil((receipt.expiryTs - now) / (1000 * 60 * 60 * 24))
      }));

      res.json({
        receipts: enhancedReceipts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error fetching user receipts:', error);
      res.status(500).json({ error: 'Failed to fetch receipts' });
    }
  }

  async getCreatorReceipts(req, res) {
    try {
      const { address } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Find all clips by this creator
      const creatorClips = await Clip.find({ 
        creator: address.toLowerCase() 
      }, '_id');

      const clipIds = creatorClips.map(clip => clip._id);

      const receipts = await Receipt.find({ clipId: { $in: clipIds } })
        .populate('clipId', 'title assetCID creator')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Receipt.countDocuments({ clipId: { $in: clipIds } });

      // Calculate total earnings
      const totalEarnings = receipts.reduce((sum, receipt) => {
        return sum + parseFloat(receipt.price || 0);
      }, 0);

      res.json({
        receipts,
        totalEarnings: totalEarnings.toString(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error fetching creator receipts:', error);
      res.status(500).json({ error: 'Failed to fetch creator receipts' });
    }
  }

  async verifyReceipt(req, res) {
    try {
      const { licenseId } = req.params;

      const receipt = await Receipt.findOne({ licenseId })
        .populate('clipId', 'title creator assetCID');
      
      if (!receipt) {
        return res.json({
          isValid: false,
          reason: 'Receipt not found'
        });
      }

      const now = new Date();
      const isValid = receipt.expiryTs > now;

      res.json({
        isValid,
        receipt: isValid ? {
          licenseId: receipt.licenseId,
          clip: receipt.clipId,
          buyer: receipt.buyer,
          expiryTs: receipt.expiryTs,
          daysRemaining: Math.ceil((receipt.expiryTs - now) / (1000 * 60 * 60 * 24))
        } : null,
        reason: isValid ? 'Valid license' : 'License expired'
      });

    } catch (error) {
      logger.error('Error verifying receipt:', error);
      res.status(500).json({ error: 'Failed to verify receipt' });
    }
  }
}

module.exports = new ReceiptController();