const mongoose = require('mongoose');

// Client reviews shown as "Visa Approved" tickets on the marketing site (home page + visa pages).
// The photo lives in the database (not /uploads) so it survives redeploys; the portal crops and
// resizes it to a small square before upload.
const testimonialSchema = new mongoose.Schema(
  {
    name:         { type: String, required: [true, 'Name is required'], trim: true, maxlength: [60, 'Name is too long (max 60 characters)'] },
    city:         { type: String, trim: true, default: '', maxlength: [60, 'City is too long (max 60 characters)'] },
    country:      { type: String, required: [true, 'Visa country is required'], trim: true, maxlength: [24, 'Country is too long (max 24 characters)'] },
    quote:        { type: String, required: [true, 'Review text is required'], trim: true, maxlength: [600, 'Review is too long (max 600 characters)'] },
    rating:       { type: Number, min: 1, max: 5, default: 5 },
    approvedOn:   { type: Date, default: null },   // date on the immigration stamp
    photoData:    { type: Buffer, select: false },
    photoType:    { type: String, default: '' },   // '' = no photo (site shows initials)
    photoVersion: { type: Number, default: 0 },    // bumps on every new photo so browsers refetch
    isPublished:  { type: Boolean, default: true },
    order:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
