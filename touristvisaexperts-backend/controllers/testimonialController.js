const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Testimonial = require('../models/Testimonial');

// The portal sends a ~30 KB cropped square; the cap only guards against abuse.
const MAX_PHOTO_BYTES = 400 * 1024;
const SIGNATURES = {
  'image/jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png':  b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
};

// The six reviews the website shipped with — "Import" in the portal loads them so they can be edited
const DEFAULTS = [
  { country: 'USA',       quote: 'The team made my USA visa process so easy and stress-free. Got my visa in just a few days!', name: 'Rohit Mehta',   city: 'Mumbai, India',    photo: 'rohit.jpg',  approvedOn: '2026-05-15' },
  { country: 'UK',        quote: 'Excellent service and guidance at every step. Highly recommended!',                          name: 'Ananya Sharma', city: 'Delhi, India',     photo: 'ananya.jpg', approvedOn: '2026-04-22' },
  { country: 'Canada',    quote: 'Professional, reliable and very responsive. Got my Canada visa without any hassle.',         name: 'Arjun Nair',    city: 'Bangalore, India', photo: 'arjun.jpg',  approvedOn: '2026-06-10' },
  { country: 'Australia', quote: 'Smooth and seamless experience. My Australia visa was approved faster than I expected!',     name: 'Priya Kapoor',  city: 'Chennai, India',   photo: 'ananya.jpg', approvedOn: '2026-03-03' },
  { country: 'Schengen',  quote: 'They handled everything perfectly. Europe trip was a dream come true thanks to this team!',  name: 'Vikram Singh',  city: 'Pune, India',      photo: 'rohit.jpg',  approvedOn: '2026-07-18' },
  { country: 'Dubai',     quote: 'Fast, efficient and very professional. Got my Dubai visa within 24 hours. Amazing service!', name: 'Sneha Reddy',   city: 'Hyderabad, India', photo: 'arjun.jpg',  approvedOn: '2026-08-29' },
];

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

function fail(res, err) {
  if (err.status) return res.status(err.status).json({ success: false, message: err.message });
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ success: false, message: Object.values(err.errors || {}).map(e => e.message).join(', ') || 'Invalid data' });
  }
  res.status(500).json({ success: false, message: 'Server error' });
}

// "data:image/jpeg;base64,…" → { data, type }; anything that isn't a real JPEG/PNG/WEBP is refused
function parsePhoto(dataUrl) {
  const str = String(dataUrl || '');
  if (str.length > MAX_PHOTO_BYTES * 1.4 + 64) throw badRequest('Photo is too large (max 400 KB).');
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(str);
  if (!m) throw badRequest('Photo must be a JPEG, PNG or WEBP image.');
  const data = Buffer.from(m[2], 'base64');
  if (data.length > MAX_PHOTO_BYTES) throw badRequest('Photo is too large (max 400 KB).');
  if (!SIGNATURES[m[1]](data)) throw badRequest('Photo file is not a valid image.');
  return { data, type: m[1] };
}

function pickFields(body) {
  const out = {};
  for (const k of ['name', 'city', 'country', 'quote']) {
    if (body[k] !== undefined) out[k] = String(body[k] ?? '').trim();
  }
  if (body.rating !== undefined) out.rating = Math.min(5, Math.max(1, Math.round(Number(body.rating)) || 5));
  if (body.isPublished !== undefined) out.isPublished = body.isPublished === true || body.isPublished === 'true';
  if (body.approvedOn !== undefined) {
    const d = body.approvedOn ? new Date(body.approvedOn) : null;
    out.approvedOn = d && !isNaN(d) ? d : null;
  }
  return out;
}

function applyPhoto(doc, photo) {
  if (photo === undefined) return;
  if (photo === null || photo === '') {
    doc.photoData = undefined;
    doc.photoType = '';
  } else {
    const { data, type } = parsePhoto(photo);
    doc.photoData = data;
    doc.photoType = type;
  }
  doc.photoVersion = (doc.photoVersion || 0) + 1;
}

// photoPath is relative to the API root, e.g. /testimonials/<id>/photo?v=2
const shape = (t, admin = false) => ({
  _id: t._id,
  name: t.name,
  city: t.city,
  country: t.country,
  quote: t.quote,
  rating: t.rating,
  approvedOn: t.approvedOn || t.createdAt,
  photoPath: t.photoType ? `/testimonials/${t._id}/photo?v=${t.photoVersion}` : '',
  ...(admin ? { isPublished: t.isPublished, order: t.order, hasCustomDate: !!t.approvedOn } : {}),
});

// GET /api/testimonials — published reviews for the website
exports.getPublicTestimonials = async (req, res) => {
  try {
    const list = await Testimonial.find({ isPublished: true }).sort({ order: 1, createdAt: -1 }).limit(50).lean();
    // revalidate every time (cheap 304 via ETag) so edits in the portal show up on the next page load
    res.set('Cache-Control', 'no-cache');
    res.json({ success: true, data: list.map(t => shape(t)) });
  } catch (err) { fail(res, err); }
};

// GET /api/testimonials/:id/photo — the cropped photo; URL carries ?v= so it can be cached for a year
exports.getTestimonialPhoto = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Not found' });
    const t = await Testimonial.findById(req.params.id).select('+photoData photoType');
    if (!t || !t.photoType || !t.photoData) return res.status(404).json({ success: false, message: 'Not found' });
    res.set({
      'Content-Type': t.photoType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      // the website lives on another subdomain — let it display the image
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(t.photoData);
  } catch (err) { fail(res, err); }
};

// GET /api/admin/testimonials
exports.listTestimonials = async (req, res) => {
  try {
    const list = await Testimonial.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json({ success: true, data: list.map(t => shape(t, true)) });
  } catch (err) { fail(res, err); }
};

// POST /api/admin/testimonials
exports.createTestimonial = async (req, res) => {
  try {
    const last = await Testimonial.findOne().sort({ order: -1 }).select('order').lean();
    const doc = new Testimonial({ ...pickFields(req.body), order: (last?.order ?? -1) + 1 });
    applyPhoto(doc, req.body.photo);
    await doc.save();
    res.status(201).json({ success: true, data: shape(doc, true) });
  } catch (err) { fail(res, err); }
};

// PUT /api/admin/testimonials/:id — photo: data URL = replace, null = remove, absent = keep
exports.updateTestimonial = async (req, res) => {
  try {
    const doc = await Testimonial.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    doc.set(pickFields(req.body));
    applyPhoto(doc, req.body.photo);
    await doc.save();
    res.json({ success: true, data: shape(doc, true) });
  } catch (err) { fail(res, err); }
};

// DELETE /api/admin/testimonials/:id
exports.deleteTestimonial = async (req, res) => {
  try {
    const doc = await Testimonial.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true });
  } catch (err) { fail(res, err); }
};

// PUT /api/admin/testimonials/reorder  { ids: [...] } — website shows them in this order
exports.reorderTestimonials = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : null;
    if (!ids || !ids.length || ids.length > 200 || !ids.every(id => mongoose.isValidObjectId(id))) {
      throw badRequest('ids must be a list of testimonial ids');
    }
    await Testimonial.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
    res.json({ success: true });
  } catch (err) { fail(res, err); }
};

// POST /api/admin/testimonials/import-defaults — only when the list is still empty
exports.importDefaultTestimonials = async (req, res) => {
  try {
    if (await Testimonial.countDocuments()) {
      return res.status(409).json({ success: false, message: 'Testimonials already exist — nothing imported.' });
    }
    const dir = path.join(__dirname, '..', 'seeds', 'testimonials');
    const docs = DEFAULTS.map(({ photo, approvedOn, ...t }, i) => {
      const file = path.join(dir, photo);
      const has = fs.existsSync(file);
      return {
        ...t, approvedOn: new Date(approvedOn), order: i, isPublished: true,
        ...(has ? { photoData: fs.readFileSync(file), photoType: 'image/jpeg', photoVersion: 1 } : {}),
      };
    });
    await Testimonial.insertMany(docs);
    const list = await Testimonial.find().sort({ order: 1 }).lean();
    res.status(201).json({ success: true, data: list.map(t => shape(t, true)) });
  } catch (err) { fail(res, err); }
};
