require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: ROLES.ADMIN });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@finalvisa.com',
      password: 'Admin@1234',
      role: ROLES.ADMIN,
    });

    console.log('Admin created:', admin.email);
    console.log('Password: Admin@1234  <-- Change this immediately after first login!');
    process.exit(0);
  } catch (err) {
    console.error('Admin seed error:', err.message);
    process.exit(1);
  }
};

seed();
