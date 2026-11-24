const Article = require('../models/Article');

// GET /api/articles — public, published only, ordered
exports.getPublicArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/articles — all articles (admin)
exports.getAdminArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json({ success: true, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/articles
exports.createArticle = async (req, res) => {
  try {
    const { title, tag, tagColor, excerpt, imageUrl, date, readTime, content, isPublished, order } = req.body;
    const article = await Article.create({ title, tag, tagColor, excerpt, imageUrl, date, readTime, content, isPublished, order });
    res.status(201).json({ success: true, data: article });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/articles/:id
exports.updateArticle = async (req, res) => {
  try {
    const { title, tag, tagColor, excerpt, imageUrl, date, readTime, content, isPublished, order } = req.body;
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { title, tag, tagColor, excerpt, imageUrl, date, readTime, content, isPublished, order },
      { new: true, runValidators: true }
    );
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, data: article });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/articles/:id
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
