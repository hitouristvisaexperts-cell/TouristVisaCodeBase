const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    client:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true },
    raisedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    raisedByRole:  { type: String, enum: ['client','team'], required: true },
    type: {
      type: String,
      enum: [
        'no_response_from_team',
        'no_response_from_client',
        'document_issue',
        'delay_in_processing',
        'other',
      ],
      required: true,
    },
    message:       { type: String, required: true, trim: true, maxlength: 1000 },
    status:        { type: String, enum: ['open','acknowledged','resolved'], default: 'open' },
    resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNote:{ type: String, trim: true, maxlength: 1000 },
    resolvedAt:    { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Escalation', escalationSchema);
