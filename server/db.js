import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env` });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 20, idleTimeoutMillis: 30000 });

pool.on('error', (err) => console.error('Pool error:', err));

const NUMERIC_FIELDS = ['price', 'old_price', 'balance', 'amount', 'commission', 'seller_amount', 'discount', 'rating', 'avg_rating', 'total_revenue', 'min_order_amount', 'max_discount', 'discount_percent', 'discount_amount'];

function parseNumerics(row) {
  if (!row) return row;
  const parsed = { ...row };
  for (const key of Object.keys(parsed)) {
    if (NUMERIC_FIELDS.includes(key) && parsed[key] !== null && parsed[key] !== undefined) {
      parsed[key] = Number(parsed[key]);
    }
  }
  return parsed;
}

export async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) console.log('Slow query:', { text: text.slice(0, 80), duration, rows: res.rowCount });
  return res;
}

export async function get(text, params = []) {
  const res = await query(text, params);
  return parseNumerics(res.rows[0]) || null;
}

export async function getAll(text, params = []) {
  const res = await query(text, params);
  return res.rows.map(parseNumerics);
}

export async function run(text, params = []) {
  return await query(text, params);
}

export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export default pool;
