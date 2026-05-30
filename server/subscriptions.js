import { get, getAll, run } from './db.js';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    commission_percent: 8,
    max_products: 5,
    features: ['5 товаров', '8% комиссия', 'Базовая аналитика', 'Чат с покупателями'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 990,
    commission_percent: 5,
    max_products: 50,
    features: ['50 товаров', '5% комиссия', 'Расширенная аналитика', 'Приоритетная поддержка', 'Промокоды', 'Выделение товаров'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 4990,
    commission_percent: 3,
    max_products: -1,
    features: ['Безлимит товаров', '3% комиссия', 'Полная аналитика', 'VIP поддержка', 'API доступ', 'Персональный менеджер', 'Белая пометка'],
  },
];

export async function getSellerSubscription(sellerId) {
  const sub = await get('SELECT * FROM seller_subscriptions WHERE seller_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1', [sellerId, 'active']);
  if (!sub) return { plan_id: 'free', plan: PLANS[0], status: 'active' };
  const plan = PLANS.find(p => p.id === sub.plan_id) || PLANS[0];
  return { ...sub, plan };
}

export async function canAddProduct(sellerId) {
  const sub = await getSellerSubscription(sellerId);
  if (sub.plan.max_products === -1) return true;
  const count = (await get('SELECT COUNT(*)::int as c FROM products WHERE seller_id = $1 AND is_active = true', [sellerId]))?.c || 0;
  return count < sub.plan.max_products;
}

export async function getCommissionRate(sellerId) {
  const sub = await getSellerSubscription(sellerId);
  return sub.plan.commission_percent / 100;
}

export function subscriptionRoutes(app, auth) {
  app.get('/api/subscriptions/plans', (req, res) => {
    res.json(PLANS);
  });

  app.get('/api/subscriptions/current', auth, async (req, res) => {
    try {
      const sub = await getSellerSubscription(req.user.id);
      const productCount = (await get('SELECT COUNT(*)::int as c FROM products WHERE seller_id = $1 AND is_active = true', [req.user.id]))?.c || 0;

      res.json({
        ...sub.plan,
        subscription_status: sub.status || 'active',
        current_period_end: sub.current_period_end || null,
        product_count: productCount,
        max_products: sub.plan.max_products === -1 ? 'unlimited' : sub.plan.max_products,
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/subscriptions/subscribe', auth, async (req, res) => {
    try {
      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only sellers can subscribe' });
      }

      const { plan_id } = req.body;
      if (!plan_id) return res.status(400).json({ error: 'plan_id required' });

      const plan = PLANS.find(p => p.id === plan_id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      if (plan.price > 0) {
        const user = await get('SELECT balance FROM users WHERE id = $1', [req.user.id]);
        if (user.balance < plan.price) {
          return res.status(400).json({ error: `Недостаточно средств. Нужно: ${plan.price} ₽, на балансе: ${user.balance} ₽` });
        }
        await run('UPDATE users SET balance = balance - $1 WHERE id = $2', [plan.price, req.user.id]);
      }

      await run("UPDATE seller_subscriptions SET status = 'cancelled' WHERE seller_id = $1 AND status = 'active'", [req.user.id]);

      const periodEnd = new Date();
      if (plan_id === 'pro') periodEnd.setMonth(periodEnd.getMonth() + 1);
      else if (plan_id === 'business') periodEnd.setMonth(periodEnd.getMonth() + 1);

      await run(
        `INSERT INTO seller_subscriptions (seller_id, plan_id, status, current_period_end) VALUES ($1, $2, 'active', $3)`,
        [req.user.id, plan_id, periodEnd.toISOString()]
      );

      const updatedBalance = (await get('SELECT balance FROM users WHERE id = $1', [req.user.id]))?.balance;

      res.json({
        success: true,
        plan,
        balance: updatedBalance,
        current_period_end: periodEnd.toISOString(),
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/subscriptions/cancel', auth, async (req, res) => {
    try {
      await run("UPDATE seller_subscriptions SET status = 'cancelled' WHERE seller_id = $1 AND status = 'active'", [req.user.id]);
      res.json({ success: true, plan: PLANS[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
