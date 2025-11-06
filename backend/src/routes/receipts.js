const express = require('express');
const Receipt = require('../models/Receipt');
const router = express.Router();

router.get('/:licenseId', async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ licenseId: req.params.licenseId })
      .populate('clipId');
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ receipt });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

router.get('/user/:address', async (req, res) => {
  try {
    const receipts = await Receipt.find({ buyer: req.params.address })
      .populate('clipId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ receipts });
  } catch (error) {
    console.error('Error fetching user receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

module.exports = router;