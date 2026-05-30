import { Queue, Worker } from 'bullmq';

let emailQueue, backupQueue, analyticsQueue;
let queuesAvailable = false;

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 0,
  connectTimeout: 2000,
  enableOfflineQueue: false,
};

function initQueues() {
  try {
    emailQueue = new Queue('email', { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } } });
    backupQueue = new Queue('backup', { connection, defaultJobOptions: { attempts: 2, backoff: { type: 'fixed', delay: 5000 } } });
    analyticsQueue = new Queue('analytics', { connection, defaultJobOptions: { attempts: 2 } });
    queuesAvailable = true;
    console.log('[Queue] Redis queues initialized');
  } catch (err) {
    console.warn('[Queue] Redis unavailable, queues disabled');
    queuesAvailable = false;
  }
}

export async function addEmailJob(type, data) {
  if (!queuesAvailable) { console.log('[Queue] Skipped email:', type); return; }
  try { await emailQueue.add(type, data); } catch (err) { console.error('[Queue] Email job error:', err.message); }
}

export async function addBackupJob(data) {
  if (!queuesAvailable) { console.log('[Queue] Skipped backup'); return; }
  try { await backupQueue.add('backup', data); } catch (err) { console.error('[Queue] Backup job error:', err.message); }
}

export async function addAnalyticsJob(data) {
  if (!queuesAvailable) { console.log('[Queue] Skipped analytics'); return; }
  try { await analyticsQueue.add('aggregate', data); } catch (err) { console.error('[Queue] Analytics job error:', err.message); }
}

export async function closeQueues() {
  if (!queuesAvailable) return;
  try {
    await emailQueue.close();
    await backupQueue.close();
    await analyticsQueue.close();
    console.log('[Queue] Queues closed');
  } catch (err) { console.error('[Queue] Close error:', err.message); }
}

export const gracefulShutdown = closeQueues;

initQueues();
