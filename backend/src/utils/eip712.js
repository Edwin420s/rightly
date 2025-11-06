const { ethers } = require('ethers');

function getDomain(chainId, verifyingContract) {
  return {
    name: 'Rightly ClipLicense',
    version: '1',
    chainId,
    verifyingContract,
  };
}

const buyTypes = {
  BuyIntent: [
    { name: 'clipId', type: 'uint256' },
    { name: 'buyer', type: 'address' },
    { name: 'price', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

async function recoverSigner(domainParams, message, signature) {
  try {
    const domain = getDomain(domainParams.chainId, domainParams.verifyingContract);
    const recovered = await ethers.verifyTypedData(domain, buyTypes, message, signature);
    return recovered;
  } catch (error) {
    console.error('Signature recovery error:', error);
    throw new Error('Invalid signature format');
  }
}

function createSignMessage(address, nonce) {
  return `Welcome to Rightly!\n\nPlease sign this message to verify your ownership of the wallet address.\n\nAddress: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

module.exports = { 
  getDomain, 
  buyTypes, 
  recoverSigner,
  createSignMessage
};