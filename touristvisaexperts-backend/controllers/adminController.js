const User = require('../models/User');
const Client = require('../models/Client');
const Document = require('../models/Document');
const PaymentRecord = require('../models/PaymentRecord');
const AuditLog = require('../models/AuditLog');
const ClientActivity = require('../models/ClientActivity');
const { ROLES, CLIENT_STATUSES, INTERNAL_STAGES } = require('../utils/constants');
const audit = require('../utils/auditHelper');
const notify = require('../utils/notifyHelper');
const getAutoAssignTarget = require('../utils/autoAssign');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

async function notifyAssignedTeamMember(teamMemberId, clientUser) {
  if (!teamMemberId) return;
  const member = await User.findById(teamMemberId).select('name email');
  if (!member) return;
  const portalUrl = process.env.CLIENT_URL || 'https://portal.touristvisaexperts.com';
  await notify({
    recipient: member._id,
    title: `New client assigned: ${clientUser.name}`,
    message: `${clientUser.name} (${clientUser.email}) has been assigned to you and needs a welcome consultation.`,
    type: 'general',
  });
  await sendEmail({
    to: member.email,
    subject: `New Client Assigned — ${clientUser.name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#0A1628;">New Client Assigned to You</h2>
      <p style="color:#64748b;font-size:14px;">Hi ${member.name}, a new client has been assigned to you.</p>
      <div style="background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:10px;padding:16px;margin:16px 0;">
        <b style="color:#0f172a;">${clientUser.name}</b><br/>
        <span style="color:#64748b;font-size:13px;">${clientUser.email}</span>
        ${clientUser.phone ? `<br/><span style="color:#64748b;font-size:13px;">${clientUser.phone}</span>` : ''}
      </div>
      <a href="${portalUrl}/team/clients" style="display:block;text-align:center;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;padding:13px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">View in Portal →</a>
    </div>`,
  }).catch(() => {});
}

// Delegate escalation endpoints to escalationController
const escalationCtrl = require('./escalationController');
exports.getEscalations = escalationCtrl.getEscalations;
exports.acknowledgeEscalation = escalationCtrl.acknowledgeEscalation;
exports.resolveEscalation = escalationCtrl.resolveEscalation;

// ─── Dashboard ─────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const Note = require('../models/Note');

    // Date filters for revenue calculations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalClients,
      totalTeam,
      byStatus,
      totalPurchased,
      newThisWeek,
      revenueAgg,
      monthRevenueAgg,
      weekRevenueAgg,
      unassignedClients,
      flaggedClients,
      pendingReviewDocsCount,
      destinationBreakdown,
      pipelineFunnel,
      recentPayments,
      recentClients,
      recentActivity,
      teamWorkload,
    ] = await Promise.all([
      Client.countDocuments(),
      User.countDocuments({ role: { $in: [ROLES.TEAM, ROLES.MANAGER] } }),
      Client.aggregate([
        { $group: { _id: '$clientStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Client.countDocuments({ isPurchased: true }),
      Client.countDocuments({ createdAt: { $gte: startOfWeek } }),

      // Total lifetime revenue (paise -> INR)
      PaymentRecord.aggregate([
        { $match: { status: 'done' } },
        { $group: { _id: null, totalPaise: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Month-to-date revenue
      PaymentRecord.aggregate([
        { $match: { status: 'done', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalPaise: { $sum: '$amount' } } },
      ]),

      // Last 7 days revenue
      PaymentRecord.aggregate([
        { $match: { status: 'done', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, totalPaise: { $sum: '$amount' } } },
      ]),

      // Needs attention: Unassigned paid clients
      Client.find({ assignedTo: null, isPurchased: true })
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5),

      // Needs attention: Flagged client cases
      Client.find({ flagged: true })
        .populate('user', 'name email phone')
        .populate('assignedTo', 'name')
        .sort({ flaggedAt: -1 })
        .limit(5),

      // Needs attention: Documents pending review
      Document.countDocuments({ generatedByTeam: true, clientReviewStatus: 'pending_review' }),

      // Top destination countries
      Client.aggregate([
        { $match: { destinationCountry: { $exists: true, $ne: '' } } },
        { $group: { _id: '$destinationCountry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),

      // 11-stage pipeline distribution
      Client.aggregate([
        { $match: { currentStageKey: { $exists: true } } },
        { $group: { _id: '$currentStageKey', count: { $sum: 1 } } },
      ]),

      // Recent completed payments
      PaymentRecord.find({ status: 'done' })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(6),

      // Recent client registrations
      Client.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user', 'name email phone')
        .populate('assignedTo', 'name'),

      // Audit log feed
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('performedBy', 'name role'),

      // Team members workload
      Client.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 }, statuses: { $push: '$clientStatus' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'member' } },
        { $unwind: '$member' },
        { $project: { name: '$member.name', email: '$member.email', count: 1, statuses: 1 } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalRevenue = revenueAgg[0] ? Math.round(revenueAgg[0].totalPaise / 100) : 0;
    const monthRevenue = monthRevenueAgg[0] ? Math.round(monthRevenueAgg[0].totalPaise / 100) : 0;
    const weekRevenue = weekRevenueAgg[0] ? Math.round(weekRevenueAgg[0].totalPaise / 100) : 0;
    const totalTransactions = revenueAgg[0]?.count || 0;

    res.json({
      success: true,
      data: {
        totalClients,
        totalTeam,
        byStatus,
        recentClients,
        totalPurchased,
        recentActivity,
        teamWorkload,
        newThisWeek,
        revenue: {
          total: totalRevenue,
          thisMonth: monthRevenue,
          thisWeek: weekRevenue,
          transactions: totalTransactions,
        },
        needsAttention: {
          unassigned: unassignedClients,
          unassignedCount: unassignedClients.length,
          flagged: flaggedClients,
          flaggedCount: flaggedClients.length,
          pendingReviewDocsCount,
        },
        destinationBreakdown,
        pipelineFunnel,
        recentPayments,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Client Management ──────────────────────────────────────────────────────

// POST /api/admin/clients
exports.createClient = async (req, res) => {
  try {
    const { name, email, phone, password, visaType, destinationCountry, assignedTo } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, phone, password, role: ROLES.CLIENT, isFirstLogin: true });

    const clientData = { user: user._id, visaType, destinationCountry };
    // Use explicit assignedTo if provided, otherwise auto-assign to least-loaded team member
    clientData.assignedTo = assignedTo || await getAutoAssignTarget();

    const client = await Client.create(clientData);

    await audit({
      performedBy: req.user._id,
      action: 'CREATE_CLIENT',
      entity: 'Client',
      entityId: client._id,
      description: `Admin created client ${email}`,
      ipAddress: req.ip,
    });

    // Notify the assigned team member
    await notifyAssignedTeamMember(clientData.assignedTo, { name, email, phone }).catch(() => {});

    res.status(201).json({ success: true, data: { user: { id: user._id, name, email }, client } });
  } catch (err) {
    // Avoid leaking internal error details (e.g. MongoDB duplicate key messages)
    const msg = err.code === 11000 ? 'Email already registered' : 'Server error';
    res.status(err.code === 11000 ? 400 : 500).json({ success: false, message: msg });
  }
};

// Escape regex special chars to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/admin/clients
exports.getClients = async (req, res) => {
  try {
    const { status, assignedTo, search, purchased, page = 1, limit = 20 } = req.query;

    // Sanitise and cap pagination
    const safePage  = Math.max(1, parseInt(page, 10)  || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);

    const query = {};

    // Whitelist status values to prevent enum injection
    const VALID_STATUSES = Object.values(CLIENT_STATUSES);
    if (status && VALID_STATUSES.includes(status)) query.clientStatus = status;
    if (assignedTo && /^[a-f\d]{24}$/i.test(assignedTo)) query.assignedTo = assignedTo;
    if (purchased === 'true')  query.isPurchased = true;
    if (purchased === 'false') query.isPurchased = false;

    if (search) {
      // Escape to prevent ReDoS
      const safeSearch = escapeRegex(String(search).slice(0, 100));
      const users = await User.find({
        $or: [
          { name:  { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
        role: ROLES.CLIENT,
      }).select('_id');
      query.user = { $in: users.map((u) => u._id) };
    }

    const [data, total] = await Promise.all([
      Client.find(query)
        .populate('user', 'name email phone createdAt')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Client.countDocuments(query),
    ]);

    res.json({ success: true, total, page: safePage, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/clients/:id
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('user', 'name email phone createdAt')
      .populate('assignedTo', 'name email')
      .populate('stages.tasks.completedBy', 'name');

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    // Backfill appointment module for older clients
    const { APPOINTMENT_MODULE } = require('../utils/constants');
    if (!client.appointmentModule) {
      client.appointmentModule = { tasks: APPOINTMENT_MODULE.tasks.map((t) => ({ name: t, completed: false })) };
      await client.save();
    }

    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/clients/:id/assign
exports.assignClient = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const teamMember = await User.findOne({ _id: assignedTo, role: ROLES.TEAM });
    if (!teamMember) return res.status(400).json({ success: false, message: 'Invalid team member' });

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate('user', 'name email').populate('assignedTo', 'name email');

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    await audit({
      performedBy: req.user._id,
      action: 'ASSIGN_CLIENT',
      entity: 'Client',
      entityId: client._id,
      description: `Client assigned to ${teamMember.name}`,
      ipAddress: req.ip,
    });

    // Notify newly assigned team member
    await notifyAssignedTeamMember(assignedTo, client.user).catch(() => {});

    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/clients/:id
exports.updateClient = async (req, res) => {
  try {
    const allowed = ['visaType', 'destinationCountry', 'travelDate', 'numberOfApplicants',
      'passportNumber', 'nationality', 'dateOfBirth', 'packageType', 'remarks', 'familyMembers'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const client = await Client.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('user', 'name email');

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/clients/:id/access — grant or revoke purchased access
exports.grantAccess = async (req, res) => {
  try {
    const { isPurchased } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isPurchased: !!isPurchased },
      { new: true }
    ).populate('user', 'name email');

    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    await audit({
      performedBy: req.user._id,
      action: isPurchased ? 'GRANT_ACCESS' : 'REVOKE_ACCESS',
      entity: 'Client',
      entityId: client._id,
      description: `Admin ${isPurchased ? 'granted' : 'revoked'} full portal access for ${client.user?.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { isPurchased: client.isPurchased } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Team Management ────────────────────────────────────────────────────────

// POST /api/admin/team
exports.createTeamMember = async (req, res) => {
  try {
    const { name, email, phone, password, role: reqRole } = req.body;
    const role = reqRole === ROLES.MANAGER ? ROLES.MANAGER : ROLES.TEAM;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, role });

    await audit({
      performedBy: req.user._id,
      action: 'CREATE_TEAM_MEMBER',
      entity: 'User',
      entityId: user._id,
      description: `Admin created ${role} ${email}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/team
exports.getTeamMembers = async (req, res) => {
  try {
    const team = await User.find({ role: { $in: [ROLES.TEAM, ROLES.MANAGER] } }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/team/:id/status
exports.toggleTeamStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: { $in: [ROLES.TEAM, ROLES.MANAGER] } });
    if (!user) return res.status(404).json({ success: false, message: 'Team member not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Audit Logs ─────────────────────────────────────────────────────────────

// GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, entity } = req.query;
    const query = entity ? { entity } : {};

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, total, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/clients/:id/activity
exports.getClientActivity = async (req, res) => {
  try {
    const activities = await ClientActivity.find({ client: req.params.id })
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/clients/:id/notify — send notification to a client
exports.sendClientNotification = async (req, res) => {
  try {
    const { title, message, type = 'general' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message required' });
    }

    const client = await Client.findById(req.params.id).populate('user', '_id name');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    await notify({ recipient: client.user._id, title, message, type });

    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
