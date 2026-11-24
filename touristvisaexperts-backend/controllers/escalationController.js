const Escalation = require('../models/Escalation');
const Client = require('../models/Client');
const logActivity = require('../utils/activityHelper');
const notify = require('../utils/notifyHelper');
const User = require('../models/User');

/* ── POST /api/team/clients/:id/escalate  (team)
       POST /api/client/escalate           (client — no :id, uses req.user) ── */
exports.raiseEscalation = async (req, res) => {
  try {
    const { type, message } = req.body;
    if (!type || !message) {
      return res.status(400).json({ success: false, message: 'type and message are required' });
    }

    let clientRecord;
    if (req.user.role === 'client') {
      // A user can have multiple visa cases now — scope to the one specified
      // (body.clientId), falling back to their most recent case if omitted.
      const clientId = req.body.clientId;
      const filter = clientId ? { _id: clientId, user: req.user._id } : { user: req.user._id };
      clientRecord = await Client.findOne(filter).sort({ createdAt: -1 });
    } else {
      // team or admin
      clientRecord = await Client.findOne({
        _id: req.params.id,
        ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}),
      });
    }

    if (!clientRecord) return res.status(404).json({ success: false, message: 'Client not found' });

    const escalation = await Escalation.create({
      client: clientRecord._id,
      raisedBy: req.user._id,
      raisedByRole: req.user.role === 'admin' ? 'team' : req.user.role,
      type,
      message,
    });

    await logActivity({
      clientId:  clientRecord._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role === 'admin' ? 'team' : req.user.role,
      action:    'Escalation Raised',
      details:   `[${type}] ${message}`,
    });

    // Notify admin users
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await notify({
        recipient: admin._id,
        title: 'New Escalation',
        message: `${req.user.name} raised an escalation: ${message.slice(0, 80)}`,
        type: 'general',
      });
    }

    res.status(201).json({ success: true, data: escalation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── GET /api/admin/escalations ── */
exports.getEscalations = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (clientId) query.client = clientId;

    const escalations = await Escalation.find(query)
      .populate('client', 'clientStatus destinationCountry')
      .populate('raisedBy', 'name email role')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: escalations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── PUT /api/admin/escalations/:id/acknowledge ── */
exports.acknowledgeEscalation = async (req, res) => {
  try {
    const escalation = await Escalation.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged' },
      { new: true }
    ).populate('client', 'clientStatus destinationCountry')
     .populate('raisedBy', 'name email');

    if (!escalation) return res.status(404).json({ success: false, message: 'Escalation not found' });

    await logActivity({
      clientId:  escalation.client._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: 'admin',
      action:    'Escalation Acknowledged',
      details:   `Admin acknowledged escalation raised by ${escalation.raisedBy?.name}`,
    });

    res.json({ success: true, data: escalation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ── PUT /api/admin/escalations/:id/resolve ── */
exports.resolveEscalation = async (req, res) => {
  try {
    const { resolutionNote } = req.body;
    if (!resolutionNote || !resolutionNote.trim()) {
      return res.status(400).json({ success: false, message: 'Resolution note is required' });
    }

    const escalation = await Escalation.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolutionNote: resolutionNote.trim(),
        resolvedAt: new Date(),
      },
      { new: true }
    ).populate('client', 'clientStatus destinationCountry user')
     .populate('raisedBy', 'name email');

    if (!escalation) return res.status(404).json({ success: false, message: 'Escalation not found' });

    await logActivity({
      clientId:  escalation.client._id,
      actor:     req.user._id,
      actorName: req.user.name,
      actorRole: 'admin',
      action:    'Escalation Resolved',
      details:   `Resolution: ${resolutionNote.trim()}`,
    });

    // Notify the person who raised the escalation
    await notify({
      recipient: escalation.raisedBy._id,
      title: 'Escalation Resolved',
      message: `Your escalation has been resolved by admin. Note: ${resolutionNote.trim().slice(0, 100)}`,
      type: 'general',
    });

    res.json({ success: true, data: escalation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
