const { contract, provider } = require('./contract');
const { indexerQueue } = require('./queue');
const logger = require('../utils/logger');

class EventListener {
  constructor() {
    this.isListening = false;
    this.lastBlock = 0;
  }

  async start() {
    if (this.isListening) {
      logger.warn('Event listener already running');
      return;
    }

    try {
      const currentBlock = await provider.getBlockNumber();
      this.lastBlock = currentBlock - 1000; // Look back 1000 blocks for safety

      // Start listening for new events
      contract.on('LicensePurchased', this.handleLicensePurchased.bind(this));
      
      // Also poll for missed events
      this.pollInterval = setInterval(this.pollEvents.bind(this), 15000); // 15 seconds
      
      this.isListening = true;
      logger.info(`Event listener started from block ${this.lastBlock}`);
    } catch (error) {
      logger.error('Failed to start event listener:', error);
      throw error;
    }
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    contract.removeAllListeners();
    this.isListening = false;
    logger.info('Event listener stopped');
  }

  async handleLicensePurchased(licenseId, clipId, buyer, startTs, expiryTs, amount, receiptHash, event) {
    try {
      logger.info(`New LicensePurchased event: ${licenseId.toString()}`);
      
      await indexerQueue.add('processLicense', {
        licenseId: licenseId.toString(),
        clipId: clipId.toString(),
        buyer,
        startTs: startTs.toString(),
        expiryTs: expiryTs.toString(),
        amount: amount.toString(),
        receiptHash,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });

    } catch (error) {
      logger.error('Error handling LicensePurchased event:', error);
    }
  }

  async pollEvents() {
    try {
      const currentBlock = await provider.getBlockNumber();
      
      if (currentBlock <= this.lastBlock) {
        return;
      }

      const events = await contract.queryFilter('LicensePurchased', this.lastBlock + 1, currentBlock);
      
      for (const event of events) {
        const { licenseId, clipId, buyer, startTs, expiryTs, amount, receiptHash } = event.args;
        
        await indexerQueue.add('processLicense', {
          licenseId: licenseId.toString(),
          clipId: clipId.toString(),
          buyer,
          startTs: startTs.toString(),
          expiryTs: expiryTs.toString(),
          amount: amount.toString(),
          receiptHash,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      this.lastBlock = currentBlock;
      logger.debug(`Polled ${events.length} new events up to block ${currentBlock}`);
    } catch (error) {
      logger.error('Error polling events:', error);
    }
  }

  async replayEvents(fromBlock, toBlock) {
    try {
      logger.info(`Replaying events from block ${fromBlock} to ${toBlock}`);
      
      const events = await contract.queryFilter('LicensePurchased', fromBlock, toBlock);
      
      for (const event of events) {
        const { licenseId, clipId, buyer, startTs, expiryTs, amount, receiptHash } = event.args;
        
        await indexerQueue.add('processLicense', {
          licenseId: licenseId.toString(),
          clipId: clipId.toString(),
          buyer,
          startTs: startTs.toString(),
          expiryTs: expiryTs.toString(),
          amount: amount.toString(),
          receiptHash,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      logger.info(`Replayed ${events.length} events`);
      return events.length;
    } catch (error) {
      logger.error('Error replaying events:', error);
      throw error;
    }
  }
}

module.exports = new EventListener();