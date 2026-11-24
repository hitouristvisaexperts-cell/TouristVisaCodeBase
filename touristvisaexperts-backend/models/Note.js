const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters'],
    },
    isInternal: { type: Boolean, default: true }, // internal = team-only; false = visible to client
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
