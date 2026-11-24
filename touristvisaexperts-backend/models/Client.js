const mongoose = require('mongoose');
const { CLIENT_STATUSES, INTERNAL_STAGES, APPOINTMENT_MODULE } = require('../utils/constants');

const allClientStatuses = Object.values(CLIENT_STATUSES);
const allStageKeys = Object.keys(INTERNAL_STAGES);
const FIRST_STAGE_KEY = allStageKeys[0]; // 'STAGE_1_WELCOME_SETUP'

const familyMemberSchema = new mongoose.Schema(
  {
    name:           { type: String, trim: true, required: true },
    relation:       { type: String, trim: true }, // spouse, child, parent, sibling, other
    dateOfBirth:    { type: String, trim: true },
    passportNumber: { type: String, trim: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const stageSchema = new mongoose.Schema(
  {
    stageKey: { type: String, enum: allStageKeys, required: true },
    tasks: [taskSchema],
    completedAt: { type: Date },
  },
  { _id: false }
);

// Appointment booking — parallel independent module (not a numbered stage)
const appointmentModuleSchema = new mongoose.Schema(
  {
    tasks: [taskSchema],
    completedAt: { type: Date },
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Visa details
    visaType: { type: String, trim: true },
    destinationCountry: { type: String, trim: true },
    travelDate: { type: Date },
    numberOfApplicants: { type: Number, default: 1 },

    // Personal info
    passportNumber: { type: String, trim: true },
    nationality: { type: String, trim: true },
    dateOfBirth: { type: Date },

    // Status tracking
    clientStatus: {
      type: String,
      enum: allClientStatuses,
      default: CLIENT_STATUSES.WELCOME_CONSULTATION_PENDING,
    },
    currentStageKey: {
      type: String,
      enum: allStageKeys,
      default: FIRST_STAGE_KEY,
    },
    stages: [stageSchema],

    // Appointment Booking — runs in parallel with the numbered stages
    appointmentModule: { type: appointmentModuleSchema, default: undefined },

    // Google Meet call
    meetLink: { type: String, trim: true },
    meetScheduledAt: { type: Date },

    // Family members (for group/family visa applications)
    familyMembers: { type: [familyMemberSchema], default: [] },

    // Additional info
    packageType: { type: String, trim: true },
    paymentId: { type: String, trim: true },
    orderId: { type: String, trim: true },
    isPurchased: { type: Boolean, default: false },
    remarks: { type: String, trim: true, maxlength: 2000 },

    // Client-raised flag (issue at current stage)
    flagged:      { type: Boolean, default: false },
    flagMessage:  { type: String, trim: true, maxlength: 500, default: '' },
    flaggedAt:    { type: Date },
    flagStage:    { type: String, trim: true },

    // ── Inactivity tracking (45-day compliance auto-close) ──────────────────
    lastRequestAt:   { type: Date, default: null }, // set when we ask the client for something and are awaiting a response
    lastResponseAt:  { type: Date, default: null }, // set when the client responds (document upload, etc.)
    inactivityRemindersSent: { type: [Number], default: [] }, // e.g. [7, 14, 21, 30, 35] — prevents duplicate sends
    inactivityAutoClosed:    { type: Boolean, default: false },
    inactivityAutoClosedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

clientSchema.index({ user: 1 });
clientSchema.index({ lastRequestAt: 1, inactivityAutoClosed: 1 });

// Auto-initialize stages + appointment module when a new client is created
clientSchema.pre('save', function (next) {
  if (this.isNew && this.stages.length === 0) {
    this.stages = Object.entries(INTERNAL_STAGES).map(([key, stage]) => ({
      stageKey: key,
      tasks: stage.tasks.map((t) => ({ name: t, completed: false })),
    }));
  }
  if (this.isNew && !this.appointmentModule) {
    this.appointmentModule = {
      tasks: APPOINTMENT_MODULE.tasks.map((t) => ({ name: t, completed: false })),
    };
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema);
