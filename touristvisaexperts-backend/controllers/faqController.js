const FAQ = require('../models/FAQ');

// GET /api/faqs
exports.getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;

    const faqs = await FAQ.find(query).sort({ category: 1, order: 1 });

    // Group by category
    const grouped = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push({ id: faq._id, question: faq.question, answer: faq.answer });
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors || {}).map(e => e.message).join(', ') || 'Invalid data' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/faqs  (admin only)
exports.createFAQ = async (req, res) => {
  try {
    const { category, question, answer, order } = req.body;
    const faq = await FAQ.create({ category, question, answer, order });
    res.status(201).json({ success: true, data: faq });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors || {}).map(e => e.message).join(', ') || 'Invalid data' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/faqs/:id  (admin only)
exports.updateFAQ = async (req, res) => {
  try {
    const { question, answer, order, isActive } = req.body;
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer, order, isActive },
      { new: true, runValidators: true }
    );
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, data: faq });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors || {}).map(e => e.message).join(', ') || 'Invalid data' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/faqs/:id  (admin only)
exports.deleteFAQ = async (req, res) => {
  try {
    await FAQ.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'FAQ deactivated' });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors || {}).map(e => e.message).join(', ') || 'Invalid data' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
