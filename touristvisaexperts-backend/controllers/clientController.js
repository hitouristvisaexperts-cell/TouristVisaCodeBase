const crypto = require('crypto');
const { getPrices, clampApplicants } = require('../utils/pricing');
const { razorpayClient, isValidSignature, fetchOrder, orderKind, claimPayment, finishPayment, releasePayment } = require('../utils/razorpayHelper');
const Client = require('../models/Client');
const Document = require('../models/Document');
const Meeting = require('../models/Meeting');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const { INTERNAL_STAGES } = require('../utils/constants');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/activityHelper');
const notify = require('../utils/notifyHelper');
const User = require('../models/User');
const fs = require('fs');
const resolveFilePath = require('../utils/resolveFilePath');
const storageHelper = require('../utils/storageHelper');

// Resolves which visa case (Client doc) a client-role request is scoped to.
// A user can have multiple cases now; ?clientId= (or body.clientId) picks one —
// it must belong to the logged-in user. With no id given, falls back to the
// most recently created case (keeps old bookmarked URLs / stale frontend working).
const resolveClient = (req) => {
  const clientId = req.query.clientId || req.body?.clientId;
  const filter = clientId ? { _id: clientId, user: req.user._id } : { user: req.user._id };
  return Client.findOne(filter).sort({ createdAt: -1 });
};
exports.resolveClient = resolveClient;

// GET /api/client/cases — list all visa cases for the logged-in client
exports.getCases = async (req, res) => {
  try {
    const cases = await Client.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('visaType destinationCountry clientStatus packageType isPurchased createdAt');
    res.json({ success: true, data: cases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/client/status
exports.getStatus = async (req, res) => {
  try {
    const client = await resolveClient(req)
      .populate('assignedTo', 'name email phone')
      .select('clientStatus currentStageKey stages appointmentModule meetLink meetScheduledAt visaType destinationCountry travelDate isPurchased familyMembers numberOfApplicants flagged flagMessage flaggedAt flagStage');

    if (!client) return res.status(404).json({ success: false, message: 'Client profile not found' });

    // Short, client-friendly description for each stage
    const STAGE_DESCRIPTIONS = {
      STAGE_1_WELCOME_SETUP: 'We welcome you, set up your WhatsApp group, and book your main consultation.',
      STAGE_2_DEEP_DIVE_CONSULTATION: 'A detailed 30–45 min call to understand your profile and set clear expectations.',
      STAGE_3_DOCUMENT_COLLECTION: 'You upload your documents; we follow up on anything missing.',
      STAGE_4_DOCUMENT_VERIFICATION: 'We quality-check every document for accuracy and consistency.',
      STAGE_5_FORM_FILLING_APPROVAL: 'We fill your embassy application and get your written approval.',
      STAGE_6_WRITING_LETTERS: 'We prepare your cover letters, flights, hotel, and insurance.',
      STAGE_7_FINAL_DOUBLE_CHECK: 'A second expert does the final review before your appointment.',
      STAGE_8_APPOINTMENT_DAY: 'You attend your embassy/VFS appointment and submit biometrics.',
      STAGE_9_EMBASSY_PROCESSING: 'The embassy reviews your application; we track the decision.',
      STAGE_10_MARKETING_REVIEWS: 'We collect your feedback and review once your visa is approved.',
      STAGE_11_CLOSING_CASE: 'We archive your file and close the case neatly.',
    };

    // Build progress timeline (uses SOP stage names, no internal task keys exposed)
    const stageOrder = Object.entries(INTERNAL_STAGES).map(([key, stage]) => {
      const stageData = client.stages.find((s) => s.stageKey === key);
      return {
        stageKey: key,
        stageName: stage.name,
        clientStatus: stage.clientStatus,
        description: STAGE_DESCRIPTIONS[key] || '',
        order: stage.order,
        isCompleted: !!stageData?.completedAt,
        isCurrent: key === client.currentStageKey,
        completedAt: stageData?.completedAt,
      };
    });

    // Independent modules — shown separately, run in parallel with the stages
    const apptTasks = client.appointmentModule?.tasks || [];
    const apptDone = apptTasks.filter((t) => t.completed).length;
    const modules = [
      {
        key: 'APPOINTMENT_MODULE',
        name: 'Appointment Booking',
        info: 'Booking your embassy/VFS slot. This runs in parallel and can start as soon as you pay.',
        icon: 'calendar',
        total: apptTasks.length,
        done: apptDone,
        isComplete: !!client.appointmentModule?.completedAt,
      },
      {
        key: 'VISA_FORM_APPLICATION',
        name: 'Visa Form Application',
        info: 'Your official embassy application form — filled by our team and shared for your approval.',
        icon: 'form',
        // Derived from the Form Filling stage progress
        ...(() => {
          const s = client.stages.find((x) => x.stageKey === 'STAGE_5_FORM_FILLING_APPROVAL');
          const done = s ? s.tasks.filter((t) => t.completed).length : 0;
          const total = s ? s.tasks.length : 0;
          return { total, done, isComplete: !!s?.completedAt };
        })(),
      },
    ];

    res.json({
      success: true,
      data: {
        clientStatus: client.clientStatus,
        currentStageKey: client.currentStageKey,
        visaType: client.visaType,
        destinationCountry: client.destinationCountry,
        travelDate: client.travelDate,
        assignedTo: client.assignedTo,
        meetLink: client.meetLink,
        meetScheduledAt: client.meetScheduledAt,
        timeline: stageOrder,
        modules,
        isPurchased: client.isPurchased,
        numberOfApplicants: client.numberOfApplicants || 1,
        familyMembers: client.familyMembers || [],
        flagged: client.flagged,
        flagMessage: client.flagMessage,
        flaggedAt: client.flaggedAt,
        flagStage: client.flagStage,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/client/documents
exports.getDocuments = async (req, res) => {
  try {
    const client = await resolveClient(req).select('familyMembers');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const docs = await Document.find({ client: client._id })
      .select('originalName category customType mimeType fileSize uploadedByRole createdAt notes generatedByTeam clientReviewStatus clientReviewedAt familyMember')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: docs, familyMembers: client.familyMembers || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/client/documents/:docId/confirm
exports.confirmDocument = async (req, res) => {
  try {
    const { action } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approved or rejected' });
    }

    const client = await resolveClient(req);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.docId, client: client._id, generatedByTeam: true },
      { clientReviewStatus: action, clientReviewedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found or not reviewable' });

    await logActivity({
      clientId:  client._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: 'client',
      action:    action === 'approved' ? 'Document Approved' : 'Document Rejected',
      details:   `Client ${action} document "${doc.originalName}"`,
    });

    // Notify team member (assignedTo) and admins
    const teamUserId = client.assignedTo;
    if (teamUserId) {
      await notify({
        recipient: teamUserId,
        title: `Document ${action === 'approved' ? 'Approved' : 'Rejected'} by Client`,
        message: `Client ${action} document "${doc.originalName}"`,
        type: 'general',
      });
    }
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await notify({
        recipient: admin._id,
        title: `Document ${action === 'approved' ? 'Approved' : 'Rejected'} by Client`,
        message: `Client ${action} document "${doc.originalName}"`,
        type: 'general',
      });
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/client/documents/:docId/download
exports.downloadDocument = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    // Client can download docs they uploaded OR team-approved docs
    const doc = await Document.findOne({
      _id: req.params.docId,
      client: client._id,
      $or: [
        { uploadedByRole: 'client' },
        { generatedByTeam: true, clientReviewStatus: 'approved' },
      ],
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found or not yet approved' });

    const access = await storageHelper.getDocumentAccess(doc.filePath, doc.originalName, doc.mimeType);
    if (access.type === 'missing') {
      return res.status(404).json({ success: false, message: 'File not found on server. Please re-upload this document.' });
    }
    if (access.type === 'url') {
      return res.redirect(access.url);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    access.stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/client/documents/:docId  (client can only delete their own uploaded docs)
exports.deleteDocument = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const doc = await Document.findOne({
      _id: req.params.docId,
      client: client._id,
      uploadedByRole: 'client',
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found or cannot be deleted' });

    // Delete file from S3 / Cloudflare R2 / local
    await storageHelper.deleteDocumentFile(doc.filePath);

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/client/documents  (base64 JSON upload — bypasses proxy multipart issues)
exports.uploadDocument = async (req, res) => {
  try {
    const { originalName, mimeType, category, notes, data, familyMember } = req.body;

    if (!data || !originalName || !mimeType) {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }

    const ALLOWED_TYPES = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Only PDF, Word, JPEG, PNG, WEBP allowed.' });
    }

    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large. Maximum 5MB.' });
    }

    const client = await resolveClient(req);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    // Store in Cloudflare R2 / AWS S3 (or local fallback)
    const { fileName, filePath } = await storageHelper.saveDocument(buffer, originalName, mimeType);

    const doc = await Document.create({
      client: client._id,
      uploadedBy: req.user._id,
      originalName,
      fileName,
      filePath,
      fileSize: buffer.length,
      mimeType,
      category: category || 'other',
      uploadedByRole: 'client',
      notes,
      familyMember: familyMember || '',
    });

    // Compliance: client responded — reset the 45-day inactivity clock
    client.lastResponseAt = new Date();
    client.lastRequestAt = null;
    client.inactivityRemindersSent = [];
    await client.save();

    // Notify assigned team member and admins that a new document is waiting
    if (client.assignedTo) {
      await notify({
        recipient: client.assignedTo,
        title: 'New Document Uploaded by Client',
        message: `${req.user.name} uploaded "${originalName}"${familyMember ? ` for ${familyMember}` : ''}.`,
        type: 'general',
      });
    }
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await notify({
        recipient: admin._id,
        title: 'New Document Uploaded by Client',
        message: `${req.user.name} uploaded "${originalName}"${familyMember ? ` for ${familyMember}` : ''}.`,
        type: 'general',
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: doc._id,
        originalName: doc.originalName,
        category: doc.category,
        uploadedAt: doc.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/client/meetings
exports.getMeetings = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const meetings = await Meeting.find({ client: client._id })
      .select('meetLink scheduledAt duration title status')
      .sort({ scheduledAt: -1 });

    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/client/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/client/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/client/notes  (only non-internal notes)
exports.getNotes = async (req, res) => {
  try {
    const client = await resolveClient(req);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const notes = await Note.find({ client: client._id, isInternal: false })
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/client/escalate — client raises escalation (uses shared controller)
exports.raiseEscalation = require('./escalationController').raiseEscalation;

// POST /api/client/support
exports.sendSupport = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !subject.trim()) return res.status(400).json({ success: false, message: 'Subject is required.' });
    if (!message || message.trim().length < 10) return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });

    const adminEmail = process.env.SMTP_USER || 'admin@touristvisaexperts.com';
    const clientName = req.user.name;
    const clientEmail = req.user.email;

    await sendEmail({
      to: adminEmail,
      subject: `[Client Support] ${subject.trim()}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1e293b;margin-bottom:4px;">New Support Request</h2>
          <p style="color:#64748b;margin-top:0;margin-bottom:24px;">A client has sent a support message via the portal.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#64748b;width:120px;">From</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${clientName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;color:#0f172a;">${clientEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Subject</td><td style="padding:8px 0;color:#0f172a;">${subject.trim()}</td></tr>
          </table>
          <div style="background:#f8fafc;border-left:4px solid #8b5cf6;padding:16px 20px;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#334155;line-height:1.7;white-space:pre-wrap;">${message.trim()}</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Reply directly to this email to respond to the client.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Your message has been sent to our team. We will get back to you shortly.' });
  } catch (err) {
    console.error('Support email error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
};

const sanitizeFamily = (list) => (Array.isArray(list) ? list : [])
  .filter(m => m?.name?.trim())
  .slice(0, 19)
  .map(m => ({
    name:           String(m.name).trim().slice(0, 100),
    relation:       String(m.relation || '').trim().slice(0, 50),
    dateOfBirth:    String(m.dateOfBirth || '').trim().slice(0, 20),
    passportNumber: String(m.passportNumber || '').trim().slice(0, 30),
  }));

// Paid applicant slots on a case = the main applicant + co-applicants paid for.
const paidSlots = (client) => Math.max(1, parseInt(client?.numberOfApplicants, 10) || 1);

// POST /api/client/add-members/create-order — pay for extra co-applicants on a case
exports.createAddMembersOrder = async (req, res) => {
  try {
    const n = clampApplicants(req.body.count);
    const client = await resolveClient(req).select('_id numberOfApplicants');
    if (!client) return res.status(404).json({ success: false, message: 'Client profile not found.' });
    if (paidSlots(client) + n > 20) return res.status(400).json({ success: false, message: 'A case can have at most 20 applicants.' });

    const { addMember } = await getPrices();
    const order = await razorpayClient().orders.create({
      amount:   addMember * n * 100,
      currency: 'INR',
      receipt:  `fm_${Date.now()}`,        // max 40 chars — keep short
      notes:    { kind: 'add_members', userId: req.user._id.toString(), clientId: client._id.toString(), members: String(n) },
    });

    res.json({
      success: true,
      data: {
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
        count:    n,
        pricePerMember: addMember,
      },
    });
  } catch (err) {
    console.error('createAddMembersOrder error:', err.message);
    res.status(500).json({ success: false, message: 'Could not initiate payment. Please try again.' });
  }
};

// POST /api/client/add-members/verify
exports.verifyAddMembersPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, familyMembers } = req.body;
  if (!isValidSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ success: false, message: 'Payment verification failed.' });
  }

  // How many people were paid for, and for whom, comes from the order our server created
  const order = await fetchOrder(razorpay_order_id);
  if (!order) return res.status(502).json({ success: false, message: 'Could not confirm the payment with Razorpay. Please try again in a minute.' });
  const notes = order.notes || {};
  if (orderKind(order) !== 'add_members' || notes.userId !== req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'This payment does not belong to this request.' });
  }

  const client = await Client.findOne({ _id: notes.clientId || req.body.clientId, user: req.user._id }).select('familyMembers numberOfApplicants');
  if (!client) return res.status(404).json({ success: false, message: 'Client profile not found.' });

  const added = clampApplicants(notes.members);
  const sanitized = sanitizeFamily(familyMembers);
  const allowed = paidSlots(client) - 1 + added;
  if (sanitized.length > allowed) {
    return res.status(400).json({ success: false, message: `You paid for ${added} additional applicant${added > 1 ? 's' : ''}. Please list at most ${allowed} co-applicant${allowed > 1 ? 's' : ''}.` });
  }

  const claim = await claimPayment({ paymentId: razorpay_payment_id, orderId: razorpay_order_id, kind: 'add_members', amount: order.amount, user: req.user._id });
  if (!claim.claimed) return res.json({ success: true, alreadyProcessed: true, data: client.familyMembers });

  try {
    client.familyMembers = sanitized;
    client.numberOfApplicants = paidSlots(client) + added;
    await client.save();
    await finishPayment(claim.record, client._id);
    res.json({ success: true, data: client.familyMembers, numberOfApplicants: client.numberOfApplicants });
  } catch (err) {
    console.error('verifyAddMembersPayment error:', err.message);
    await releasePayment(claim.record);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/client/family-members — edit names/details of co-applicants already paid for.
// Adding MORE people than were paid for goes through /add-members (payment required).
exports.updateFamilyMembers = async (req, res) => {
  try {
    const { familyMembers } = req.body;
    if (!Array.isArray(familyMembers)) {
      return res.status(400).json({ success: false, message: 'familyMembers must be an array.' });
    }
    const sanitized = sanitizeFamily(familyMembers);

    const client = await resolveClient(req).select('familyMembers numberOfApplicants');
    if (!client) return res.status(404).json({ success: false, message: 'Client profile not found.' });

    const allowed = paidSlots(client) - 1;
    if (sanitized.length > allowed) {
      return res.status(402).json({ success: false, message: `Your package covers ${allowed} co-applicant${allowed === 1 ? '' : 's'}. Use "Add co-applicant" to add more.`, paidCoApplicants: allowed });
    }
    client.familyMembers = sanitized;
    await client.save();
    res.json({ success: true, data: client.familyMembers });
  } catch (err) {
    console.error('updateFamilyMembers error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/client/flag
// Client raises or clears a flag on their current stage
exports.raiseFlag = async (req, res) => {
  try {
    const { flagged, message } = req.body;

    const client = await resolveClient(req).select('currentStageKey flagged');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

    const update = flagged
      ? { flagged: true, flagMessage: (message || '').trim().slice(0, 500), flaggedAt: new Date(), flagStage: client.currentStageKey }
      : { flagged: false, flagMessage: '', flaggedAt: null, flagStage: '' };

    await Client.updateOne({ _id: client._id }, update);

    if (flagged) {
      // Notify assigned team + all admins
      const fullClient = await Client.findById(client._id).populate('assignedTo', '_id');
      if (fullClient?.assignedTo?._id) {
        await notify({ recipient: fullClient.assignedTo._id, title: 'Client Raised a Flag', message: message || 'Client has flagged an issue at their current stage.', type: 'general' });
      }
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        await notify({ recipient: admin._id, title: 'Client Raised a Flag', message: message || 'Client has flagged an issue at their current stage.', type: 'general' });
      }
    }

    res.json({ success: true, flagged: !!flagged });
  } catch (err) {
    console.error('raiseFlag error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
