const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const relayerQueue = new Queue('relayerQueue', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

const indexerQueue = new Queue('indexerQueue', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000
  }
});

module.exports = { 
  relayerQueue, 
  indexerQueue, 
  connection, 
  Worker 
};