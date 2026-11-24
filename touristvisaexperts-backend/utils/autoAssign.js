const User = require('../models/User');
const Client = require('../models/Client');

/**
 * Returns the team member _id with the fewest assigned clients.
 * Falls back to null if no team members exist.
 */
async function getAutoAssignTarget() {
  const teamMembers = await User.find({ role: 'team', isActive: true }).select('_id');
  if (!teamMembers.length) return null;

  const counts = await Client.aggregate([
    { $match: { assignedTo: { $in: teamMembers.map((m) => m._id) } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  for (const c of counts) countMap[c._id.toString()] = c.count;

  // Pick the member with the lowest count (default 0 if not in countMap)
  let minCount = Infinity;
  let target = null;
  for (const member of teamMembers) {
    const c = countMap[member._id.toString()] || 0;
    if (c < minCount) { minCount = c; target = member._id; }
  }
  return target;
}

module.exports = getAutoAssignTarget;
