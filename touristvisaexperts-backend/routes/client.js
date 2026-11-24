const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../utils/constants');

const {
  getCases,
  getStatus,
  getDocuments,
  uploadDocument,
  confirmDocument,
  downloadDocument,
  deleteDocument,
  getMeetings,
  getNotifications,
  markNotificationRead,
  getNotes,
  sendSupport,
  raiseEscalation,
  updateFamilyMembers,
  createAddMembersOrder,
  verifyAddMembersPayment,
  raiseFlag,
} = require('../controllers/clientController');

router.use(protect, authorize(ROLES.CLIENT));

router.get('/cases', getCases);
router.get('/status', getStatus);
router.get('/documents', getDocuments);
router.post('/documents', uploadLimiter, uploadDocument);
router.put('/documents/:docId/confirm', confirmDocument);
router.get('/documents/:docId/download', downloadDocument);
router.delete('/documents/:docId', deleteDocument);
router.get('/meetings', getMeetings);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/notes', getNotes);
router.post('/support', sendSupport);
router.put('/family-members', updateFamilyMembers);
router.put('/flag', raiseFlag);
router.post('/add-members/create-order', createAddMembersOrder);
router.post('/add-members/verify', verifyAddMembersPayment);
router.post(
  '/escalate',
  [
    body('type').notEmpty().withMessage('type required'),
    body('message').trim().notEmpty().withMessage('message required'),
  ],
  validate,
  raiseEscalation
);

module.exports = router;
