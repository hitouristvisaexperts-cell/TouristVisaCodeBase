require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const team = await User.find({ role: 'team' }).select('name email phone isActive createdAt isFirstLogin').lean();
  const counts = await Client.aggregate([
    { $match: { assignedTo: { $in: team.map(t => t._id) } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id.toString()] = c.count; });

  if (team.length === 0) { console.log('No team members found.'); }
  team.forEach(t => {
    console.log('---');
    console.log('Name           :', t.name);
    console.log('Email          :', t.email);
    console.log('Phone          :', t.phone || 'N/A');
    console.log('Active         :', t.isActive);
    console.log('Password Set   :', !t.isFirstLogin ? 'Yes (changed from temp)' : 'NO — still on temp password');
    console.log('Clients        :', countMap[t._id.toString()] || 0);
    console.log('Joined         :', t.createdAt.toISOString().split('T')[0]);
  });

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
