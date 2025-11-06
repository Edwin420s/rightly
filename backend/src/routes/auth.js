const express = require('express');
const { ethers } = require('ethers');
const Nonce = require('../models/Nonce');
const router = express.Router();

router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const nonceDoc = await Nonce.findOne({ address });
    const nonce = nonceDoc ? nonceDoc.nonce : 0;

    res.json({ nonce });
  } catch (error) {
    console.error('Error fetching nonce:', error);
    res.status(500).json({ error: 'Failed to fetch nonce' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    res.json({ 
      success: true, 
      message: 'Signature verified successfully',
      address: recoveredAddress
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;