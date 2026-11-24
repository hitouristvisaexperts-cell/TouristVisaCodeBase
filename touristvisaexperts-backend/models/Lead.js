const mongoose = require('mongoose');

// Website enquiries that are not (yet) visa cases:
//   kind 'consultation'       — a paid ₹999 consultation booked on /consultation
//   kind 'contact'            — a message sent from the Contact Us form
//   kind 'abandoned_checkout' — captured when a user enters contact info on /checkout
const leadSchema = new mongoose.Schema(
  {
    kind:        { type: String, enum: ['consultation', 'contact', 'abandoned_checkout'], required: true },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    email:       { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone:       { type: String, trim: true, maxlength: 30 },
    whatsapp:    { type: String, trim: true, maxlength: 30 },
    nationality: { type: String, trim: true, maxlength: 60 },
    country:     { type: String, trim: true, maxlength: 80 },   // destination they are asking about
    subject:     { type: String, trim: true, maxlength: 150 },
    message:     { type: String, trim: true, maxlength: 2000 },
    // consultation or checkout details
    amount:      { type: Number },                              // rupees
    packageType: { type: String, trim: true, maxlength: 80 },
    numberOfApplicants: { type: Number, default: 1 },
    convertedToClient:  { type: Boolean, default: false },
    convertedAt:        { type: Date },
    couponCode:  { type: String, trim: true, maxlength: 30 },
    paymentId:   { type: String, trim: true },
    orderId:     { type: String, trim: true },
    status:      { type: String, enum: ['new', 'contacted', 'scheduled', 'closed'], default: 'new' },
    adminNote:   { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

leadSchema.index({ kind: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
