/**
 * Migration: rebuild every client's workflow to the SOP v2 structure.
 *
 * The stage KEYS themselves changed (e.g. STAGE_1_ONBOARDING -> STAGE_1_WELCOME_SETUP),
 * so we rebuild the `stages` array from the new INTERNAL_STAGES, preserving a task's
 * completed flag ONLY where the same task key still exists. Also initialises the
 * parallel appointmentModule and remaps currentStageKey by stage order.
 *
 * Run once:  node scripts/migrateToSopV2.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');
const { INTERNAL_STAGES, APPOINTMENT_MODULE } = require('../utils/constants');

const newStageKeys = Object.keys(INTERNAL_STAGES); // ordered

// Map an OLD stage key (by its leading number) to the NEW key at the same order.
// Old keys looked like STAGE_<n>_SOMETHING; new keys are STAGE_<n>_SOMETHING too.
function oldKeyToOrder(oldKey) {
  const m = /^STAGE_(\d+)_/.exec(oldKey || '');
  return m ? parseInt(m[1], 10) : null;
}
function newKeyByOrder(order) {
  return newStageKeys.find((k) => INTERNAL_STAGES[k].order === order) || newStageKeys[0];
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const clients = await Client.find({});
  console.log(`Found ${clients.length} client(s) to migrate.\n`);

  let updated = 0;

  for (const client of clients) {
    // Gather the set of task keys this client had already COMPLETED (by key name)
    const completedKeys = new Map(); // name -> { completedAt, completedBy }
    for (const st of client.stages || []) {
      for (const t of st.tasks || []) {
        if (t.completed) completedKeys.set(t.name, { completedAt: t.completedAt, completedBy: t.completedBy });
      }
    }

    // Rebuild stages from new definitions, carrying over completion where key matches
    client.stages = Object.entries(INTERNAL_STAGES).map(([key, stage]) => {
      const tasks = stage.tasks.map((name) => {
        const prev = completedKeys.get(name);
        return prev
          ? { name, completed: true, completedAt: prev.completedAt, completedBy: prev.completedBy }
          : { name, completed: false };
      });
      const completedAt = tasks.length && tasks.every((t) => t.completed) ? new Date() : undefined;
      return { stageKey: key, tasks, completedAt };
    });

    // Remap currentStageKey by order number; clamp to valid range
    const ord = oldKeyToOrder(client.currentStageKey) || 1;
    const clampedOrd = Math.min(Math.max(ord, 1), newStageKeys.length);
    client.currentStageKey = newKeyByOrder(clampedOrd);

    // Initialise / preserve appointment module
    const apptCompleted = new Map();
    for (const t of client.appointmentModule?.tasks || []) {
      if (t.completed) apptCompleted.set(t.name, { completedAt: t.completedAt, completedBy: t.completedBy });
    }
    const apptTasks = APPOINTMENT_MODULE.tasks.map((name) => {
      const prev = apptCompleted.get(name);
      return prev
        ? { name, completed: true, completedAt: prev.completedAt, completedBy: prev.completedBy }
        : { name, completed: false };
    });
    client.appointmentModule = {
      tasks: apptTasks,
      completedAt: apptTasks.every((t) => t.completed) ? new Date() : undefined,
    };

    await client.save();
    updated++;
    const doneStages = client.stages.filter((s) => s.completedAt).length;
    console.log(`  ✓ ${client._id} → stage "${client.currentStageKey}" · ${doneStages}/${client.stages.length} stages complete`);
  }

  console.log(`\nDone. ${updated}/${clients.length} client(s) migrated to SOP v2.`);
  await mongoose.disconnect();
})().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
