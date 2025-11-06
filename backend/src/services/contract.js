const { ethers } = require('ethers');
const ClipLicenseABI = require('../abis/ClipLicense.json');

const provider = new ethers.JsonRpcProvider(process.env.SCROLL_RPC);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.CLIP_LICENSE_ADDRESS,
  ClipLicenseABI,
  provider
);

const contractWithSigner = contract.connect(relayerWallet);

module.exports = {
  provider,
  contract,
  contractWithSigner,
  relayerWallet,
  ethers
};