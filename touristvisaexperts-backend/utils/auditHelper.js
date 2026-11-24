const AuditLog = require('../models/AuditLog');

const audit = async ({ performedBy, action, entity, entityId, description, previousValue, newValue, ipAddress }) => {
  try {
    await AuditLog.create({
      performedBy,
      action,
      entity,
      entityId,
      description,
      previousValue,
      newValue,
      ipAddress,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = audit;
