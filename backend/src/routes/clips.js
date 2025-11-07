const express = require('express');
const Clip = require('../models/Clip');
const ipfs = require('../services/ipfs');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { creator, title, description, price, durationDays, assetCID, splits } = req.body;
    
    if (!creator || !assetCID || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const clip = new Clip({
      creator,
      title,
      description,
      price,
      durationDays: durationDays || 7,
      assetCID,
      splits: splits || []
    });

    await clip.save();
    res.json({ clip });
  } catch (error) {
    console.error('Error creating clip:', error);
    res.status(500).json({ error: 'Failed to create clip' });
  }
});

router.get('/', async (req, res) => {
  try {
    const clips = await Clip.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ clips });
  } catch (error) {
    console.error('Error fetching clips:', error);
    res.status(500).json({ error: 'Failed to fetch clips' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }
    res.json({ clip });
  } catch (error) {
    console.error('Error fetching clip:', error);
    res.status(500).json({ error: 'Failed to fetch clip' });
  }
});

// Pin file to IPFS (base64) and return CID
router.post('/pin', async (req, res) => {
  try {
    const { filename, dataBase64 } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: 'dataBase64 is required' });
    }
    const buf = Buffer.from(dataBase64, 'base64');
    const cid = await ipfs.pinFile(buf, filename || `clip-${Date.now()}`);
    res.json({ cid });
  } catch (error) {
    console.error('Error pinning file:', error);
    res.status(500).json({ error: 'Failed to pin file' });
  }
});

module.exports = router;