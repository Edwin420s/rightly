const { Worker } = require('bullmq');
const { indexerQueue, connection } = require('../services/queue');
const { contract, provider } = require('../services/contract');
const ipfs = require('../services/ipfs');
const Receipt = require('../models/Receipt');
const Clip = require('../models/Clip');
const logger = require('../utils/logger');
const { ethers } = require('ethers');

const worker = new Worker('indexerWorker', async (job) => {
  try {
    const { licenseId, clipId, buyer, startTs, expiryTs, amount, receiptHash } = job.data;

    const clip = await Clip.findOne({ onchainClipId: clipId.toString() });
    if (!clip) {
      logger.warn(`Clip not found for onchain ID: ${clipId}`);
      return;
    }

    const receiptData = {
      licenseId: licenseId.toString(),
      clipId: clip._id,
      buyer: buyer,
      seller: clip.creator,
      price: ethers.formatUnits(amount, 18),
      currency: 'USX',
      startTimestamp: new Date(Number(startTs.toString()) * 1000),
      expiryTimestamp: new Date(Number(expiryTs.toString()) * 1000),
      txHash: receiptHash,
      assetCID: clip.assetCID,
      clipTitle: clip.title
    };

    const signature = await signReceipt(receiptData);
    receiptData.signature = signature;
    receiptData.receiptSigner = process.env.PLATFORM_ADDRESS;

    const ipfsCid = await ipfs.pinJSON(receiptData);

    const receipt = new Receipt({
      licenseId: licenseId.toString(),
      clipId: clip._id,
      buyer: buyer,
      txHash: receiptHash,
      ipfsCid: ipfsCid,
      price: amount.toString(),
      startTs: new Date(Number(startTs.toString()) * 1000),
      expiryTs: new Date(Number(expiryTs.toString()) * 1000)
    });

    await receipt.save();

    logger.info(`Receipt indexed: ${ipfsCid} for buyer ${buyer}`);
    
    return { ipfsCid, licenseId: licenseId.toString() };
  } catch (error) {
    logger.error('Indexer worker error:', error);
    throw error;
  }
}, { connection });

const signReceipt = async (receiptData) => {
  const platformWallet = new ethers.Wallet(process.env.PLATFORM_PRIVATE_KEY);
  const message = JSON.stringify(receiptData, Object.keys(receiptData).sort());
  const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
  return await platformWallet.signMessage(ethers.getBytes(messageHash));
};

contract.on('LicensePurchased', (licenseId, clipId, buyer, startTs, expiryTs, amount, receiptHash) => {
  indexerQueue.add('processLicense', {
    licenseId,
    clipId,
    buyer,
    startTs,
    expiryTs,
    amount,
    receiptHash
  });
});

worker.on('failed', (job, error) => {
  logger.error(`Indexer job ${job.id} failed:`, error);
});

module.exports = worker;