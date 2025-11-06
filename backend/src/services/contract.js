const { ethers } = require('ethers');

// Mock ABI - replace with actual ClipLicense ABI
const ClipLicenseABI = [
  "function createClip(string assetCID, uint256 price, uint32 durationDays, address[] splits, uint16[] splitBps) external returns (uint256 clipId)",
  "function buyLicense(uint256 clipId) external returns (bytes32)",
  "function buyLicenseFor(uint256 clipId, address buyer, uint256 price, uint256 nonce, uint256 deadline, bytes signature) external returns (bytes32)",
  "function nonces(address) external view returns (uint256)",
  "event LicensePurchased(uint256 indexed licenseId, uint256 indexed clipId, address indexed buyer, uint256 startTs, uint256 expiryTs, uint256 amount, bytes32 receiptHash)",
  "event ClipCreated(uint256 indexed clipId, address indexed creator, uint256 price, uint32 durationDays, string assetCID)"
];

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