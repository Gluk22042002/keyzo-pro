import { pool, query } from './db.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const res = await query('SELECT name FROM _migrations ORDER BY id');
  return res.rows.map(r => r.name);
}

function getMigrationFiles() {
  const migrationsDir = join(__dirname, 'migrations');
  try {
    return readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
  } catch {
    return [];
  }
}

async function applyMigration(name, sql) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    console.log(`  Applied: ${name}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`  Failed: ${name}`);
    throw e;
  } finally {
    client.release();
  }
}

async function rollbackMigration(name) {
  const migrationsDir = join(__dirname, 'migrations');
  const rollbackFile = join(migrationsDir, name.replace('.sql', '.rollback.sql'));
  let sql;
  try {
    sql = readFileSync(rollbackFile, 'utf8');
  } catch {
    console.log(`  No rollback file for ${name}`);
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM _migrations WHERE name = $1', [name]);
    await client.query('COMMIT');
    console.log(`  Rolled back: ${name}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`  Rollback failed: ${name}`);
    throw e;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  console.log('Checking migrations...');
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter(f => !applied.includes(f));

  if (pending.length === 0) {
    console.log('No pending migrations');
    return { applied: 0, pending: 0 };
  }

  console.log(`Found ${pending.length} pending migration(s)`);
  let count = 0;
  for (const file of pending) {
    const sql = readFileSync(join(__dirname, 'migrations', file), 'utf8');
    await applyMigration(file, sql);
    count++;
  }
  console.log(`Applied ${count} migration(s)`);
  return { applied: count, pending: pending.length };
}

async function rollbackLast() {
  console.log('Rolling back last migration...');
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    console.log('No migrations to rollback');
    return;
  }
  const last = applied[applied.length - 1];
  await rollbackMigration(last);
  console.log('Rollback complete');
}

async function rollbackAll() {
  console.log('Rolling back all migrations...');
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    console.log('No migrations to rollback');
    return;
  }
  for (const name of [...applied].reverse()) {
    await rollbackMigration(name);
  }
  console.log('All migrations rolled back');
}

async function status() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter(f => !applied.includes(f));

  console.log('Migration Status:');
  console.log(`  Applied: ${applied.length}`);
  console.log(`  Pending: ${pending.length}`);
  if (applied.length > 0) {
    console.log('\nApplied:');
    applied.forEach(m => console.log(`  [x] ${m}`));
  }
  if (pending.length > 0) {
    console.log('\nPending:');
    pending.forEach(m => console.log(`  [ ] ${m}`));
  }
  return { applied: applied.length, pending: pending.length };
}

// CLI
const command = process.argv[2];

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    switch (command) {
      case 'rollback':
        await rollbackLast();
        break;
      case 'rollback-all':
        await rollbackAll();
        break;
      case 'status':
        await status();
        break;
      default:
        await runMigrations();
    }
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
}

export { runMigrations, rollbackLast, rollbackAll, status };
export default runMigrations;
