const express = require('express');
const eventListener = require('../services/eventListener');
const { relayerQueue, indexerQueue } = require('../services/queue');
const logger = require('../utils/logger');
const router = express.Router();

// Basic admin authentication middleware
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  const token = authHeader.substring(7);
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }

  next();
};

router.use(adminAuth);

router.get('/status', async (req, res) => {
  try {
    const [relayerStats, indexerStats] = await Promise.all([
      relayerQueue.getJobCounts(),
      indexerQueue.getJobCounts()
    ]);

    const status = {
      eventListener: {
        isListening: eventListener.isListening,
        lastBlock: eventListener.lastBlock
      },
      queues: {
        relayer: relayerStats,
        indexer: indexerStats
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    res.json(status);
  } catch (error) {
    logger.error('Admin status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

router.post('/events/start', (req, res) => {
  try {
    eventListener.start();
    res.json({ success: true, message: 'Event listener started' });
  } catch (error) {
    logger.error('Failed to start event listener:', error);
    res.status(500).json({ error: 'Failed to start event listener' });
  }
});

router.post('/events/stop', (req, res) => {
  try {
    eventListener.stop();
    res.json({ success: true, message: 'Event listener stopped' });
  } catch (error) {
    logger.error('Failed to stop event listener:', error);
    res.status(500).json({ error: 'Failed to stop event listener' });
  }
});

router.post('/events/replay', async (req, res) => {
  try {
    const { fromBlock, toBlock } = req.body;
    
    if (!fromBlock || !toBlock) {
      return res.status(400).json({ error: 'fromBlock and toBlock are required' });
    }

    const count = await eventListener.replayEvents(parseInt(fromBlock), parseInt(toBlock));
    
    res.json({ 
      success: true, 
      message: `Replayed ${count} events`,
      count 
    });
  } catch (error) {
    logger.error('Event replay error:', error);
    res.status(500).json({ error: 'Failed to replay events' });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const { type = 'all', status = 'waiting', page = 1, limit = 50 } = req.query;
    
    const queue = type === 'indexer' ? indexerQueue : relayerQueue;
    
    let jobs = [];
    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(parseInt(page) * parseInt(limit));
        break;
      case 'active':
        jobs = await queue.getActive();
        break;
      case 'completed':
        jobs = await queue.getCompleted(parseInt(page) * parseInt(limit));
        break;
      case 'failed':
        jobs = await queue.getFailed(parseInt(page) * parseInt(limit));
        break;
      default:
        jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed']);
    }

    const jobDetails = jobs.slice(0, parseInt(limit)).map(async job => ({
      id: job.id,
      name: job.name,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attempts: job.attemptsMade,
      data: job.data,
      state: await job.getState()
    }));

    res.json({ jobs: jobDetails });
  } catch (error) {
    logger.error('Admin jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'relayer' } = req.query;
    
    const queue = type === 'indexer' ? indexerQueue : relayerQueue;
    const job = await queue.getJob(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.remove();
    
    res.json({ success: true, message: 'Job removed' });
  } catch (error) {
    logger.error('Admin job removal error:', error);
    res.status(500).json({ error: 'Failed to remove job' });
  }
});

module.exports = router;