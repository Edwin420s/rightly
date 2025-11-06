require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const setupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Database connected for setup');

    // Create indexes for better performance
    const clipResult = await mongoose.connection.collection('clips').createIndexes([
      { key: { creator: 1 } },
      { key: { assetCID: 1 } },
      { key: { active: 1 } },
      { key: { createdAt: -1 } }
    ]);

    const receiptResult = await mongoose.connection.collection('receipts').createIndexes([
      { key: { licenseId: 1 }, unique: true },
      { key: { buyer: 1 } },
      { key: { clipId: 1 } },
      { key: { expiryTs: 1 } },
      { key: { createdAt: -1 } }
    ]);

    const nonceResult = await mongoose.connection.collection('nonces').createIndexes([
      { key: { address: 1 }, unique: true }
    ]);

    logger.info('Database indexes created successfully');
    logger.info(`Clips indexes: ${JSON.stringify(clipResult)}`);
    logger.info(`Receipts indexes: ${JSON.stringify(receiptResult)}`);
    logger.info(`Nonces indexes: ${JSON.stringify(nonceResult)}`);

    // Create initial admin user if needed
    // This is where you might set up initial admin accounts

    logger.info('Database setup completed');
    process.exit(0);

  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();