const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const {
  getDashboard,
  createClient,
  getClients,
  getClient,
  assignClient,
  updateClient,
  grantAccess,
  createTeamMember,
  getTeamMembers,
  toggleTeamStatus,
  getAuditLogs,
  getEscalations,
  acknowledgeEscalation,
  resolveEscalation,
  getClientActivity,
  sendClientNotification,
  processRefund,
} = require('../controllers/adminController');

const { createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faqController');
const { getMyNotifications, markMyNotificationRead, markAllRead } = require('../utils/notificationsHandler');
const { getAdminArticles, createArticle, updateArticle, deleteArticle } = require('../controllers/articleController');
const {
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  reorderTestimonials, importDefaultTestimonials,
} = require('../controllers/testimonialController');
const { updateStatus, getDocuments, downloadDocument } = require('../controllers/teamController');

// All admin routes require auth + admin role
router.use(protect, authorize(ROLES.ADMIN));

// Website enquiries: paid consultations + Contact Us messages
const { listLeads, updateLead } = require('../controllers/leadController');
router.get('/leads', listLeads);
router.put('/leads/:id', updateLead);

router.get('/dashboard', getDashboard);

// Clients
router.post(
  '/clients',
  [
    body('name').trim().notEmpty().escape().withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password min 8 chars')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must contain letters and numbers'),
  ],
  validate,
  createClient
);
router.get('/clients', getClients);
router.get('/clients/:id', getClient);
router.get('/clients/:id/documents', getDocuments);
router.get('/clients/:id/documents/:docId/download', downloadDocument);
router.put('/clients/:id', updateClient);
router.put('/clients/:id/access', grantAccess);
router.post(
  '/clients/:id/refund',
  [body('refundAmount').notEmpty().isNumeric().withMessage('Valid refund amount is required')],
  validate,
  processRefund
);
router.put(
  '/clients/:id/assign',
  [body('assignedTo').notEmpty().isMongoId().withMessage('Invalid team member ID')],
  validate,
  assignClient
);
router.put(
  '/clients/:id/status',
  [body('clientStatus').notEmpty().withMessage('clientStatus required')],
  validate,
  updateStatus
);

// Team
router.post(
  '/team',
  [
    body('name').trim().notEmpty().escape().withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password min 8 chars')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must contain letters and numbers'),
  ],
  validate,
  createTeamMember
);
router.get('/team', getTeamMembers);
router.put('/team/:id/status', toggleTeamStatus);

// FAQs
router.post(
  '/faqs',
  [
    body('category').notEmpty().withMessage('Category required'),
    body('question').trim().notEmpty().withMessage('Question required'),
  ],
  validate,
  createFAQ
);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Escalations
router.get('/escalations', getEscalations);
router.put('/escalations/:id/acknowledge', acknowledgeEscalation);
router.put(
  '/escalations/:id/resolve',
  [body('resolutionNote').trim().notEmpty().withMessage('Resolution note required')],
  validate,
  resolveEscalation
);

// Per-client activity timeline
router.get('/clients/:id/activity', getClientActivity);

// Admin notifications
router.get('/notifications', getMyNotifications);
router.put('/notifications/:id/read', markMyNotificationRead);
router.put('/notifications/mark-all-read', markAllRead);

// Articles (blog)
router.get('/articles', getAdminArticles);
router.post('/articles', [body('title').trim().notEmpty().withMessage('Title required')], validate, createArticle);
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);

// Testimonials (client reviews on the website)
router.get('/testimonials', listTestimonials);
router.post('/testimonials', createTestimonial);
router.post('/testimonials/import-defaults', importDefaultTestimonials);
router.put('/testimonials/reorder', reorderTestimonials);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Send notification to a client
router.post(
  '/clients/:id/notify',
  [
    body('title').trim().notEmpty().withMessage('title required'),
    body('message').trim().notEmpty().withMessage('message required'),
  ],
  validate,
  sendClientNotification
);

module.exports = router;
