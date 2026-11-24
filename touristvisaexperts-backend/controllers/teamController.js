const Client = require('../models/Client');
const Document = require('../models/Document');
const Meeting = require('../models/Meeting');
const Note = require('../models/Note');
const User = require('../models/User');
const { INTERNAL_STAGES, CLIENT_STATUSES, APPOINTMENT_MODULE } = require('../utils/constants');
const audit = require('../utils/auditHelper');
const notify = require('../utils/notifyHelper');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/activityHelper');
const resolveFilePath = require('../utils/resolveFilePath');
const storageHelper = require('../utils/storageHelper');
const fs = require('fs');
const path = require('path');

// GET /api/team/clients
exports.getMyClients = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const safePage  = Math.max(1, parseInt(page, 10)  || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const query = isPrivileged ? {} : { assignedTo: req.user._id };
    const VALID_STATUSES = Object.values(require('../utils/constants').CLIENT_STATUSES);
    if (status && VALID_STATUSES.includes(status)) query.clientStatus = status;

    const [data, total] = await Promise.all([
      Client.find(query)
        .populate('user', 'name email phone')
        .sort({ updatedAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Client.countDocuments(query),
    ]);

    res.json({ success: true, total, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/team/clients/:id
exports.getClient = async (req, res) => {
  try {
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) })
      .populate('user', 'name email phone')
      .populate('stages.tasks.completedBy', 'name');

    if (!client) return res.status(404).json({ success: false, message: 'Client not found or not assigned to you' });

    // Backfill appointment module for older clients that never had it
    if (!client.appointmentModule) {
      client.appointmentModule = { tasks: APPOINTMENT_MODULE.tasks.map((t) => ({ name: t, completed: false })) };
      await client.save();
    }

    res.json({ success: true, data: client, meta: buildWorkflowMeta() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Workflow metadata (stage names, goals, task labels, appointment module) for the UI
function buildWorkflowMeta() {
  const { taskLabel } = require('../utils/constants');
  const stages = Object.entries(INTERNAL_STAGES).map(([key, s]) => ({
    key, order: s.order, name: s.name, goal: s.goal, completionRule: s.completionRule,
  }));
  // Flatten every task key -> label so the UI can resolve names cheaply
  const labels = {};
  Object.values(INTERNAL_STAGES).forEach((s) => s.tasks.forEach((t) => { labels[t] = taskLabel(t); }));
  APPOINTMENT_MODULE.tasks.forEach((t) => { labels[t] = taskLabel(t); });
  return {
    stages,
    taskLabels: labels,
    appointmentModule: {
      key: APPOINTMENT_MODULE.key,
      name: APPOINTMENT_MODULE.name,
      goal: APPOINTMENT_MODULE.goal,
      note: APPOINTMENT_MODULE.note,
    },
  };
}

// PUT /api/team/clients/:id/tasks
// Body: { stageKey: 'STAGE_1_WELCOME_SETUP' | 'APPOINTMENT_MODULE', taskName, completed }
exports.updateTask = async (req, res) => {
  try {
    const { stageKey, taskName, completed } = req.body;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) });

    if (!client) return res.status(404).json({ success: false, message: 'Client not found or not assigned to you' });

    // ── Appointment Booking — parallel module, does NOT advance numbered stages ──
    if (stageKey === 'APPOINTMENT_MODULE') {
      if (!client.appointmentModule) {
        client.appointmentModule = { tasks: APPOINTMENT_MODULE.tasks.map((t) => ({ name: t, completed: false })) };
      }
      const aTask = client.appointmentModule.tasks.find((t) => t.name === taskName);
      if (!aTask) return res.status(400).json({ success: false, message: 'Invalid task' });
      aTask.completed = completed;
      aTask.completedAt = completed ? new Date() : undefined;
      aTask.completedBy = completed ? req.user._id : undefined;
      const allApptDone = APPOINTMENT_MODULE.tasks.every((t) =>
        client.appointmentModule.tasks.find((ct) => ct.name === t && ct.completed)
      );
      client.appointmentModule.completedAt = allApptDone ? new Date() : undefined;
      await client.save();
      return res.json({ success: true, data: client });
    }

    const stage = client.stages.find((s) => s.stageKey === stageKey);
    if (!stage) return res.status(400).json({ success: false, message: 'Invalid stage' });

    const task = stage.tasks.find((t) => t.name === taskName);
    if (!task) return res.status(400).json({ success: false, message: 'Invalid task' });

    task.completed = completed;
    task.completedAt = completed ? new Date() : undefined;
    task.completedBy = completed ? req.user._id : undefined;

    const stageKeys = Object.keys(INTERNAL_STAGES);

    if (completed) {
      // ── Forward: auto-advance if all tasks in the current stage are done ──
      const currentStageData = INTERNAL_STAGES[client.currentStageKey];
      const currentStage = client.stages.find((s) => s.stageKey === client.currentStageKey);
      if (currentStage) {
        const allDone = currentStageData.tasks.every((t) =>
          currentStage.tasks.find((ct) => ct.name === t && ct.completed)
        );

        if (allDone) {
          currentStage.completedAt = new Date();

          const currentIndex = stageKeys.indexOf(client.currentStageKey);
          const nextKey = stageKeys[currentIndex + 1];

          if (nextKey) {
            client.currentStageKey = nextKey;
            const newStatus = INTERNAL_STAGES[nextKey].clientStatus;
            const previousStatus = client.clientStatus;
            client.clientStatus = newStatus;

            // Compliance: track when we start waiting on the client for documents/info
            if (newStatus === CLIENT_STATUSES.DOCUMENTS_REQUESTED) {
              client.lastRequestAt = new Date();
            }

            await audit({
              performedBy: req.user._id,
              action: 'STATUS_UPDATED',
              entity: 'Client',
              entityId: client._id,
              description: `Status changed from "${previousStatus}" to "${newStatus}"`,
              previousValue: previousStatus,
              newValue: newStatus,
            });

            await notify({
              recipient: client.user,
              title: 'Application Status Updated',
              message: `Your visa application status has been updated to: ${newStatus}`,
              type: 'status_update',
            });
          }
        }
      }
    } else {
      // ── Backward: unchecking a task — revert stage if it was marked done ──
      if (stage.completedAt) {
        stage.completedAt = undefined;
      }

      // Re-compute currentStageKey = earliest stage (by INTERNAL_STAGES order) without completedAt
      const earliestIncomplete = stageKeys.find((key) => {
        const s = client.stages.find((cs) => cs.stageKey === key);
        return !s || !s.completedAt;
      });

      if (earliestIncomplete && earliestIncomplete !== client.currentStageKey) {
        const previousStatus = client.clientStatus;
        client.currentStageKey = earliestIncomplete;
        client.clientStatus = INTERNAL_STAGES[earliestIncomplete].clientStatus;

        await audit({
          performedBy: req.user._id,
          action: 'STATUS_UPDATED',
          entity: 'Client',
          entityId: client._id,
          description: `Stage reverted — status changed from "${previousStatus}" to "${client.clientStatus}"`,
          previousValue: previousStatus,
          newValue: client.clientStatus,
        });
      }
    }

    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/team/clients/:id/meeting
exports.scheduleMeeting = async (req, res) => {
  try {
    const { meetLink, scheduledAt, duration, title, notes } = req.body;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) });

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const meeting = await Meeting.create({
      client: client._id,
      scheduledBy: req.user._id,
      meetLink,
      scheduledAt,
      duration,
      title,
      notes,
    });

    // Update client with latest meet link
    client.meetLink = meetLink;
    client.meetScheduledAt = scheduledAt;
    await client.save();

    await notify({
      recipient: client.user,
      title: 'Meeting Scheduled',
      message: `A consultation call has been scheduled for ${new Date(scheduledAt).toLocaleString()}. Link: ${meetLink}`,
      type: 'meeting_scheduled',
    });

    // Send email to client
    const clientUser = await User.findById(client.user).select('name email');
    if (clientUser) {
      const dateStr = new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
      const portalUrl = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
      await sendEmail({
        to: clientUser.email,
        subject: `📅 Meeting Scheduled: ${title || 'Consultation Call'}`,
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#0A1628,#0d1e3a);padding:32px 0;text-align:center;">
    <div style="color:#fff;font-size:20px;font-weight:700;">Tourist Visa Experts</div>
  </div>
  <div style="max-width:520px;margin:0 auto;padding:0 16px 40px;">
    <div style="background:#fff;border-radius:16px;padding:32px;margin-top:-20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
      <div style="font-size:32px;margin-bottom:16px;">📅</div>
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:22px;">Meeting Scheduled</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${clientUser.name}, a consultation call has been scheduled for you.</p>
      <div style="background:#f8f7f4;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="margin-bottom:12px;"><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Title</span><div style="color:#0A1628;font-weight:600;margin-top:4px;">${title || 'Consultation Call'}</div></div>
        <div style="margin-bottom:12px;"><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Date & Time</span><div style="color:#0A1628;font-weight:600;margin-top:4px;">${dateStr}</div></div>
        ${duration ? `<div style="margin-bottom:12px;"><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Duration</span><div style="color:#0A1628;font-weight:600;margin-top:4px;">${duration} minutes</div></div>` : ''}
        ${notes ? `<div><span style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;">Notes</span><div style="color:#64748b;margin-top:4px;">${notes}</div></div>` : ''}
      </div>
      <a href="${meetLink}" style="display:block;text-align:center;background:linear-gradient(135deg,#4f46e5,#4338ca);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;padding:14px;">Join Meeting →</a>
      <a href="${portalUrl}/client/meetings" style="display:block;text-align:center;color:#64748b;font-size:13px;margin-top:12px;text-decoration:none;">View in Portal</a>
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Tourist Visa Experts</div>
  </div>
</body></html>`,
      }).catch(err => console.error('Meeting email error:', err.message));
    }

    res.status(201).json({ success: true, data: meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/team/clients/:id/notes
exports.addNote = async (req, res) => {
  try {
    const { content, isInternal = true } = req.body;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) });

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const note = await Note.create({
      client: client._id,
      addedBy: req.user._id,
      content,
      isInternal,
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/team/clients/:id/notes
exports.getNotes = async (req, res) => {
  try {
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const notes = await Note.find({ client: client._id })
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/team/clients/:id/documents
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const client = await Client.findOne({
      _id: req.params.id,
      ...(req.user.role !== 'admin' && req.user.role !== 'manager' ? { assignedTo: req.user._id } : {}),
    });
    if (!client) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const generatedByTeam = req.body.generatedByTeam === 'true' || req.body.generatedByTeam === true;
    const category = req.body.category || 'other';
    const customType = category === 'custom' ? (req.body.customType || '').slice(0, 100) : undefined;

    const doc = await Document.create({
      client: client._id,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category,
      customType,
      uploadedByRole: 'team',
      notes: req.body.notes,
      generatedByTeam,
      clientReviewStatus: generatedByTeam ? 'pending_review' : null,
    });

    const notifMsg = generatedByTeam
      ? `A document "${req.file.originalname}" has been prepared for you. Please review and confirm it.`
      : `A new document "${req.file.originalname}" has been uploaded to your profile.`;

    await notify({
      recipient: client.user,
      title: generatedByTeam ? 'Document Ready for Review' : 'Document Uploaded',
      message: notifMsg,
      type: 'general',
    });

    await logActivity({
      clientId:  client._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role === 'admin' ? 'admin' : 'team',
      action:    generatedByTeam ? 'Team Document Uploaded for Review' : 'Document Uploaded',
      details:   `"${req.file.originalname}" (${category}${customType ? ': ' + customType : ''})`,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/team/clients/:id/documents/:docId/download  (view inline — no attachment)
exports.downloadDocument = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      ...(req.user.role !== 'admin' && req.user.role !== 'manager' ? { assignedTo: req.user._id } : {}),
    });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const doc = await Document.findOne({ _id: req.params.docId, client: client._id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const access = await storageHelper.getDocumentAccess(doc.filePath, doc.originalName, doc.mimeType);
    if (access.type === 'missing') {
      return res.status(404).json({ success: false, message: 'File not found on server. The client may need to re-upload this document.' });
    }

    if (access.type === 'url') {
      return res.redirect(access.url);
    }

    // Serve inline only — no attachment download for team
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    access.stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/team/clients/:id/documents
exports.getDocuments = async (req, res) => {
  try {
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const docs = await Document.find({ client: client._id })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/team/clients/:id/status
// Admin/team manual override
exports.updateStatus = async (req, res) => {
  try {
    const { clientStatus } = req.body;
    const validStatuses = Object.values(CLIENT_STATUSES);
    if (!validStatuses.includes(clientStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const client = await Client.findOne({ _id: req.params.id, ...(isPrivileged ? {} : { assignedTo: req.user._id }) });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const previousStatus = client.clientStatus;
    client.clientStatus = clientStatus;

    // Compliance: track when we start waiting on the client for documents/info
    if (clientStatus === CLIENT_STATUSES.DOCUMENTS_REQUESTED) {
      client.lastRequestAt = new Date();
    }

    await client.save();

    await audit({
      performedBy: req.user._id,
      action: 'MANUAL_STATUS_UPDATE',
      entity: 'Client',
      entityId: client._id,
      description: `Manual status change: "${previousStatus}" → "${clientStatus}"`,
      previousValue: previousStatus,
      newValue: clientStatus,
    });

    await notify({
      recipient: client.user,
      title: 'Application Status Updated',
      message: `Your application status has been updated to: ${clientStatus}`,
      type: 'status_update',
    });

    res.json({ success: true, data: { clientStatus: client.clientStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/team/clients/:id/flag/resolve
// Team or admin clears/resolves a client's flag
exports.resolveFlag = async (req, res) => {
  try {
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const query = isPrivileged ? { _id: req.params.id } : { _id: req.params.id, assignedTo: req.user._id };

    const client = await Client.findOneAndUpdate(
      query,
      { flagged: false, flagMessage: '', flaggedAt: null, flagStage: '' },
      { new: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/team/clients/:id/flag
// Team or admin raises a flag on a client
exports.raiseClientFlag = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Flag message is required.' });
    }

    const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
    const query = isPrivileged ? { _id: req.params.id } : { _id: req.params.id, assignedTo: req.user._id };

    const client = await Client.findOneAndUpdate(
      query,
      { flagged: true, flagMessage: message.trim().slice(0, 500), flaggedAt: new Date(), flagStage: '' },
      { new: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await notify({
        recipient: admin._id,
        title: 'Flag Raised on Client',
        message: `Team flagged an issue: ${message.trim().slice(0, 100)}`,
        type: 'general',
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
