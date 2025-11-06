const express = require('express');
const Clip = require('../models/Clip');
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

module.exports = router;