import { get, getAll, run } from './db.js';

export function newsletterRoutes(app, auth) {
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email required' });
      }

      const existing = await get('SELECT * FROM newsletter_subscribers WHERE email = $1', [email]);
      if (existing) {
        if (!existing.is_active) {
          await run("UPDATE newsletter_subscribers SET is_active = true WHERE email = $1", [email]);
          return res.json({ success: true, message: 'Subscription reactivated' });
        }
        return res.json({ success: true, message: 'Already subscribed' });
      }

      await run('INSERT INTO newsletter_subscribers (email, is_active) VALUES ($1, true)', [email]);
      res.json({ success: true, message: 'Subscribed successfully' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/newsletter/unsubscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });

      await run("UPDATE newsletter_subscribers SET is_active = false WHERE email = $1", [email]);
      res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/newsletter/subscribers', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const subscribers = await getAll('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
      const stats = {
        total: subscribers.length,
        active: subscribers.filter(s => s.is_active).length,
        unsubscribed: subscribers.filter(s => !s.is_active).length
      };
      res.json({ subscribers, stats });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/newsletter/stats', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const total = (await get('SELECT COUNT(*)::int as c FROM newsletter_subscribers'))?.c || 0;
      const active = (await get("SELECT COUNT(*)::int as c FROM newsletter_subscribers WHERE is_active = true"))?.c || 0;
      const thisWeek = (await get("SELECT COUNT(*)::int as c FROM newsletter_subscribers WHERE created_at > NOW() - INTERVAL '7 days'"))?.c || 0;
      res.json({ total, active, unsubscribed: total - active, this_week: thisWeek });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { newsletterRoutes };
