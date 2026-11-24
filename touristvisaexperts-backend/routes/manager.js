const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../utils/constants');

// Admin controller — manager can read all clients, assign, view team, view escalations
const {
  getDashboard,
  getClients,
  getClient,
  assignClient,
  getTeamMembers,
  getClientActivity,
  getEscalations,
  acknowledgeEscalation,
  sendClientNotification,
} = require('../controllers/adminController');

// Team controller — manager can do everything team can
const {
  updateTask,
  scheduleMeeting,
  addNote,
  getNotes,
  uploadDocument,
  getDocuments,
  updateStatus,
  downloadDocument,
  resolveFlag,
  raiseClientFlag,
} = require('../controllers/teamController');

const { getMyNotifications, markMyNotificationRead, markAllRead } = require('../utils/notificationsHandler');
const { runOCR, saveExtracted } = require('../controllers/ocrController');
const { raiseEscalation } = require('../controllers/escalationController');

// All manager routes require auth + manager role (admin also allowed)
router.use(protect, authorize(ROLES.MANAGER, ROLES.ADMIN));

// Dashboard
router.get('/dashboard', getDashboard);

// All clients (manager sees everyone, not just assigned)
router.get('/clients', getClients);
router.get('/clients/:id', getClient);
router.get('/clients/:id/activity', getClientActivity);

// Assign clients to team members
router.put(
  '/clients/:id/assign',
  [body('assignedTo').notEmpty().isMongoId().withMessage('Invalid team member ID')],
  validate,
  assignClient
);

// Task / status updates
router.put(
  '/clients/:id/tasks',
  [
    body('stageKey').notEmpty().withMessage('stageKey required'),
    body('taskName').notEmpty().withMessage('taskName required'),
    body('completed').isBoolean().withMessage('completed must be boolean'),
  ],
  validate,
  updateTask
);
router.put(
  '/clients/:id/status',
  [body('clientStatus').notEmpty().withMessage('clientStatus required')],
  validate,
  updateStatus
);

// Meetings, notes, documents
router.post(
  '/clients/:id/meeting',
  [
    body('meetLink').isURL().withMessage('Valid Google Meet URL required'),
    body('scheduledAt').isISO8601().withMessage('Valid date required'),
  ],
  validate,
  scheduleMeeting
);
router.post(
  '/clients/:id/notes',
  [body('content').trim().notEmpty().withMessage('Note content required')],
  validate,
  addNote
);
router.get('/clients/:id/notes', getNotes);
router.post('/clients/:id/documents', uploadLimiter, upload.single('file'), uploadDocument);
router.get('/clients/:id/documents', getDocuments);
router.get('/clients/:id/documents/:docId/download', downloadDocument);

// OCR
router.post('/clients/:id/documents/:docId/ocr', runOCR);
router.put('/clients/:id/documents/:docId/extracted', saveExtracted);

// Flags & escalations
router.put('/clients/:id/flag', raiseClientFlag);
router.put('/clients/:id/flag/resolve', resolveFlag);
router.post(
  '/clients/:id/escalate',
  [
    body('type').notEmpty().withMessage('type required'),
    body('message').trim().notEmpty().withMessage('message required'),
  ],
  validate,
  raiseEscalation
);

// Escalations view
router.get('/escalations', getEscalations);
router.put('/escalations/:id/acknowledge', acknowledgeEscalation);

// Team members (view only for manager)
router.get('/team', getTeamMembers);

// Send notification to client
router.post(
  '/clients/:id/notify',
  [
    body('title').trim().notEmpty().withMessage('title required'),
    body('message').trim().notEmpty().withMessage('message required'),
  ],
  validate,
  sendClientNotification
);

// Manager notifications
router.get('/notifications', getMyNotifications);
router.put('/notifications/:id/read', markMyNotificationRead);
router.put('/notifications/mark-all-read', markAllRead);

module.exports = router;
