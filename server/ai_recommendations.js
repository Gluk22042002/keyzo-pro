import { get, getAll } from './db.js';

export default function recommendationsRoutes(app) {
  app.get('/api/products/:id/recommendations', async (req, res) => {
    try {
      const product = await get('SELECT category_id, price, rating, seller_id FROM products WHERE id = $1 AND is_active = true', [req.params.id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const minPrice = Number(product.price) * 0.7;
      const maxPrice = Number(product.price) * 1.3;

      const recommendations = await getAll(
        `SELECT p.*, u.username as seller_name, c.name as category_name
         FROM products p
         LEFT JOIN users u ON p.seller_id = u.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true
           AND p.id != $1
           AND p.category_id = $2
           AND p.price >= $3
           AND p.price <= $4
           AND p.rating >= 4.0
         ORDER BY p.rating DESC, p.sold_count DESC
         LIMIT 8`,
        [req.params.id, product.category_id, minPrice, maxPrice]
      );

      if (recommendations.length < 8) {
        const existingIds = [req.params.id, ...recommendations.map(r => r.id)];
        const fillers = await getAll(
          `SELECT p.*, u.username as seller_name, c.name as category_name
           FROM products p
           LEFT JOIN users u ON p.seller_id = u.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.is_active = true
             AND p.id NOT IN (${existingIds.map((_, i) => `$${i + 1}`).join(',')})
             AND p.rating >= 4.0
           ORDER BY p.sold_count DESC
           LIMIT $${existingIds.length + 1}`,
          [...existingIds, 8 - recommendations.length]
        );
        recommendations.push(...fillers);
      }

      res.json(recommendations);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
