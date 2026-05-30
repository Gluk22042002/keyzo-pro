import { get, getAll, run, transaction } from './db.js';

export function bundleRoutes(app, auth) {
  app.get('/api/bundles', async (req, res) => {
    try {
      const bundles = await getAll('SELECT b.*, (SELECT COUNT(*)::int FROM bundle_products WHERE bundle_id = b.id) as product_count FROM bundles b WHERE b.is_active = true ORDER BY b.discount_percent DESC');
      res.json(bundles);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/bundles/:id', async (req, res) => {
    try {
      const bundle = await get('SELECT * FROM bundles WHERE id = $1', [req.params.id]);
      if (!bundle) return res.status(404).json({ error: 'Bundle not found' });
      const products = await getAll(
        'SELECT p.*, u.username as seller_name FROM bundle_products bp JOIN products p ON bp.product_id = p.id LEFT JOIN users u ON p.seller_id = u.id WHERE bp.bundle_id = $1 AND p.is_active = true',
        [req.params.id]
      );
      res.json({ ...bundle, products });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/bundles/:id/products', async (req, res) => {
    try {
      const products = await getAll(
        'SELECT p.*, u.username as seller_name FROM bundle_products bp JOIN products p ON bp.product_id = p.id LEFT JOIN users u ON p.seller_id = u.id WHERE bp.bundle_id = $1 AND p.is_active = true',
        [req.params.id]
      );
      res.json(products);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/bundles', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { name, discount_percent, min_items, is_active, product_ids } = req.body;
      if (!name || !discount_percent) return res.status(400).json({ error: 'name and discount_percent required' });
      if (!product_ids || !Array.isArray(product_ids) || product_ids.length < 2) {
        return res.status(400).json({ error: 'At least 2 product_ids required' });
      }
      const result = await transaction(async (client) => {
        const id = (await client.query('INSERT INTO bundles (name, discount_percent, min_items, is_active) VALUES ($1, $2, $3, $4) RETURNING id', [name, discount_percent, min_items || 2, is_active !== false])).rows[0].id;
        for (const pid of product_ids) {
          await client.query('INSERT INTO bundle_products (bundle_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, pid]);
        }
        return id;
      });
      const bundle = await get('SELECT * FROM bundles WHERE id = $1', [result]);
      res.json(bundle);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/bundles/:id', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { name, discount_percent, min_items, is_active } = req.body;
      await run('UPDATE bundles SET name=COALESCE($1,name), discount_percent=COALESCE($2,discount_percent), min_items=COALESCE($3,min_items), is_active=COALESCE($4,is_active) WHERE id=$5', [name, discount_percent, min_items, is_active, req.params.id]);
      res.json(await get('SELECT * FROM bundles WHERE id = $1', [req.params.id]));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/bundles/:id', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      await run('DELETE FROM bundles WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/bundles/:id/add-product', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { product_id } = req.body;
      if (!product_id) return res.status(400).json({ error: 'product_id required' });
      await run('INSERT INTO bundle_products (bundle_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, product_id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/bundles/:id/remove-product', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { product_id } = req.body;
      if (!product_id) return res.status(400).json({ error: 'product_id required' });
      await run('DELETE FROM bundle_products WHERE bundle_id = $1 AND product_id = $2', [req.params.id, product_id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/bundles/check-discount', auth, async (req, res) => {
    try {
      const { product_ids } = req.body;
      if (!product_ids || !Array.isArray(product_ids)) return res.status(400).json({ error: 'product_ids array required' });

      const bundles = await getAll('SELECT * FROM bundles WHERE is_active = true');
      let bestDiscount = 0;
      let appliedBundle = null;

      for (const bundle of bundles) {
        const bundleProducts = await getAll('SELECT product_id FROM bundle_products WHERE bundle_id = $1', [bundle.id]);
        const bundlePids = bundleProducts.map(p => p.product_id);
        const matchedCount = product_ids.filter(id => bundlePids.includes(id)).length;

        if (matchedCount >= bundle.min_items) {
          if (bundle.discount_percent > bestDiscount) {
            bestDiscount = bundle.discount_percent;
            appliedBundle = bundle;
          }
        }
      }

      res.json({ discount_percent: bestDiscount, bundle: appliedBundle });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { bundleRoutes };
