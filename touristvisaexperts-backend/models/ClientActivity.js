const mongoose = require('mongoose');

// Granular per-client activity log visible to admin
const activitySchema = new mongoose.Schema(
  {
    client:     { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    actor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName:  { type: String }, // snapshot at time of action
    actorRole:  { type: String, enum: ['admin','team','client','system'], required: true },
    action:     { type: String, required: true }, // human-readable short label
    details:    { type: String }, // longer description
    meta:       { type: mongoose.Schema.Types.Mixed }, // optional extra data
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientActivity', activitySchema);
