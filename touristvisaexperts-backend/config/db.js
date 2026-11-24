const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 50,
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
