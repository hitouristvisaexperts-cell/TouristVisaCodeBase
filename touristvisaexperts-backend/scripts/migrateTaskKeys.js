/**
 * Migration: add new task keys introduced in constants.js v2
 * Run once: node scripts/migrateTaskKeys.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Client   = require('../models/Client');
const { INTERNAL_STAGES } = require('../utils/constants');

const NEW_TASKS = {
  STAGE_1_ONBOARDING: [
    'CONTACT_PREFERENCE_RECORDED',
    'CONSULTATION_MEETING_SCHEDULED',
  ],
  STAGE_3_DOCUMENT_COLLECTION: [
    'SCANNING_GUIDE_SENT',
    'NEEDS_ATTENTION_FLAGGED',
  ],
  STAGE_6_APPLICATION_PREPARATION: [
    'CLIENT_FORM_APPROVAL_RECEIVED',
    'COVER_LETTER_CLIENT_APPROVED',
  ],
  STAGE_8_FINAL_VERIFICATION: [
    'APPOINTMENT_POLICY_EXPLAINED',
    'CLIENT_CONFIRMED_INSTRUCTIONS',
  ],
  STAGE_10_VISA_PROCESSING: [
    'NEEDS_ATTENTION_FLAGGED',
    'VISA_DECLINED',
  ],
  STAGE_11_FEEDBACK: [
    'MARKETING_CONSENT_RECORDED',
    'FEEDBACK_TIER1_PROCESS_COLLECTED',
    'FEEDBACK_TIER2_MANAGER_COLLECTED',
    'FEEDBACK_TIER3_OVERALL_COLLECTED',
  ],
};

// Tasks that were renamed — remove old key, the new one is added above
const REMOVED_TASKS = {
  STAGE_10_VISA_PROCESSING: ['ESCALATED_CASE', 'VISA_REJECTED'],
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const clients = await Client.find({});
  console.log(`Found ${clients.length} client(s) to migrate.`);

  let updated = 0;
  for (const client of clients) {
    let dirty = false;

    for (const stageKey of Object.keys(NEW_TASKS)) {
      const stage = client.stages.find(s => s.stageKey === stageKey);
      if (!stage) continue;

      const existingNames = new Set(stage.tasks.map(t => t.name));

      // Add missing new tasks
      for (const taskName of NEW_TASKS[stageKey]) {
        if (!existingNames.has(taskName)) {
          stage.tasks.push({ name: taskName, completed: false });
          dirty = true;
        }
      }

      // Remove renamed/obsolete tasks (only if they exist and are NOT completed)
      if (REMOVED_TASKS[stageKey]) {
        for (const oldName of REMOVED_TASKS[stageKey]) {
          const idx = stage.tasks.findIndex(t => t.name === oldName && !t.completed);
          if (idx !== -1) {
            stage.tasks.splice(idx, 1);
            dirty = true;
          }
        }
      }
    }

    if (dirty) {
      await client.save();
      updated++;
      console.log(`  ✓ Migrated: ${client._id} (${client.user})`);
    }
  }

  console.log(`\nDone. ${updated}/${clients.length} client(s) updated.`);
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
