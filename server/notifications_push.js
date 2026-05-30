import { get, getAll, run } from './db.js';

export default function pushRoutes(app, auth) {
  app.post('/api/push/subscribe', auth, async (req, res) => {
    try {
      const { endpoint, p256dh, auth: authKey } = req.body;
      if (!endpoint || !p256dh || !authKey) return res.status(400).json({ error: 'endpoint, p256dh, and auth required' });

      const existing = await get('SELECT id FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [endpoint, req.user.id]);
      if (existing) return res.json({ success: true, id: existing.id });

      const result = await run('INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4) RETURNING id', [req.user.id, endpoint, p256dh, authKey]);
      res.json({ success: true, id: result.rows[0].id });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/push/unsubscribe', auth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

      await run('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [endpoint, req.user.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/push/status', auth, async (req, res) => {
    try {
      const subs = await getAll('SELECT id, endpoint, created_at FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      res.json({ subscribed: subs.length > 0, count: subs.length, subscriptions: subs });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
