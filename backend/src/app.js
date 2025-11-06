require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectMongo = require('./config/mongo');
const logger = require('./utils/logger');

const clipsRouter = require('./routes/clips');
const relayerRouter = require('./routes/relayer');
const receiptsRouter = require('./routes/receipts');
const authRouter = require('./routes/auth');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/clips', clipsRouter);
app.use('/api/relayer', relayerRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/auth', authRouter);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Rightly Backend'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;