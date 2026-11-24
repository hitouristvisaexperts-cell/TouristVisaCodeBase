const { createWorker } = require('tesseract.js');
const path  = require('path');
const fs    = require('fs');
const Client   = require('../models/Client');
const Document = require('../models/Document');
const logActivity = require('../utils/activityHelper');
const resolveFilePath = require('../utils/resolveFilePath');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/* ── MRZ parser (TD3 passport — two 44-char lines) ───────────────────────── */
function parseMRZ(text) {
  // Extract the longest clean MRZ substring from each line
  // Tesseract often reads '<' as 'K', 'L', 'C', '(' — normalise them in context
  const mrzCandidates = [];
  for (const rawLine of text.split('\n')) {
    const upper = rawLine.toUpperCase().replace(/\s/g, '');
    // Find the longest run of MRZ-valid characters
    const match = upper.match(/[A-Z0-9<]{20,}/g);
    if (!match) continue;
    for (const seg of match) {
      if (seg.length >= 30) mrzCandidates.push(seg.slice(0, 44).padEnd(44, '<'));
    }
  }

  if (mrzCandidates.length < 2) return null;

  // Find two consecutive candidates — prefer pairs where first starts with P and second has a digit check char
  let l1 = null, l2 = null;
  for (let i = 0; i < mrzCandidates.length - 1; i++) {
    const a = mrzCandidates[i];
    const b = mrzCandidates[i + 1];
    if (a.length >= 40 && b.length >= 40) {
      l1 = a; l2 = b; break;
    }
  }
  if (!l1 || !l2) return null;

  try {
    // Common OCR misreads in MRZ — normalise before parsing
    // In name zone (alpha only): 0→O, 1→I, 8→B
    const normName = (s) => s.replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B');
    // In numeric zone: O→0, I→1, B→8
    const normNum  = (s) => s.replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8');
    // Strip trailing filler — Tesseract often reads '<' as K, L, C, (, [ in MRZ
    const stripFiller = (s) => s.replace(/[KLC(<\[]{2,}$/, '').replace(/\s+/g, ' ').trim();

    // Line 1: P<NATSURNAME<<GIVEN<<<<<<<<
    const docType    = normName(l1.slice(0, 2)).replace(/</g, '');
    const issuing    = normName(l1.slice(2, 5)).replace(/</g, '');
    const namePart   = l1.slice(5);
    const [surnameRaw, ...givenRaw] = namePart.split('<<');
    const surname    = stripFiller(normName(surnameRaw || '').replace(/</g, ' ')).trim();
    const givenNames = stripFiller(normName(givenRaw.join(' ')).replace(/</g, ' ')).trim();

    // Line 2: PASSPORTNO CHECK NATIONALITY DOB CHECK SEX EXPIRY CHECK PERSONAL CHECK COMPOSITE
    const passportNo  = l2.slice(0, 9).replace(/</g, '');
    const nationality = normName(l2.slice(10, 13)).replace(/</g, '');
    const dobRaw      = normNum(l2.slice(13, 19));
    const sex         = l2.slice(20, 21);
    const expiryRaw   = normNum(l2.slice(21, 27));

    const curYear = new Date().getFullYear() % 100; // e.g. 26 for 2026
    const formatDate = (raw, isExpiry = false) => {
      if (!raw || raw.length < 6) return raw;
      const yy = raw.slice(0, 2);
      const mm = raw.slice(2, 4);
      const dd = raw.slice(4, 6);
      const yyInt = parseInt(yy);
      // For expiry: prefer 20xx unless clearly in the past
      // For DOB: if yy > curYear + 5, it's a 19xx birth year
      const year = isExpiry
        ? `20${yy}`
        : (yyInt > curYear + 5 ? `19${yy}` : `20${yy}`);
      return `${dd}/${mm}/${year}`;
    };

    return {
      documentType: docType,
      issuingCountry: issuing,
      surname,
      givenNames,
      fullName: `${surname} ${givenNames}`.trim(),
      passportNumber: passportNo,
      nationality,
      dateOfBirth: formatDate(dobRaw, false),
      sex: sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex,
      expiryDate: formatDate(expiryRaw, true),
      mrzLine1: l1,
      mrzLine2: l2,
    };
  } catch {
    return null;
  }
}

/* ── POST /api/team/clients/:id/documents/:docId/ocr ─────────────────────── */
exports.runOCR = async (req, res) => {
  try {
    const clientRecord = await Client.findOne({
      _id: req.params.id,
      ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}),
    });
    if (!clientRecord) return res.status(404).json({ success: false, message: 'Client not found' });

    const doc = await Document.findOne({ _id: req.params.docId, client: clientRecord._id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (!IMAGE_TYPES.includes(doc.mimeType)) {
      return res.status(400).json({ success: false, message: 'OCR only works on image files (JPEG, PNG, WEBP).' });
    }

    const filePath = resolveFilePath(doc.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server.' });
    }

    // Run Tesseract OCR
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();

    // Try MRZ parsing first (best accuracy for passports)
    const mrzData = parseMRZ(text);

    // Also return raw text for manual review
    const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const extracted = mrzData || {
      rawText: rawLines,
      note: 'MRZ not detected. Please review the raw text and fill fields manually.',
    };

    // Log activity
    await logActivity({
      clientId:  clientRecord._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action:    'OCR Run',
      details:   `OCR run on document "${doc.originalName}"${mrzData ? ' — MRZ detected' : ' — MRZ not detected'}`,
    });

    res.json({ success: true, data: { extracted, rawText: rawLines, mrzDetected: !!mrzData } });
  } catch (err) {
    console.error('OCR error:', err.message);
    res.status(500).json({ success: false, message: 'OCR processing failed: ' + err.message });
  }
};

/* ── PUT /api/team/clients/:id/documents/:docId/extracted ────────────────── */
exports.saveExtracted = async (req, res) => {
  try {
    const clientRecord = await Client.findOne({
      _id: req.params.id,
      ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}),
    });
    if (!clientRecord) return res.status(404).json({ success: false, message: 'Client not found' });

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.docId, client: clientRecord._id },
      { extractedData: req.body.extractedData },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    await logActivity({
      clientId:  clientRecord._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action:    'Passport Data Saved',
      details:   `Extracted passport data saved for "${doc.originalName}"`,
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
