const { ethers } = require('ethers');
const logger = require('../utils/logger');

const authenticateWallet = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const [address, signature, message] = token.split(':');
    
    if (!address || !signature || !message) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if message is expired (5 minutes)
    const messageData = JSON.parse(message);
    if (Date.now() - messageData.timestamp > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    req.walletAddress = recoveredAddress;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [address, signature, message] = token.split(':');
      
      if (address && signature && message) {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
          req.walletAddress = recoveredAddress;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

const generateAuthToken = (address, privateKey) => {
  const message = JSON.stringify({
    purpose: 'authentication',
    address: address,
    timestamp: Date.now()
  });
  
  const signature = ethers.Wallet.fromPhrase(privateKey).signMessageSync(message);
  return `Bearer ${address}:${signature}:${message}`;
};

module.exports = {
  authenticateWallet,
  optionalAuth,
  generateAuthToken
};
