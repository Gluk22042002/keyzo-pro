import { get, getAll, run } from './db.js';

export default function tagsRoutes(app, auth) {
  app.get('/api/products/:id/tags', async (req, res) => {
    try {
      const tags = await getAll('SELECT id, product_id, tag FROM product_tags WHERE product_id = $1 ORDER BY id', [req.params.id]);
      res.json(tags);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/products/:id/tags', auth, async (req, res) => {
    try {
      const product = await get('SELECT seller_id FROM products WHERE id = $1', [req.params.id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });

      const { tags } = req.body;
      if (!Array.isArray(tags) || tags.length === 0) return res.status(400).json({ error: 'Tags array required' });

      for (const tag of tags) {
        const trimmed = tag.trim().toLowerCase();
        if (!trimmed) continue;
        const existing = await get('SELECT id FROM product_tags WHERE product_id = $1 AND tag = $2', [req.params.id, trimmed]);
        if (!existing) {
          await run('INSERT INTO product_tags (product_id, tag) VALUES ($1, $2)', [req.params.id, trimmed]);
        }
      }

      const updated = await getAll('SELECT id, product_id, tag FROM product_tags WHERE product_id = $1 ORDER BY id', [req.params.id]);
      res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/products/:id/tags/:tagId', auth, async (req, res) => {
    try {
      const product = await get('SELECT seller_id FROM products WHERE id = $1', [req.params.id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });

      const tag = await get('SELECT id FROM product_tags WHERE id = $1 AND product_id = $2', [req.params.tagId, req.params.id]);
      if (!tag) return res.status(404).json({ error: 'Tag not found' });

      await run('DELETE FROM product_tags WHERE id = $1', [req.params.tagId]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/products', async (req, res, next) => {
    if (!req.query.tags) return next();
    try {
      const tagList = req.query.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (tagList.length === 0) return next();

      const placeholders = tagList.map((_, i) => `$${i + 1}`);
      const productIds = await getAll(
        `SELECT product_id FROM product_tags WHERE tag IN (${placeholders.join(',')}) GROUP BY product_id HAVING COUNT(DISTINCT tag) = ${tagList.length}`,
        tagList
      );

      if (productIds.length === 0) return res.json({ products: [], total: 0, page: 1, pages: 0 });

      const ids = productIds.map(p => p.product_id);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      let where = ['p.is_active = true', `p.id IN (${ids.map((_, i) => `$${i + 1}`).join(',')})`];
      let params = [...ids];
      let idx = params.length + 1;

      if (req.query.search) { where.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`); params.push(`%${req.query.search}%`); idx++; }
      if (req.query.category) { where.push(`c.slug = $${idx++}`); params.push(req.query.category); }
      if (req.query.min_price) { where.push(`p.price >= $${idx++}`); params.push(Number(req.query.min_price)); }
      if (req.query.max_price) { where.push(`p.price <= $${idx++}`); params.push(Number(req.query.max_price)); }

      const whereClause = where.join(' AND ');
      const total = (await get(`SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause}`, params))?.count || 0;
      const products = await getAll(`SELECT p.*, c.name as category_name, c.slug as category_slug, u.username as seller_name FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id WHERE ${whereClause} ORDER BY p.sold_count DESC LIMIT $${idx++} OFFSET $${idx}`, [...params, limit, offset]);
      res.json({ products, total, page, pages: Math.ceil(total / limit) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
