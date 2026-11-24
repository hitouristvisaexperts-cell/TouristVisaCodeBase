const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    category: {
      type: String,
      enum: [
        'passport',
        'bank_statement',
        'employment',
        'travel_insurance',
        'flight_ticket',
        'hotel_booking',
        'cover_letter',
        'application_form',
        'sponsor_documents',
        'previous_visa_stamps',
        'property_funds',
        'other',
        'custom',
      ],
      default: 'other',
    },
    uploadedByRole: {
      type: String,
      enum: ['admin', 'team', 'client'],
    },
    notes: { type: String, trim: true, maxlength: 500 },

    // Team-generated docs for client review (cover letter, flight ticket, etc.)
    generatedByTeam:    { type: Boolean, default: false },
    clientReviewStatus: { type: String, enum: ['pending_review','approved','rejected'], default: null },
    clientReviewedAt:   { type: Date },

    // Custom category label (when category = 'custom')
    customType: { type: String, trim: true, maxlength: 100 },

    // Family member this doc belongs to (empty = primary applicant)
    familyMember: { type: String, trim: true, default: '' },

    // OCR extracted data (passport fields)
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // DPDP Act Statutory Compliance (Data Retention & Erasure)
    isPurged:    { type: Boolean, default: false, index: true },
    purgedAt:    { type: Date },
    purgeReason: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
