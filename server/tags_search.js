import { get, getAll } from './db.js';

export default function tagsSearchRoutes(app) {
  app.get('/api/tags/popular', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const tags = await getAll(
        `SELECT tag, COUNT(*) as count FROM product_tags pt
         JOIN products p ON pt.product_id = p.id
         WHERE p.is_active = true
         GROUP BY tag ORDER BY count DESC LIMIT $1`,
        [limit]
      );
      res.json(tags);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/tags/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.length < 1) return res.json([]);

      const tags = await getAll(
        `SELECT DISTINCT tag FROM product_tags WHERE tag ILIKE $1 ORDER BY tag LIMIT 20`,
        [`%${q}%`]
      );
      res.json(tags.map(t => t.tag));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/search', async (req, res, next) => {
    if (!req.query.tags) return next();
    try {
      const tagList = req.query.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const q = req.query.q || '';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      let where = ['p.is_active = true'];
      let params = [];
      let idx = 1;

      if (q && q.length >= 2) {
        where.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
        params.push(`%${q}%`);
        idx++;
      }

      if (tagList.length > 0) {
        const tagPlaceholders = tagList.map((_, i) => `$${idx + i}`);
        where.push(`p.id IN (SELECT product_id FROM product_tags WHERE tag IN (${tagPlaceholders.join(',')}) GROUP BY product_id HAVING COUNT(DISTINCT tag) = ${tagList.length})`);
        params.push(...tagList);
        idx += tagList.length;
      }

      const whereClause = where.join(' AND ');
      const total = (await get(`SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`, params))?.count || 0;
      const products = await getAll(
        `SELECT p.*, c.name as category_name, c.slug as category_slug, u.username as seller_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id
         WHERE ${whereClause} ORDER BY p.sold_count DESC LIMIT $${idx++} OFFSET $${idx}`,
        [...params, limit, offset]
      );

      res.json({ products, total, page, pages: Math.ceil(total / limit) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
