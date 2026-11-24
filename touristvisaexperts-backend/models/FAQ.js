const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        'Booking Appointment',
        'Travel Insurance',
        'Flights',
        'Hotel Accommodation',
        'Before Appointment',
        'After Appointment',
        'Every Category',
      ],
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FAQ', faqSchema);
