const cron = require('node-cron');
const Client = require('../models/Client');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const { CLIENT_STATUSES } = require('../utils/constants');
const storageHelper = require('../utils/storageHelper');

const RETENTION_DAYS = parseInt(process.env.DPDP_DOCUMENT_RETENTION_DAYS, 10) || 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Statuses where the visa purpose is deemed fulfilled/concluded
const CONCLUDED_STATUSES = [
  CLIENT_STATUSES.VISA_APPROVED,
  CLIENT_STATUSES.VISA_REJECTED,
  CLIENT_STATUSES.CASE_CLOSED,
];

/**
 * DPDP Act 2023 Statutory Document Auto-Purge Routine (Section 8(7) Storage Limitation)
 * Securely deletes raw customer passports, bank statements, and tax documents from
 * S3/Cloudflare R2/local disk once the purpose is fulfilled and retention window has elapsed.
 */
async function runDocumentPurgeSweep() {
  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * MS_PER_DAY);

  // Find clients whose case concluded or was auto-closed prior to the retention cutoff
  const eligibleClients = await Client.find({
    $or: [
      {
        clientStatus: { $in: CONCLUDED_STATUSES },
        updatedAt: { $lte: cutoffDate },
      },
      {
        inactivityAutoClosed: true,
        inactivityAutoClosedAt: { $lte: cutoffDate },
      },
    ],
  }).select('_id user clientStatus updatedAt');

  if (!eligibleClients.length) {
    return { purgedCount: 0, clientsCount: 0 };
  }

  let totalPurgedDocs = 0;

  for (const client of eligibleClients) {
    // Find unpurged documents
    const docs = await Document.find({
      client: client._id,
      isPurged: { $ne: true },
    });

    for (const doc of docs) {
      try {
        // Permanently delete physical file bytes from S3/R2/local
        if (doc.filePath && doc.filePath !== 'PURGED') {
          await storageHelper.deleteDocumentFile(doc.filePath);
        }

        // Maintain metadata & compliance record, but wipe PII file path
        doc.isPurged = true;
        doc.purgedAt = new Date();
        doc.filePath = 'PURGED';
        doc.extractedData = null; // Wipe OCR passport numbers/DOB
        doc.purgeReason = `DPDP Act 2023 Sec 8(7) Compliance: Case concluded > ${RETENTION_DAYS} days ago`;
        await doc.save();

        totalPurgedDocs++;
      } catch (err) {
        console.error(`[DPDP PURGE] Failed to purge doc ${doc._id}:`, err.message);
      }
    }

    if (docs.length > 0) {
      // Create compliance audit entry for Data Protection Board inspection
      AuditLog.create({
        action: 'DPDP_DOCUMENT_PURGE',
        entity: 'Client',
        entityId: client._id,
        description: `Automated DPDP Act purge: ${docs.length} document(s) permanently erased following ${RETENTION_DAYS}-day statutory retention window.`,
      }).catch(() => {});
    }
  }

  if (totalPurgedDocs > 0) {
    console.log(`[DPDP PURGE] Successfully purged ${totalPurgedDocs} sensitive document(s) across ${eligibleClients.length} concluded case(s).`);
  }

  return { purgedCount: totalPurgedDocs, clientsCount: eligibleClients.length };
}

function initDocumentPurgeCron() {
  // Runs every morning at 03:30 AM server time
  cron.schedule('30 3 * * *', () => {
    runDocumentPurgeSweep().catch((err) =>
      console.error('[DPDP PURGE] Sweep error:', err.message)
    );
  });
  console.log(`DPDP statutory document purge cron scheduled (daily 03:30, ${RETENTION_DAYS}-day retention).`);
}

module.exports = { initDocumentPurgeCron, runDocumentPurgeSweep };
