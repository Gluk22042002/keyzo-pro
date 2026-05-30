import { get, getAll, run, transaction } from './db.js';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GIFT-';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function giftCardRoutes(app, auth) {
  app.post('/api/giftcards/buy', auth, async (req, res) => {
    try {
      const { amount, currency, recipient_email, message } = req.body;
      if (!amount || amount <= 0 || amount > 50000) return res.status(400).json({ error: 'Invalid amount (1-50000)' });
      if (!recipient_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) {
        return res.status(400).json({ error: 'Valid recipient_email required' });
      }

      const buyer = await get('SELECT * FROM users WHERE id = $1', [req.user.id]);
      const cur = (currency || 'RUB').toUpperCase();
      if (buyer.balance < amount) return res.status(400).json({ error: `Нужно: ${amount} ${cur}, на балансе: ${buyer.balance} ${cur}` });

      const code = generateCode();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      await transaction(async (client) => {
        await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
        await client.query(
          'INSERT INTO gift_cards (code, balance, currency, buyer_id, recipient_email, status, expires_at, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [code, amount, cur, req.user.id, recipient_email, 'active', expiresAt, message || '']
        );
      });

      const card = await get('SELECT * FROM gift_cards WHERE code = $1', [code]);
      const updatedBalance = (await get('SELECT balance FROM users WHERE id = $1', [req.user.id]))?.balance;
      res.json({ gift_card: card, balance: updatedBalance });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/giftcards/redeem', auth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Code required' });

      const card = await get('SELECT * FROM gift_cards WHERE code = $1', [code.toUpperCase().trim()]);
      if (!card) return res.status(404).json({ error: 'Gift card not found' });
      if (card.status !== 'active') return res.status(400).json({ error: 'Card is not active' });
      if (card.expires_at && new Date(card.expires_at) < new Date()) {
        await run("UPDATE gift_cards SET status = 'expired' WHERE id = $1", [card.id]);
        return res.status(400).json({ error: 'Gift card has expired' });
      }
      if (Number(card.balance) <= 0) return res.status(400).json({ error: 'Card balance is zero' });
      if (card.buyer_id === req.user.id) return res.status(400).json({ error: 'Cannot redeem your own gift card' });

      const redeemAmount = Number(card.balance);
      await transaction(async (client) => {
        await client.query('UPDATE gift_cards SET balance = 0, status = $1 WHERE id = $2', ['redeemed', card.id]);
        await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [redeemAmount, req.user.id]);
      });

      const updatedBalance = (await get('SELECT balance FROM users WHERE id = $1', [req.user.id]))?.balance;
      res.json({ redeemed: redeemAmount, currency: card.currency, balance: updatedBalance });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/giftcards/my', auth, async (req, res) => {
    try {
      const bought = await getAll('SELECT * FROM gift_cards WHERE buyer_id = $1 ORDER BY created_at DESC', [req.user.id]);
      const received = await getAll("SELECT * FROM gift_cards WHERE recipient_email = $1 AND status = 'active' ORDER BY created_at DESC", [(await get('SELECT email FROM users WHERE id = $1', [req.user.id]))?.email]);
      res.json({ bought, received });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/giftcards/check/:code', auth, async (req, res) => {
    try {
      const card = await get('SELECT id, balance, currency, status, expires_at, message FROM gift_cards WHERE code = $1', [req.params.code.toUpperCase().trim()]);
      if (!card) return res.status(404).json({ error: 'Gift card not found' });
      const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
      res.json({ ...card, is_expired: isExpired, is_redeemable: card.status === 'active' && !isExpired && Number(card.balance) > 0 });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/giftcards', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const cards = await getAll(
        'SELECT gc.*, u.username as buyer_name FROM gift_cards gc LEFT JOIN users u ON gc.buyer_id = u.id ORDER BY gc.created_at DESC'
      );
      res.json(cards);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { giftCardRoutes };
