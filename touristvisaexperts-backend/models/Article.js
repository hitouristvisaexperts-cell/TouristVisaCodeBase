const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    tag:         { type: String, required: true, trim: true, default: 'Visa Guide' },
    tagColor:    { type: String, default: '#f97316' },   // hex colour shown on card
    excerpt:     { type: String, trim: true, default: '' },
    imageUrl:    { type: String, trim: true, default: '' },
    date:        { type: String, trim: true, default: '' },   // display string e.g. "Jun 21, 2026"
    readTime:    { type: String, trim: true, default: '3 min read' },
    content:     { type: String, default: '' },        // full HTML body of the article
    isPublished: { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
