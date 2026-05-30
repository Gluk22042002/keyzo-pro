import multer from 'multer';
import { get, run, transaction } from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, `import-${Date.now()}${file.originalname.slice(file.originalname.lastIndexOf('.'))}`)
});
const csvUpload = multer({
  storage: csvStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'text/csv' || file.originalname.endsWith('.csv'))
});

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });

  return { headers, rows };
}

function validateProduct(row, idx) {
  const errors = [];
  if (!row.title) errors.push('title is required');
  if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) errors.push('price must be a positive number');
  if (row.price && Number(row.price) > 1000000) errors.push('price too high');
  if (row.stock_count && (isNaN(Number(row.stock_count)) || Number(row.stock_count) < 0)) errors.push('stock_count must be a non-negative number');
  return errors.length ? { row: idx + 1, errors } : null;
}

export function importRoutes(app, auth) {
  app.post('/api/import/products', auth, csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const fs = await import('fs/promises');
      const content = await fs.readFile(req.file.path, 'utf-8');
      const { headers, rows } = parseCSV(content);

      if (!rows.length) {
        return res.status(400).json({ error: 'CSV is empty or has no data rows' });
      }

      const requiredFields = ['title', 'price'];
      const missingFields = requiredFields.filter(f => !headers.includes(f));
      if (missingFields.length) {
        return res.status(400).json({ error: `Missing required columns: ${missingFields.join(', ')}` });
      }

      const validationErrors = [];
      const validRows = [];

      for (let i = 0; i < rows.length; i++) {
        const err = validateProduct(rows[i], i);
        if (err) validationErrors.push(err);
        else validRows.push(rows[i]);
      }

      if (!validRows.length) {
        return res.status(400).json({ error: 'No valid rows to import', validationErrors });
      }

      const sellerId = req.user.id;
      let imported = 0;
      let failed = 0;

      for (const row of validRows) {
        try {
          const categorySlug = row.category || row.category_slug || 'steam';
          const cat = await get('SELECT id FROM categories WHERE slug = $1', [categorySlug]) ||
                     await get('SELECT id FROM categories LIMIT 1');

          const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await run(
            `INSERT INTO products (id, title, description, price, old_price, category_id, seller_id, type, region, delivery_type, image, stock_count, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
              id,
              row.title,
              row.description || '',
              Number(row.price),
              row.old_price ? Number(row.old_price) : null,
              cat?.id || 1,
              sellerId,
              row.type || 'Ключ',
              row.region || 'Global',
              row.delivery_type || 'auto',
              row.image || '',
              row.stock_count ? Number(row.stock_count) : 1,
              JSON.stringify(row.tags ? row.tags.split(';').map(t => t.trim()) : []),
            ]
          );
          imported++;
        } catch (e) {
          failed++;
        }
      }

      await fs.unlink(req.file.path).catch(() => {});

      res.json({
        success: true,
        total: rows.length,
        imported,
        failed,
        validationErrors: validationErrors.length ? validationErrors : undefined,
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
