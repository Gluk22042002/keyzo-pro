import { Parser } from 'json2csv';
import { get, getAll } from './db.js';

function formatCSV(data, fields) {
  if (!data.length) return '';
  const parser = new Parser({ fields, delimiter: ',', withBOM: true });
  return parser.parse(data);
}

export function exportRoutes(app, auth, adminOnly) {
  app.get('/api/export/orders', auth, async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const where = req.user.role === 'admin' ? '' : 'WHERE o.buyer_id = $1 OR o.seller_id = $1';
      const params = req.user.role === 'admin' ? [] : [req.user.id];

      const orders = await getAll(
        `SELECT o.id, o.buyer_id, o.product_id, o.seller_id, o.amount, o.commission, o.seller_amount, o.discount, o.status, o.created_at, p.title as product_title, u.username as buyer_name, s.username as seller_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id JOIN users s ON o.seller_id = s.id ${where} ORDER BY o.created_at DESC`,
        params
      );

      if (format === 'csv') {
        const fields = ['id', 'product_title', 'buyer_name', 'seller_name', 'amount', 'commission', 'seller_amount', 'discount', 'status', 'created_at'];
        const csv = formatCSV(orders, fields);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
        return res.send(csv);
      }
      res.json(orders);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/export/products', auth, async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const where = req.user.role === 'admin' ? '' : 'WHERE p.seller_id = $1';
      const params = req.user.role === 'admin' ? [] : [req.user.id];

      const products = await getAll(
        `SELECT p.id, p.title, p.description, p.price, p.old_price, p.type, p.region, p.delivery_type, p.stock_count, p.sold_count, p.rating, p.rating_count, p.view_count, p.is_active, p.is_featured, p.created_at, u.username as seller_name, c.name as category_name FROM products p LEFT JOIN users u ON p.seller_id = u.id LEFT JOIN categories c ON p.category_id = c.id ${where} ORDER BY p.created_at DESC`,
        params
      );

      if (format === 'csv') {
        const fields = ['id', 'title', 'description', 'price', 'old_price', 'type', 'region', 'delivery_type', 'category_name', 'seller_name', 'stock_count', 'sold_count', 'rating', 'rating_count', 'view_count', 'is_active', 'is_featured', 'created_at'];
        const csv = formatCSV(products, fields);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`);
        return res.send(csv);
      }
      res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/export/users', auth, adminOnly, async (req, res) => {
    try {
      const format = req.query.format || 'json';

      const users = await getAll(
        `SELECT id, username, email, role, balance, is_verified, verification_badge, total_sales, total_revenue, rating, rating_count, created_at, last_active FROM users ORDER BY created_at DESC`
      );

      if (format === 'csv') {
        const fields = ['id', 'username', 'email', 'role', 'balance', 'is_verified', 'total_sales', 'total_revenue', 'rating', 'rating_count', 'created_at', 'last_active'];
        const csv = formatCSV(users, fields);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
        return res.send(csv);
      }
      res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
