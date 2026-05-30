import { get, getAll } from './db.js';

export function sellerAnalyticsRoutes(app, auth) {
  app.get('/api/seller/analytics/chart', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'seller' && req.user?.role !== 'admin') return res.status(403).json({ error: 'Seller only' });
      const days = parseInt(req.query.days) || 30;

      const chartData = await getAll(
        `SELECT date, views, orders, revenue FROM seller_analytics WHERE seller_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2 ORDER BY date`,
        [req.user.id, days]
      );

      const dailyRevenue = await getAll(
        `SELECT DATE(created_at) as date, COUNT(*)::int as orders, SUM(amount)::numeric as revenue
         FROM orders WHERE seller_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '1 day' * $2 AND status IN ('completed','paid')
         GROUP BY DATE(created_at) ORDER BY date`,
        [req.user.id, days]
      );

      const dailyViews = await getAll(
        `SELECT date, SUM(views)::int as views FROM product_views_daily pvd
         JOIN products p ON pvd.product_id = p.id WHERE p.seller_id = $1 AND pvd.date >= CURRENT_DATE - INTERVAL '1 day' * $2
         GROUP BY pvd.date ORDER BY pvd.date`,
        [req.user.id, days]
      );

      const merged = {};
      for (const row of chartData) merged[row.date] = { date: row.date, views: row.views, orders: row.orders, revenue: Number(row.revenue) };
      for (const row of dailyRevenue) {
        const d = new Date(row.date).toISOString().split('T')[0];
        if (!merged[d]) merged[d] = { date: d, views: 0, orders: 0, revenue: 0 };
        merged[d].orders = row.orders;
        merged[d].revenue = Number(row.revenue);
      }
      for (const row of dailyViews) {
        const d = new Date(row.date).toISOString().split('T')[0];
        if (!merged[d]) merged[d] = { date: d, views: 0, orders: 0, revenue: 0 };
        merged[d].views = row.views;
      }

      const result = Object.values(merged).sort((a, b) => a.date.localeCompare(b.date));
      const summary = result.reduce((acc, d) => ({
        totalViews: acc.totalViews + d.views,
        totalOrders: acc.totalOrders + d.orders,
        totalRevenue: acc.totalRevenue + d.revenue
      }), { totalViews: 0, totalOrders: 0, totalRevenue: 0 });

      summary.conversionRate = summary.totalViews > 0
        ? ((summary.totalOrders / summary.totalViews) * 100).toFixed(1)
        : '0';

      res.json({ chart: result, summary });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/analytics/top-products', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'seller' && req.user?.role !== 'admin') return res.status(403).json({ error: 'Seller only' });

      const products = await getAll(
        `SELECT p.id, p.title, p.image, p.price, p.sold_count, p.view_count, p.rating,
                (p.sold_count * p.price)::numeric as revenue,
                CASE WHEN p.view_count > 0 THEN ((p.sold_count::float / p.view_count) * 100) ELSE 0 END as conversion_rate
         FROM products p WHERE p.seller_id = $1 AND p.is_active = true
         ORDER BY revenue DESC LIMIT 10`,
        [req.user.id]
      );

      const categories = await getAll(
        `SELECT c.name as category, COUNT(p.id)::int as product_count, SUM(p.sold_count)::int as total_sold, SUM(p.sold_count * p.price)::numeric as total_revenue
         FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.seller_id = $1 AND p.is_active = true
         GROUP BY c.name ORDER BY total_revenue DESC`,
        [req.user.id]
      );

      res.json({ products, categories });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/analytics/conversion', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'seller' && req.user?.role !== 'admin') return res.status(403).json({ error: 'Seller only' });
      const days = parseInt(req.query.days) || 30;

      const conversionData = await getAll(
        `SELECT DATE(o.created_at) as date, COUNT(*)::int as orders
         FROM orders o WHERE o.seller_id = $1 AND o.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2 AND o.status IN ('completed','paid')
         GROUP BY DATE(o.created_at) ORDER BY date`,
        [req.user.id, days]
      );

      const viewsData = await getAll(
        `SELECT date, SUM(views)::int as views FROM product_views_daily pvd
         JOIN products p ON pvd.product_id = p.id WHERE p.seller_id = $1 AND pvd.date >= CURRENT_DATE - INTERVAL '1 day' * $2
         GROUP BY pvd.date ORDER BY pvd.date`,
        [req.user.id, days]
      );

      const merged = {};
      for (const row of conversionData) {
        const d = new Date(row.date).toISOString().split('T')[0];
        merged[d] = { date: d, orders: row.orders, views: 0 };
      }
      for (const row of viewsData) {
        const d = new Date(row.date).toISOString().split('T')[0];
        if (!merged[d]) merged[d] = { date: d, orders: 0, views: 0 };
        merged[d].views = row.views;
      }

      const result = Object.values(merged)
        .map(d => ({
          date: d.date,
          orders: d.orders,
          views: d.views,
          conversion_rate: d.views > 0 ? ((d.orders / d.views) * 100).toFixed(2) : '0'
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalOrders = result.reduce((s, d) => s + d.orders, 0);
      const totalViews = result.reduce((s, d) => s + d.views, 0);
      const avgConversion = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : '0';

      res.json({ conversion: result, summary: { total_orders: totalOrders, total_views: totalViews, avg_conversion: avgConversion } });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/analytics/overview', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'seller' && req.user?.role !== 'admin') return res.status(403).json({ error: 'Seller only' });

      const stats = await get(
        `SELECT COUNT(*)::int as total_products, SUM(sold_count)::int as total_sales, SUM(view_count)::int as total_views,
                AVG(rating)::numeric as avg_rating, SUM(sold_count * price)::numeric as total_revenue
         FROM products WHERE seller_id = $1 AND is_active = true`,
        [req.user.id]
      );

      const recentRevenue = await get(
        `SELECT COALESCE(SUM(amount), 0)::numeric as revenue FROM orders WHERE seller_id = $1 AND status IN ('completed','paid') AND created_at >= NOW() - INTERVAL '30 days'`,
        [req.user.id]
      );

      const pendingOrders = (await get(
        "SELECT COUNT(*)::int as c FROM orders WHERE seller_id = $1 AND status IN ('paid','delivered')",
        [req.user.id]
      ))?.c || 0;

      const repeatBuyers = (await get(
        'SELECT COUNT(DISTINCT buyer_id)::int as c FROM orders WHERE seller_id = $1',
        [req.user.id]
      ))?.c || 0;

      res.json({
        ...stats,
        revenue_30d: recentRevenue?.revenue || 0,
        pending_orders: pendingOrders,
        repeat_buyers: repeatBuyers,
        conversion_rate: stats?.total_views > 0 ? ((stats.total_sales / stats.total_views) * 100).toFixed(1) : '0'
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { sellerAnalyticsRoutes };
