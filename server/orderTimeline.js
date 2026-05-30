import { get, getAll, run } from './db.js';

export async function logTimelineEvent(orderId, status, note = '') {
  try {
    await run('INSERT INTO order_timeline (order_id, status, note) VALUES ($1, $2, $3)', [orderId, status, note]);
  } catch (e) { console.error('Timeline log error:', e.message); }
}

export default function orderTimelineRoutes(app, auth) {
  app.get('/api/orders/:id/timeline', auth, async (req, res) => {
    try {
      const order = await get('SELECT id, buyer_id, seller_id FROM orders WHERE id = $1', [req.params.id]);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not your order' });
      }

      const timeline = await getAll('SELECT id, order_id, status, note, created_at FROM order_timeline WHERE order_id = $1 ORDER BY created_at ASC', [req.params.id]);
      res.json(timeline);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
