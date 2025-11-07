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
const adminRouter = require('./routes/admin');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/clips', clipsRouter);
app.use('/api/relayer', relayerRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Rightly Backend',
    version: '1.0.0'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

module.exports = app;