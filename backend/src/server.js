const app = require('./app');
const connectMongo = require('./config/mongo');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectMongo();
    
    // Start workers
    require('./workers/relayerWorker');
    require('./workers/indexerWorker');
    
    const server = app.listen(PORT, () => {
      logger.info(`Rightly backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();