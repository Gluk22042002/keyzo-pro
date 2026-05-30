import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKUP_DIR = join(__dirname, '..', 'backups');

let cronInterval = null;

async function ensureBackupDir() {
  const { mkdir } = await import('fs/promises');
  await mkdir(BACKUP_DIR, { recursive: true });
}

export async function createBackup() {
  await ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `keyzo-backup-${timestamp}.sql`;
  const filepath = join(BACKUP_DIR, filename);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');

  try {
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    const env = { ...process.env, PGPASSWORD: password };
    const cmd = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}"`;

    await execAsync(cmd, { env, timeout: 300000 });
    const stats = await stat(filepath);

    console.log(`[Backup] Created: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
    return { filename, size: stats.size, created_at: new Date().toISOString() };
  } catch (e) {
    console.error(`[Backup] Error: ${e.message}`);
    throw e;
  }
}

export async function listBackups() {
  await ensureBackupDir();
  const files = await readdir(BACKUP_DIR);
  const backups = [];

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const filepath = join(BACKUP_DIR, file);
    const stats = await stat(filepath);
    backups.push({
      filename: file,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      created_at: stats.birthtime.toISOString(),
    });
  }

  return backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function restoreBackup(filename) {
  const filepath = join(BACKUP_DIR, filename);
  try {
    await stat(filepath);
  } catch {
    throw new Error(`Backup file not found: ${filename}`);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');

  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;

  const env = { ...process.env, PGPASSWORD: password };
  const cmd = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`;

  try {
    await execAsync(cmd, { env, timeout: 300000 });
    console.log(`[Backup] Restored from: ${filename}`);
    return { success: true, filename, restored_at: new Date().toISOString() };
  } catch (e) {
    console.error(`[Backup] Restore error: ${e.message}`);
    throw e;
  }
}

export async function deleteBackup(filename) {
  const filepath = join(BACKUP_DIR, filename);
  try {
    await stat(filepath);
    await unlink(filepath);
    console.log(`[Backup] Deleted: ${filename}`);
    return { success: true, filename };
  } catch {
    throw new Error(`Backup file not found: ${filename}`);
  }
}

export function startScheduledBackup(intervalMs = 86400000) {
  if (cronInterval) clearInterval(cronInterval);
  console.log(`[Backup] Scheduled backup every ${intervalMs / 3600000}h`);
  cronInterval = setInterval(async () => {
    try {
      await createBackup();
      const backups = await listBackups();
      const maxBackups = 10;
      if (backups.length > maxBackups) {
        for (const old of backups.slice(maxBackups)) {
          await deleteBackup(old.filename).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[Backup] Scheduled backup failed:', e.message);
    }
  }, intervalMs);
}

export function stopScheduledBackup() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[Backup] Scheduled backup stopped');
  }
}

export function backupRoutes(app, auth, adminOnly) {
  app.post('/api/backup/create', auth, adminOnly, async (req, res) => {
    try {
      const backup = await createBackup();
      res.json({ success: true, backup });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/backup/list', auth, adminOnly, async (req, res) => {
    try {
      const backups = await listBackups();
      res.json(backups);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/backup/restore/:filename', auth, adminOnly, async (req, res) => {
    try {
      const result = await restoreBackup(req.params.filename);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/backup/:filename', auth, adminOnly, async (req, res) => {
    try {
      const result = await deleteBackup(req.params.filename);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
