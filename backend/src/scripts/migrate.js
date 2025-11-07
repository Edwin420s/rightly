require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const migrateDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Database connected for migration');

    // Add any database migration logic here
    // Example: Adding new fields, updating schemas, etc.

    logger.info('Database migration completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  }
};

migrateDatabase();