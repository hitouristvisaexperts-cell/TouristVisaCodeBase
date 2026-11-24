const mongoose = require('mongoose');

// One row per Razorpay payment we have acted on. The unique index on paymentId
// makes every "verify payment" endpoint idempotent: the same payment can never
// create a second case, booking or co-applicant slot, even if it is replayed.
const paymentRecordSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, trim: true },
    orderId:   { type: String, trim: true },
    kind:      { type: String, enum: ['visa', 'flight', 'add_members', 'consultation'], required: true },
    amount:    { type: Number },                       // paise actually charged (from the Razorpay order)
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ref:       { type: mongoose.Schema.Types.ObjectId }, // Client / FlightReservation / ConsultationBooking id
    status:    { type: String, enum: ['processing', 'done'], default: 'processing' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
