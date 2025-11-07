const express = require('express');
const { relayerQueue } = require('../services/queue');
const Nonce = require('../models/Nonce');
const { recoverSigner } = require('../utils/eip712');
const router = express.Router();

router.post('/buy', async (req, res) => {
  try {
    const { clipId, buyer, price, nonce, deadline, signature } = req.body;

    if (!clipId || !buyer || !price || nonce === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const domain = {
      chainId: parseInt(process.env.CHAIN_ID),
      verifyingContract: process.env.CLIP_LICENSE_ADDRESS
    };

    const recovered = await recoverSigner(domain, { clipId, buyer, price, nonce, deadline }, signature);
    if (recovered.toLowerCase() !== buyer.toLowerCase()) {
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    const updated = await Nonce.findOneAndUpdate(
      { address: buyer, nonce: nonce },
      { 
        $setOnInsert: { address: buyer, nonce: 0 },
        $inc: { nonce: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!updated || updated.nonce !== nonce + 1) {
      return res.status(400).json({ error: 'Invalid nonce' });
    }

    await relayerQueue.add('submitBuy', {
      clipId,
      buyer,
      price,
      nonce,
      deadline,
      signature
    });

    res.json({ success: true, message: 'Purchase queued' });
  } catch (error) {
    console.error('Relayer error:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

module.exports = router;