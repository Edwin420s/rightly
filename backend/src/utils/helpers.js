const { ethers } = require('ethers');

class Helpers {
  static formatWeiToEther(wei) {
    return ethers.formatEther(wei.toString());
  }

  static formatEtherToWei(ether) {
    return ethers.parseEther(ether.toString()).toString();
  }

  static validateEthereumAddress(address) {
    return ethers.isAddress(address);
  }

  static generateRandomNonce() {
    return Math.floor(Math.random() * 1000000);
  }

  static calculateExpiry(durationDays) {
    const now = new Date();
    const expiry = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
    return expiry;
  }

  static isLicenseExpired(expiryDate) {
    return new Date(expiryDate) < new Date();
  }

  static calculateSplitAmount(totalAmount, bps) {
    const amount = BigInt(totalAmount);
    const share = (amount * BigInt(bps)) / BigInt(10000);
    return share.toString();
  }

  static formatLicenseData(license) {
    return {
      ...license,
      priceEther: this.formatWeiToEther(license.price),
      isValid: !this.isLicenseExpired(license.expiryTs),
      daysRemaining: Math.ceil((new Date(license.expiryTs) - new Date()) / (1000 * 60 * 60 * 24))
    };
  }

  static sanitizeUserInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 1000); // Limit length
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  static generateReceiptHash(licenseId, clipId, buyer, startTs, expiryTs, amount) {
    const data = `${licenseId}-${clipId}-${buyer}-${startTs}-${expiryTs}-${amount}`;
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }
}

module.exports = Helpers;