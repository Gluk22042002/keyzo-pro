import { get, getAll, run } from './db.js';

const ACHIEVEMENTS = {
  first_purchase: {
    name: 'Первая покупка',
    description: 'Совершите первую покупку на платформе',
    icon: '🛒',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM orders WHERE buyer_id = $1', [userId]))?.c || 0;
      return count >= 1;
    },
  },
  first_sale: {
    name: 'Первая продажа',
    description: 'Продайте первый товар',
    icon: '💰',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM orders WHERE seller_id = $1', [userId]))?.c || 0;
      return count >= 1;
    },
  },
  ten_purchases: {
    name: 'Покупатель',
    description: 'Совершите 10 покупок',
    icon: '🛍️',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM orders WHERE buyer_id = $1', [userId]))?.c || 0;
      return count >= 10;
    },
  },
  ten_sales: {
    name: 'Продавец',
    description: 'Продайте 10 товаров',
    icon: '🏪',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM orders WHERE seller_id = $1', [userId]))?.c || 0;
      return count >= 10;
    },
  },
  fifty_sales: {
    name: 'Мастер продаж',
    description: 'Продайте 50 товаров',
    icon: '⭐',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM orders WHERE seller_id = $1', [userId]))?.c || 0;
      return count >= 50;
    },
  },
  hundred_sales: {
    name: 'Топ продавец',
    description: 'Продайте 100 товаров',
    icon: '👑',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM orders WHERE seller_id = $1', [userId]))?.c || 0;
      return count >= 100;
    },
  },
  verified_seller: {
    name: 'Верифицированный продавец',
    description: 'Получите верификацию продавца',
    icon: '✓',
    check: async (userId) => {
      const user = await get('SELECT is_verified FROM users WHERE id = $1', [userId]);
      return user?.is_verified === true;
    },
  },
  high_rated: {
    name: 'Высокий рейтинг',
    description: 'Поддерживайте рейтинг выше 4.8',
    icon: '🌟',
    check: async (userId) => {
      const user = await get('SELECT rating FROM users WHERE id = $1 AND role = $2', [userId, 'seller']);
      return user && Number(user.rating) >= 4.8;
    },
  },
  big_spender: {
    name: 'Крупный покупатель',
    description: 'Потратите более 10,000 ₽',
    icon: '💎',
    check: async (userId) => {
      const total = (await get('SELECT COALESCE(SUM(amount), 0)::numeric as total FROM orders WHERE buyer_id = $1', [userId]))?.total || 0;
      return Number(total) >= 10000;
    },
  },
  top_earner: {
    name: 'Топ заработок',
    description: 'Заработайте более 100,000 ₽',
    icon: '🏆',
    check: async (userId) => {
      const user = await get('SELECT total_revenue FROM users WHERE id = $1', [userId]);
      return Number(user?.total_revenue || 0) >= 100000;
    },
  },
  reviewer: {
    name: 'Критик',
    description: 'Оставьте 5 отзывов',
    icon: '📝',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM reviews WHERE buyer_id = $1', [userId]))?.c || 0;
      return count >= 5;
    },
  },
  early_bird: {
    name: 'Ранний пользователь',
    description: 'Зарегистрируйтесь в первые 30 дней',
    icon: '🦅',
    check: async (userId) => {
      const user = await get('SELECT created_at FROM users WHERE id = $1', [userId]);
      if (!user) return false;
      const daysSince = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    },
  },
  referral_master: {
    name: 'Реферал',
    description: 'Пригласите 3 друзей',
    icon: '👥',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM referrals WHERE referrer_id = $1 AND status = $2', [userId, 'completed']))?.c || 0;
      return count >= 3;
    },
  },
  first_review: {
    name: 'Первый отзыв',
    description: 'Оставьте первый отзыв',
    icon: '💬',
    check: async (userId) => {
      const count = (await get('SELECT COUNT(*)::int as c FROM reviews WHERE buyer_id = $1', [userId]))?.c || 0;
      return count >= 1;
    },
  },
  loyal_customer: {
    name: 'Лoyal клиент',
    description: 'Используйте 500+ баллов лояльности',
    icon: '❤️',
    check: async (userId) => {
      const total = (await get('SELECT COALESCE(SUM(ABS(points)), 0)::int as total FROM loyalty_points WHERE user_id = $1 AND type = $2', [userId, 'spend']))?.total || 0;
      return total >= 500;
    },
  },
};

async function getUserAchievements(userId) {
  return await getAll('SELECT * FROM user_achievements WHERE user_id = $1', [userId]);
}

async function awardAchievement(userId, key) {
  const existing = await get('SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_key = $2', [userId, key]);
  if (existing) return false;

  const achievement = ACHIEVEMENTS[key];
  if (!achievement) return false;

  await run('INSERT INTO user_achievements (user_id, achievement_key) VALUES ($1, $2)', [userId, key]);
  return true;
}

export async function checkAndAwardAchievements(userId) {
  const newlyEarned = [];

  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    try {
      const qualified = await achievement.check(userId);
      if (qualified) {
        const awarded = await awardAchievement(userId, key);
        if (awarded) {
          newlyEarned.push({ key, name: achievement.name, description: achievement.description, icon: achievement.icon });
        }
      }
    } catch (e) {
      console.error(`[Achievement] Error checking ${key}:`, e.message);
    }
  }

  return newlyEarned;
}

export function achievementRoutes(app, auth) {
  app.get('/api/achievements', auth, async (req, res) => {
    try {
      const userAchievements = await getUserAchievements(req.user.id);
      const earned = userAchievements.map(a => {
        const def = ACHIEVEMENTS[a.achievement_key];
        return { ...a, name: def?.name || a.achievement_key, description: def?.description || '', icon: def?.icon || '🏅' };
      });

      const all = Object.entries(ACHIEVEMENTS).map(([key, def]) => ({
        key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earned: !!userAchievements.find(a => a.achievement_key === key),
      }));

      res.json({ achievements: all, earned, total: Object.keys(ACHIEVEMENTS).length, earnedCount: userAchievements.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/achievements/check', auth, async (req, res) => {
    try {
      const newlyEarned = await checkAndAwardAchievements(req.user.id);
      res.json({ success: true, newlyEarned, count: newlyEarned.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/achievements/leaderboard', async (req, res) => {
    try {
      const leaders = await getAll(
        `SELECT u.id, u.username, u.avatar, COUNT(ua.id)::int as achievement_count FROM users u JOIN user_achievements ua ON u.id = ua.user_id GROUP BY u.id ORDER BY achievement_count DESC LIMIT 20`
      );
      res.json(leaders);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

export { ACHIEVEMENTS };
