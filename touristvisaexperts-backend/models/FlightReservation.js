const mongoose = require('mongoose');

/*
 * Flight Reservation — fully separate from the Visa (Client) workflow.
 * High-volume, standalone dummy-ticket requests. Its own collection, own routes.
 */
const passengerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const flightReservationSchema = new mongoose.Schema(
  {
    // Route
    from: { type: String, trim: true, required: true },
    to: { type: String, trim: true, required: true },
    departureDate: { type: String, trim: true, required: true },
    returnDate: { type: String, trim: true },
    tripType: { type: String, enum: ['one-way', 'round-trip'], default: 'one-way' },

    // Passengers
    passengers: { type: [passengerSchema], default: [] },
    contactEmail: { type: String, trim: true, lowercase: true, required: true },
    contactPhone: { type: String, trim: true },

    // Payment
    amount: { type: Number, default: 999 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    paymentProvider: { type: String, enum: ['razorpay', 'stripe'], default: 'razorpay' },
    paymentId: { type: String, trim: true },
    orderId: { type: String, trim: true },
    isPaid: { type: Boolean, default: false },

    // Fulfilment workflow
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'in_progress', 'delivered', 'cancelled', 'flagged'],
      default: 'pending_payment',
    },
    ticketDeliveredAt: { type: Date },

    // Flag-for-attention (problem tracking)
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, trim: true },
    flaggedAt: { type: Date },

    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

flightReservationSchema.index({ status: 1, createdAt: -1 });
flightReservationSchema.index({ isFlagged: 1 });

module.exports = mongoose.model('FlightReservation', flightReservationSchema);
