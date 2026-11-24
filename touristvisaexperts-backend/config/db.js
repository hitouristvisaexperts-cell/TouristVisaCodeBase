const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('\n❌ ERROR: MONGO_URI is missing in touristvisaexperts-backend/.env');
    console.error('👉 Please set MONGO_URI in touristvisaexperts-backend/.env to your MongoDB Atlas connection string or local MongoDB URL (e.g. mongodb://127.0.0.1:27017/touristvisa)\n');
    process.exit(1);
  }
  const conn = await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 50,
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
