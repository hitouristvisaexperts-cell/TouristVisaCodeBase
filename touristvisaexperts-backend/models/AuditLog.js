const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true, trim: true },
    entity: { type: String, required: true }, // e.g. 'Client', 'User', 'Document'
    entityId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, trim: true },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Audit logs are never updated or deleted
auditLogSchema.set('versionKey', false);

module.exports = mongoose.model('AuditLog', auditLogSchema);
