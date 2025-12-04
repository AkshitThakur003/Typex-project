const mongoose = require('mongoose');

// Always use test database in test environment, regardless of MONGODB_URI
const getMongoURI = () => {
  if (process.env.NODE_ENV === 'test') {
    // Force test database in test mode
    return process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/typex_test';
  }
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/typex';
};

const MONGODB_URI = getMongoURI();

module.exports = async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  
  // Safety check: prevent connecting to production database in test mode
  if (process.env.NODE_ENV === 'test') {
    if (MONGODB_URI.includes('/typex') && !MONGODB_URI.includes('/typex_test')) {
      throw new Error('SAFETY: Tests must use typex_test database, not production database!');
    }
  }
  
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI, {
    autoIndex: true,
  });
  console.log(`MongoDB connected to: ${mongoose.connection.name}`);
};
