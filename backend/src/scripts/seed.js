require('dotenv').config();
const mongoose = require('mongoose');
const Clip = require('../models/Clip');
const logger = require('../utils/logger');

const seedClips = [
  {
    creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    title: 'Sample Loop 1',
    description: 'A beautiful 10-second loop for your projects',
    assetCID: 'QmSampleCID1',
    price: '1000000000000000000', // 1 USX in wei
    durationDays: 7,
    splits: []
  },
  {
    creator: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
    title: 'Sample Loop 2',
    description: 'Another great loop for commercial use',
    assetCID: 'QmSampleCID2',
    price: '2000000000000000000', // 2 USX in wei
    durationDays: 30,
    splits: []
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing clips
    await Clip.deleteMany({});
    logger.info('Cleared existing clips');

    // Insert seed clips
    await Clip.insertMany(seedClips);
    logger.info('Seed clips inserted');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();