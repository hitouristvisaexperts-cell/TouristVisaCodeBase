require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const { ROLES, CLIENT_STATUSES } = require('../utils/constants');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // ── Team Members ──────────────────────────────────────────────
    const teamAccounts = [
      { name: 'Sarah Ahmed', email: 'sarah@finalvisa.com', password: 'Team@1234' },
      { name: 'Ravi Kumar', email: 'ravi@finalvisa.com', password: 'Team@1234' },
    ];

    const teamUsers = [];
    for (const t of teamAccounts) {
      const existing = await User.findOne({ email: t.email });
      if (existing) {
        console.log(`Team already exists: ${t.email}`);
        teamUsers.push(existing);
        continue;
      }
      const user = await User.create({ ...t, role: ROLES.TEAM });
      teamUsers.push(user);
      console.log(`Team created: ${t.email}`);
    }

    // ── Client Accounts + Client Records ─────────────────────────
    const clientAccounts = [
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'Client@1234',
        phone: '+91 9876543210',
        visaType: 'Schengen Tourist Visa',
        destinationCountry: 'Germany',
        status: CLIENT_STATUSES.DOCUMENTS_UNDER_REVIEW,
        assignedTo: teamUsers[0]?._id,
      },
      {
        name: 'James Wilson',
        email: 'james@example.com',
        password: 'Client@1234',
        phone: '+44 7911123456',
        visaType: 'UK Visit Visa',
        destinationCountry: 'United Kingdom',
        status: CLIENT_STATUSES.APPOINTMENT_IN_PROGRESS,
        assignedTo: teamUsers[1]?._id,
      },
      {
        name: 'Aisha Khan',
        email: 'aisha@example.com',
        password: 'Client@1234',
        phone: '+971 501234567',
        visaType: 'Dubai Tourist Visa',
        destinationCountry: 'UAE',
        status: CLIENT_STATUSES.WELCOME_CONSULTATION_PENDING,
        assignedTo: null,
      },
    ];

    for (const c of clientAccounts) {
      const existingUser = await User.findOne({ email: c.email });
      if (existingUser) {
        console.log(`Client already exists: ${c.email}`);
        continue;
      }

      const user = await User.create({
        name: c.name, email: c.email, password: c.password,
        phone: c.phone, role: ROLES.CLIENT,
      });

      await Client.create({
        user: user._id,
        assignedTo: c.assignedTo || null,
        visaType: c.visaType,
        destinationCountry: c.destinationCountry,
        status: c.status,
        notes: [],
        documents: [],
        tasks: [],
      });

      console.log(`Client created: ${c.email}`);
    }

    console.log('\n=== TEST ACCOUNTS READY ===\n');
    console.log('ADMIN');
    console.log('  admin@finalvisa.com   /  Admin@1234\n');
    console.log('TEAM');
    console.log('  sarah@finalvisa.com   /  Team@1234');
    console.log('  ravi@finalvisa.com    /  Team@1234\n');
    console.log('CLIENTS');
    console.log('  priya@example.com     /  Client@1234  (Schengen - Germany, assigned to Sarah)');
    console.log('  james@example.com     /  Client@1234  (UK Visa, assigned to Ravi)');
    console.log('  aisha@example.com     /  Client@1234  (Dubai Visa, unassigned)');

    process.exit(0);
  } catch (err) {
    console.error('Test seed error:', err.message);
    process.exit(1);
  }
};

seed();
