import mongoose from 'mongoose';
import logger from './logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retries = 0;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  const connect = async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      retries = 0;
      logger.info('MongoDB Atlas connected successfully');
    } catch (err) {
      retries += 1;
      logger.error(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}): ${err.message}`);
      if (retries >= MAX_RETRIES) {
        logger.error('Max MongoDB retries exceeded. Exiting.');
        process.exit(1);
      }
      setTimeout(connect, RETRY_DELAY_MS);
    }
  };

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting reconnect...');
    connect();
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });

  await connect();
};

export default connectDB;
