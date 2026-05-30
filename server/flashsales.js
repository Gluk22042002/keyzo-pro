import { get, getAll, run, transaction } from './db.js';

async function autoExpireSales() {
  try {
    await run(
      "UPDATE flash_sales SET status = 'expired' WHERE status = 'active' AND end_time < NOW()"
    );
  } catch {}
}

export function flashSalesRoutes(app, auth) {
  app.get('/api/flash-sales', async (req, res) => {
    try {
      await autoExpireSales();
      const now = new Date();
      const sales = await getAll(
        `SELECT fs.*, p.title, p.image, p.price as original_price, p.seller_id, u.username as seller_name
         FROM flash_sales fs
         JOIN products p ON fs.product_id = p.id
         LEFT JOIN users u ON p.seller_id = u.id
         WHERE fs.status = 'active' AND fs.start_time <= $1 AND fs.end_time > $1
         AND fs.sold_quantity < fs.max_quantity
         ORDER BY fs.end_time ASC`,
        [now]
      );
      res.json(sales.map(s => ({
        ...s,
        remaining_quantity: s.max_quantity - s.sold_quantity,
        seconds_left: Math.max(0, Math.floor((new Date(s.end_time) - now) / 1000)),
        discount_percent: Math.round((1 - s.sale_price / s.original_price) * 100)
      })));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/flash-sales/:id', async (req, res) => {
    try {
      await autoExpireSales();
      const sale = await get(
        `SELECT fs.*, p.title, p.image, p.price as original_price, p.seller_id, u.username as seller_name
         FROM flash_sales fs
         JOIN products p ON fs.product_id = p.id
         LEFT JOIN users u ON p.seller_id = u.id
         WHERE fs.id = $1`,
        [req.params.id]
      );
      if (!sale) return res.status(404).json({ error: 'Flash sale not found' });

      const now = new Date();
      const isActive = sale.status === 'active' && new Date(sale.start_time) <= now && new Date(sale.end_time) > now && sale.sold_quantity < sale.max_quantity;
      const secondsLeft = isActive ? Math.max(0, Math.floor((new Date(sale.end_time) - now) / 1000)) : 0;

      res.json({
        ...sale,
        is_active: isActive,
        remaining_quantity: sale.max_quantity - sale.sold_quantity,
        seconds_left: secondsLeft,
        discount_percent: Math.round((1 - sale.sale_price / sale.original_price) * 100)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/flash-sales', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { product_id, sale_price, start_time, end_time, max_quantity } = req.body;
      if (!product_id || !sale_price || !start_time || !end_time || !max_quantity) {
        return res.status(400).json({ error: 'product_id, sale_price, start_time, end_time, max_quantity required' });
      }
      const product = await get('SELECT * FROM products WHERE id = $1', [product_id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (sale_price >= product.price) return res.status(400).json({ error: 'Sale price must be less than original price' });
      if (new Date(end_time) <= new Date(start_time)) return res.status(400).json({ error: 'end_time must be after start_time' });

      const result = await run(
        'INSERT INTO flash_sales (product_id, sale_price, start_time, end_time, max_quantity, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [product_id, sale_price, start_time, end_time, max_quantity, 'active']
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/flash-sales/:id', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { sale_price, start_time, end_time, max_quantity, status } = req.body;
      await run(
        'UPDATE flash_sales SET sale_price=COALESCE($1,sale_price), start_time=COALESCE($2,start_time), end_time=COALESCE($3,end_time), max_quantity=COALESCE($4,max_quantity), status=COALESCE($5,status) WHERE id=$6',
        [sale_price, start_time, end_time, max_quantity, status, req.params.id]
      );
      res.json(await get('SELECT * FROM flash_sales WHERE id = $1', [req.params.id]));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/flash-sales/:id', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      await run('UPDATE flash_sales SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/flash-sales/:id/buy', auth, async (req, res) => {
    try {
      await autoExpireSales();
      const sale = await get('SELECT * FROM flash_sales WHERE id = $1', [req.params.id]);
      if (!sale) return res.status(404).json({ error: 'Flash sale not found' });

      const now = new Date();
      if (sale.status !== 'active' || new Date(sale.start_time) > now || new Date(sale.end_time) <= now) {
        return res.status(400).json({ error: 'Flash sale is not active' });
      }
      if (sale.sold_quantity >= sale.max_quantity) {
        return res.status(400).json({ error: 'Sold out' });
      }

      const product = await get('SELECT * FROM products WHERE id = $1', [sale.product_id]);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot buy own product' });
      if (product.stock_count <= 0) return res.status(400).json({ error: 'Out of stock' });

      const amount = Number(sale.sale_price);
      const buyer = await get('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (buyer.balance < amount) return res.status(400).json({ error: `Нужно: ${amount}, на балансе: ${buyer.balance}` });

      await transaction(async (client) => {
        await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
        const commission = Math.round(amount * 0.08);
        await client.query(
          "INSERT INTO orders (id, buyer_id, product_id, seller_id, amount, commission, seller_amount, status, delivery_data) VALUES ($1,$2,$3,$4,$5,$6,$7,'paid','')",
          [`flash-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, req.user.id, sale.product_id, product.seller_id, amount, commission, amount - commission]
        );
        await client.query('UPDATE products SET sold_count = sold_count + 1, stock_count = stock_count - 1 WHERE id = $1', [sale.product_id]);
        await client.query('UPDATE users SET total_sales = total_sales + 1, total_revenue = total_revenue + $1 WHERE id = $2', [amount - commission, product.seller_id]);
        await client.query('UPDATE flash_sales SET sold_quantity = sold_quantity + 1 WHERE id = $1', [sale.id]);
        if (sale.sold_quantity + 1 >= sale.max_quantity) {
          await client.query("UPDATE flash_sales SET status = 'sold_out' WHERE id = $1", [sale.id]);
        }
      });

      const updatedBalance = (await get('SELECT balance FROM users WHERE id = $1', [req.user.id]))?.balance;
      res.json({ success: true, balance: updatedBalance });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { flashSalesRoutes };
