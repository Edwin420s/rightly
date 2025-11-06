const { Worker } = require('bullmq');
const { connection } = require('../services/queue');
const { relayerWallet, contract } = require('../services/contract');
const logger = require('../utils/logger');

const worker = new Worker('relayerQueue', async (job) => {
  try {
    const { clipId, buyer, price, nonce, deadline, signature } = job.data;
    
    const contractWithSigner = contract.connect(relayerWallet);
    
    const tx = await contractWithSigner.buyLicenseFor(
      clipId,
      buyer,
      price,
      nonce,
      deadline,
      signature
    );

    logger.info(`Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    logger.info(`Transaction confirmed: ${receipt.transactionHash}`);
    
    return { txHash: receipt.transactionHash };
  } catch (error) {
    logger.error('Relayer worker error:', error);
    throw error;
  }
}, { connection });

worker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed:`, error);
});

module.exports = worker;