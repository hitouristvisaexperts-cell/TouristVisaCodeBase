const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../utils/constants');

const {
  getMyClients,
  getClient,
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

// Admin and manager can also access team routes
router.use(protect, authorize(ROLES.TEAM, ROLES.ADMIN, ROLES.MANAGER));

router.get('/clients', getMyClients);
router.get('/clients/:id', getClient);

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

router.post(
  '/clients/:id/documents',
  uploadLimiter,
  upload.single('file'),
  uploadDocument
);
router.get('/clients/:id/documents', getDocuments);
router.get('/clients/:id/documents/:docId/download', downloadDocument);

// OCR
router.post('/clients/:id/documents/:docId/ocr', runOCR);
router.put('/clients/:id/documents/:docId/extracted', saveExtracted);

// Team notifications
router.get('/notifications', getMyNotifications);
router.put('/notifications/:id/read', markMyNotificationRead);
router.put('/notifications/mark-all-read', markAllRead);

// Flag raise / resolve
router.put('/clients/:id/flag', raiseClientFlag);
router.put('/clients/:id/flag/resolve', resolveFlag);

// Escalation
router.post(
  '/clients/:id/escalate',
  [
    body('type').notEmpty().withMessage('type required'),
    body('message').trim().notEmpty().withMessage('message required'),
  ],
  validate,
  raiseEscalation
);

module.exports = router;
