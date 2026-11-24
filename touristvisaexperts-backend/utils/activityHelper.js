const ClientActivity = require('../models/ClientActivity');

/**
 * Log a client activity event.
 * Non-blocking — errors are silently swallowed so they never break main flow.
 */
module.exports = async function logActivity({ clientId, actor, actorName, actorRole, action, details, meta }) {
  try {
    await ClientActivity.create({
      client:    clientId,
      actor:     actor   || null,
      actorName: actorName || null,
      actorRole,
      action,
      details:   details || null,
      meta:      meta    || null,
    });
  } catch (err) {
    console.error('[ActivityLog]', err.message);
  }
};
