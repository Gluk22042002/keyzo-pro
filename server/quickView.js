import { get } from './db.js';

export default function quickViewRoutes(app) {
  app.get('/api/products/:id/quickview', async (req, res) => {
    try {
      const product = await get(
        `SELECT p.title, p.price, p.image, p.rating, p.stock_count, p.is_active, u.username as seller_name
         FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = $1`,
        [req.params.id]
      );
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (!product.is_active) return res.status(404).json({ error: 'Product not available' });
      res.json({
        title: product.title,
        price: product.price,
        image: product.image,
        rating: product.rating,
        stock: product.stock_count,
        seller_name: product.seller_name
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
