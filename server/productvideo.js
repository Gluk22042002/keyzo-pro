import { get, getAll, run } from './db.js';

export function productVideoRoutes(app, auth) {
  app.post('/api/products/:id/video', auth, async (req, res) => {
    try {
      const product = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not your product' });
      }

      const { video_url } = req.body;
      if (!video_url) return res.status(400).json({ error: 'video_url required' });

      const validFormats = ['.mp4', '.webm', '.ogg', 'youtube.com', 'youtu.be', 'vimeo.com'];
      const isValid = validFormats.some(f => video_url.toLowerCase().includes(f));
      if (!isValid) return res.status(400).json({ error: 'Unsupported video format' });

      await run('UPDATE products SET video_url = $1, updated_at = NOW() WHERE id = $2', [video_url, req.params.id]);
      const updated = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/products/:id/video', auth, async (req, res) => {
    try {
      const product = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not your product' });
      }
      await run('UPDATE products SET video_url = NULL, updated_at = NOW() WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { productVideoRoutes };
