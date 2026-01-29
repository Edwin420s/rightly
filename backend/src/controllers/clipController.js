const Clip = require('../models/Clip');
const ipfs = require('../services/ipfs');
const logger = require('../utils/logger');

class ClipController {
  async createClip(req, res) {
    try {
      const { creator, title, description, price, durationDays, assetCID, splits } = req.body;

      // Validate splits don't exceed 100%
      const totalBps = splits.reduce((sum, split) => sum + split.bps, 0);
      if (totalBps > 10000) {
        return res.status(400).json({ error: 'Total splits cannot exceed 100%' });
      }

      const clip = new Clip({
        creator: creator.toLowerCase(),
        title,
        description,
        price,
        durationDays: durationDays || 7,
        assetCID,
        splits: splits || []
      });

      await clip.save();

      logger.info(`Clip created: ${clip._id} by ${creator}`);

      res.status(201).json({
        success: true,
        clip: {
          id: clip._id,
          creator: clip.creator,
          title: clip.title,
          price: clip.price,
          durationDays: clip.durationDays,
          assetCID: clip.assetCID,
          splits: clip.splits,
          createdAt: clip.createdAt
        }
      });

    } catch (error) {
      logger.error('Error creating clip:', error);
      res.status(500).json({ error: 'Failed to create clip' });
    }
  }

  async getClips(req, res) {
    try {
      const { page = 1, limit = 20, creator, active = true } = req.query;
      
      const query = { active: active !== 'false' };
      if (creator) {
        query.creator = creator.toLowerCase();
      }

      const clips = await Clip.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Clip.countDocuments(query);

      res.json({
        clips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('Error fetching clips:', error);
      res.status(500).json({ error: 'Failed to fetch clips' });
    }
  }

  async getClipById(req, res) {
    try {
      const clip = await Clip.findById(req.params.id);
      
      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      res.json({ clip });

    } catch (error) {
      logger.error('Error fetching clip:', error);
      res.status(500).json({ error: 'Failed to fetch clip' });
    }
  }

  async updateClip(req, res) {
    try {
      const { title, description, price, durationDays, active } = req.body;
      const clipId = req.params.id;

      const clip = await Clip.findById(clipId);
      
      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Only creator can update the clip
      if (clip.creator.toLowerCase() !== req.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: 'Not authorized to update this clip' });
      }

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (price !== undefined) updates.price = price;
      if (durationDays !== undefined) updates.durationDays = durationDays;
      if (active !== undefined) updates.active = active;

      const updatedClip = await Clip.findByIdAndUpdate(
        clipId,
        updates,
        { new: true, runValidators: true }
      );

      logger.info(`Clip updated: ${clipId} by ${req.walletAddress}`);

      res.json({
        success: true,
        clip: updatedClip
      });

    } catch (error) {
      logger.error('Error updating clip:', error);
      res.status(500).json({ error: 'Failed to update clip' });
    }
  }

  async uploadClipAsset(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { originalname, buffer, mimetype } = req.file;
      
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Invalid file type' });
      }

      // Validate file size (max 50MB)
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large (max 50MB)' });
      }

      const cid = await ipfs.pinFile(buffer, originalname);
      const ipfsUrl = ipfs.getGatewayURL(cid);

      logger.info(`File uploaded to IPFS: ${cid} - ${originalname}`);

      res.json({
        success: true,
        cid,
        ipfsUrl,
        filename: originalname,
        mimetype
      });

    } catch (error) {
      logger.error('Error uploading clip asset:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
}

module.exports = new ClipController();
