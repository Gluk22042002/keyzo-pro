import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool, get } from './db.js';

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function seedDemo() {
  const existing = await get('SELECT COUNT(*)::int as c FROM users');
  if (existing && existing.c > 3) {
    console.log('Database already has data. Skipping demo seed.');
    return;
  }

  console.log('Seeding demo data...');
  const hash = bcrypt.hashSync('password123', 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Categories
    const categories = [
      ['Steam', 'steam', '🎮', 'Пополнение Steam, ключи, гифты', 1],
      ['PlayStation', 'playstation', '🎯', 'PS Plus, игры, пополнение PSN', 2],
      ['Xbox', 'xbox', '🟢', 'Game Pass, Xbox Live', 3],
      ['Подписки', 'subscriptions', '⭐', 'ChatGPT, Spotify, Netflix, YouTube', 4],
      ['Игровые ключи', 'game-keys', '🔑', 'Ключи Steam, Epic, GOG', 5],
      ['Игровые аккаунты', 'game-accounts', '👤', 'Готовые аккаунты', 6],
      ['Виртуальная валюта', 'virtual-currency', '💰', 'Robux, V-Bucks, монеты', 7],
      ['Программы', 'software', '💻', 'Windows, Office, антивирусы', 8],
      ['Telegram', 'telegram', '✈️', 'Premium, звёзды, буст', 9],
      ['Discord', 'discord', '🤖', 'Nitro, буст серверов', 10],
    ];
    for (const c of categories) {
      await client.query(
        'INSERT INTO categories (name, slug, icon, description, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING',
        c
      );
    }
    const catRows = (await client.query('SELECT id, slug FROM categories')).rows;
    const catIds = {};
    catRows.forEach(r => catIds[r.slug] = r.id);

    // Users
    const adminId = uuidv4();
    const seller1Id = uuidv4();
    const seller2Id = uuidv4();
    const seller3Id = uuidv4();
    const buyer1Id = uuidv4();
    const buyer2Id = uuidv4();

    const users = [
      [adminId, 'Admin', 'admin@keyzo.pro', 0, 'admin', true, 'Администратор платформы Keyzo.pro', 'ADMIN001'],
      [seller1Id, 'DigitalShop', 'shop@keyzo.pro', 50000, 'seller', true, 'Продажа игровых ключей и подписок. Работаю 24/7. Автоматическая выдача.', '@digitalshop', 'SHOP001'],
      [seller2Id, 'GameZone', 'game@keyzo.pro', 25000, 'seller', true, 'Лучшие цены на игры и подписки. Гарантия на все товары.', '@gamezone', 'GAME001'],
      [seller3Id, 'SoftMaster', 'soft@keyzo.pro', 35000, 'seller', true, 'Лицензионное ПО и программное обеспечение. Официальные ключи.', '@softmaster', 'SOFT001'],
      [buyer1Id, 'Player1', 'player@test.com', 10000, 'user', false, '', 'PLAY001'],
      [buyer2Id, 'Player2', 'player2@test.com', 15000, 'user', false, '', 'PLAY002'],
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, username, email, balance, role, is_verified, bio, referral_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO NOTHING`,
        u
      );
    }

    // 50 Featured Products
    const products = [
      { title: 'STEAM РФ-СНГ RUB-KZT-UAH 24/7', desc: 'Быстрое пополнение Steam кошелька. Автоматическая выдача 24/7.', price: 106, cat: 'steam', type: 'Пополнение', region: 'RU/CIS', delivery: 'auto', sales: 4545053, rating: 4.9, reviews: 12580, featured: true },
      { title: 'Пополнение Steam Казахстан KZT', desc: 'Автоматическое пополнение Steam кошелька в казахстанских тенге.', price: 17, cat: 'steam', type: 'Пополнение', region: 'KZ', delivery: 'auto', sales: 836952, rating: 4.8, reviews: 3200, featured: true },
      { title: 'ChatGPT Plus подписка 1 месяц', desc: 'Полный доступ к ChatGPT Plus через токен. Быстрая активация.', price: 1899, oldPrice: 2499, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 2500, rating: 4.7, reviews: 890, featured: true },
      { title: 'PS Plus Essential Extra Deluxe', desc: 'Подписка PlayStation Plus на 1/3/12 месяцев. Турция.', price: 849, oldPrice: 1199, cat: 'playstation', type: 'Подписка', region: 'TR', delivery: 'auto', sales: 26629, rating: 4.8, reviews: 1890, featured: true },
      { title: 'GTA V Premium Enhanced + Legacy', desc: 'Steam гифт с полным доступом к GTA V Online.', price: 1674, oldPrice: 3145, cat: 'game-keys', type: 'Гифт', region: 'RU', delivery: 'gift', sales: 3500, rating: 4.9, reviews: 2100, featured: true },
      { title: 'Xbox Game Pass Ultimate 1-15 мес', desc: 'Доступ к Game Pass Ultimate. Игры на консоль и ПК.', price: 1049, oldPrice: 1999, cat: 'xbox', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 24855, rating: 4.7, reviews: 3500, featured: true },
      { title: 'Spotify Premium личный 1 мес', desc: 'Музыка без рекламы, оффлайн, высокое качество.', price: 229, oldPrice: 399, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 4200, rating: 4.6, reviews: 890, featured: true },
      { title: 'Windows 10/11 Pro ключ', desc: 'Лицензионный ключ Windows. Бессрочная активация.', price: 549, oldPrice: 1299, cat: 'software', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 63529, rating: 4.9, reviews: 8900, featured: true },
      { title: 'Minecraft Java + Bedrock ключ', desc: 'Ключ для активации Minecraft Java и Bedrock.', price: 1449, oldPrice: 1899, cat: 'game-keys', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 5600, rating: 4.8, reviews: 2100, featured: true },
      { title: 'Telegram Premium 3/6/12 мес', desc: 'Официальная подписка Telegram Premium.', price: 1119, oldPrice: 1499, cat: 'telegram', type: 'Услуга', region: 'Global', delivery: 'auto', sales: 3200, rating: 4.9, reviews: 1200, featured: true },
      { title: 'Roblox Gift Card 225-10000 Robux', desc: 'Подарочная карта Roblox для покупки Robux.', price: 299, oldPrice: 399, cat: 'virtual-currency', type: 'Карта', region: 'Global', delivery: 'auto', sales: 2800, rating: 4.7, reviews: 560, featured: true },
      { title: 'Discord Nitro 1 месяц', desc: 'Nitro: эмодзи везде, 2 стрима, 500 МБ.', price: 199, oldPrice: 299, cat: 'discord', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 1500, rating: 4.5, reviews: 320, featured: true },
      { title: 'Forza Horizon 6 Steam RU', desc: 'Гифт Forza Horizon 6 с выбором издания.', price: 5199, oldPrice: 5999, cat: 'game-keys', type: 'Гифт', region: 'RU', delivery: 'gift', sales: 751, rating: 4.9, reviews: 420, featured: true },
      { title: 'YouTube Premium 1 месяц', desc: 'Без рекламы, фоновое воспроизведение.', price: 299, oldPrice: 499, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 1800, rating: 4.5, reviews: 450, featured: true },
      { title: 'Apple iTunes Gift Card USD', desc: 'Подарочная карта Apple $2-$100. США.', price: 159, oldPrice: 299, cat: 'subscriptions', type: 'Карта', region: 'US', delivery: 'auto', sales: 2200, rating: 4.8, reviews: 1200, featured: true },
      { title: 'Смена региона Steam Казахстан', desc: 'Профессиональная смена региона Steam.', price: 179, oldPrice: 299, cat: 'steam', type: 'Услуга', region: 'KZ', delivery: 'manual', sales: 4500, rating: 4.9, reviews: 2300, featured: true },
      { title: 'Cursor Pro AI 1 месяц', desc: 'AI-редактор кода Cursor Pro.', price: 1699, oldPrice: 2499, cat: 'software', type: 'Аккаунт', region: 'Global', delivery: 'auto', sales: 1000, rating: 4.8, reviews: 350, featured: true },
      { title: 'PlayStation Turkey PSN Код', desc: 'Пополнение PSN Турция.', price: 428, oldPrice: 599, cat: 'playstation', type: 'Код', region: 'TR', delivery: 'auto', sales: 3100, rating: 4.7, reviews: 890, featured: true },
      { title: 'Telegram Звёзды по @Username', desc: 'Покупка звёзд Telegram по имени.', price: 131, cat: 'telegram', type: 'Услуга', region: 'Global', delivery: 'auto', sales: 5200, rating: 4.9, reviews: 1500, featured: true },
      { title: 'Cyberpunk 2077 Steam ключ', desc: 'Ключ для активации Cyberpunk 2077 в Steam.', price: 1999, oldPrice: 3999, cat: 'game-keys', type: 'Ключ', region: 'RU', delivery: 'auto', sales: 1200, rating: 4.7, reviews: 600, featured: true },
      { title: 'Netflix Premium 1 мес 4K', desc: 'Подписка Netflix Premium на 4 устройства.', price: 899, oldPrice: 1299, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 3800, rating: 4.6, reviews: 1100, featured: true },
      { title: 'Microsoft Office 2021 Pro Plus', desc: 'Лицензия Office на 1 ПК навсегда.', price: 1499, oldPrice: 2999, cat: 'software', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 8900, rating: 4.8, reviews: 3200, featured: true },
      { title: 'Elden Ring Steam RU ключ', desc: 'Ключ для активации Elden Ring.', price: 2999, oldPrice: 4499, cat: 'game-keys', type: 'Ключ', region: 'RU', delivery: 'auto', sales: 2100, rating: 4.9, reviews: 1400, featured: true },
      { title: 'Discord Server Boost 1 мес', desc: 'Буст Discord сервера на 1 месяц.', price: 299, oldPrice: 499, cat: 'discord', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 900, rating: 4.5, reviews: 200, featured: true },
      { title: 'V-Bucks 1000 Fortnite', desc: '1000 V-Bucks для Fortnite.', price: 699, oldPrice: 899, cat: 'virtual-currency', type: 'Код', region: 'Global', delivery: 'auto', sales: 5600, rating: 4.7, reviews: 2300, featured: true },
      { title: 'YouTube Music Premium 1 мес', desc: 'Музыка без рекламы, оффлайн.', price: 179, oldPrice: 299, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 2200, rating: 4.5, reviews: 500, featured: true },
      { title: 'The Witcher 3 Steam ключ', desc: 'Ключ для активации The Witcher 3.', price: 599, oldPrice: 1299, cat: 'game-keys', type: 'Ключ', region: 'RU', delivery: 'auto', sales: 9800, rating: 4.8, reviews: 4500, featured: true },
      { title: 'Red Dead Redemption 2 Steam', desc: 'Гифт Red Dead Redemption 2.', price: 2499, oldPrice: 3999, cat: 'game-keys', type: 'Гифт', region: 'RU', delivery: 'gift', sales: 1800, rating: 4.9, reviews: 1200, featured: true },
      { title: 'Disney+ Premium 1 мес', desc: 'Подписка Disney+ на 4 устройства.', price: 399, oldPrice: 599, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 1500, rating: 4.6, reviews: 400, featured: true },
      { title: 'Xbox Game Pass PC 1 мес', desc: 'Game Pass для ПК.', price: 599, oldPrice: 899, cat: 'xbox', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 6700, rating: 4.7, reviews: 2800, featured: true },
      { title: 'PS Plus Essential 1 мес', desc: 'Подписка PlayStation Plus Essential.', price: 499, oldPrice: 699, cat: 'playstation', type: 'Подписка', region: 'RU', delivery: 'auto', sales: 12000, rating: 4.8, reviews: 5600, featured: true },
      { title: 'ChatGPT Pro подписка 1 месяц', desc: 'Полный доступ к ChatGPT Pro.', price: 4999, oldPrice: 6999, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 800, rating: 4.9, reviews: 300, featured: true },
      { title: 'Windows 11 Home ключ', desc: 'Лицензионный ключ Windows 11 Home.', price: 399, oldPrice: 899, cat: 'software', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 15000, rating: 4.8, reviews: 6000, featured: true },
      { title: 'Steam Gift Card 500₽', desc: 'Подарочная карта Steam 500 рублей.', price: 480, cat: 'steam', type: 'Карта', region: 'RU', delivery: 'auto', sales: 3400, rating: 4.7, reviews: 1200, featured: true },
      { title: 'Steam баланс 1000₽', desc: 'Пополнение Steam на 1000 рублей.', price: 990, cat: 'steam', type: 'Пополнение', region: 'RU', delivery: 'auto', sales: 5600, rating: 4.8, reviews: 2100, featured: true },
      { title: 'Valorant VP 1000', desc: '1000 VP для Valorant.', price: 599, oldPrice: 799, cat: 'virtual-currency', type: 'Код', region: 'Global', delivery: 'auto', sales: 4200, rating: 4.6, reviews: 1800, featured: true },
      { title: 'Office 365 Personal 1 год', desc: 'Подписка Office 365 на 1 год.', price: 1999, oldPrice: 3999, cat: 'software', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 3200, rating: 4.7, reviews: 1500, featured: true },
      { title: 'Telegram Stars 100', desc: '100 звёзд Telegram.', price: 199, cat: 'telegram', type: 'Услуга', region: 'Global', delivery: 'auto', sales: 8900, rating: 4.9, reviews: 3500, featured: true },
      { title: 'Discord Nitro 3 месяца', desc: 'Nitro на 3 месяца.', price: 499, oldPrice: 799, cat: 'discord', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 1200, rating: 4.6, reviews: 450, featured: true },
      { title: 'Baldurs Gate 3 Steam ключ', desc: 'Ключ для Baldurs Gate 3.', price: 3499, oldPrice: 4999, cat: 'game-keys', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 1600, rating: 4.9, reviews: 900, featured: true },
      { title: 'PS Plus Extra 3 мес', desc: 'PlayStation Plus Extra на 3 месяца.', price: 1899, oldPrice: 2499, cat: 'playstation', type: 'Подписка', region: 'TR', delivery: 'auto', sales: 5400, rating: 4.8, reviews: 2200, featured: true },
      { title: 'Xbox Live Gold 12 мес', desc: 'Xbox Live Gold на 12 месяцев.', price: 2499, oldPrice: 3999, cat: 'xbox', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 3100, rating: 4.7, reviews: 1100, featured: true },
      { title: 'Apple Music 1 мес', desc: 'Подписка Apple Music.', price: 199, oldPrice: 299, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 2800, rating: 4.5, reviews: 800, featured: true },
      { title: 'Kaspersky Internet Security 1 год', desc: 'Антивирус на 1 год.', price: 299, oldPrice: 599, cat: 'software', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 4500, rating: 4.6, reviews: 1900, featured: true },
      { title: 'Telegram Premium 12 мес', desc: 'Premium Telegram на год.', price: 1119, oldPrice: 1799, cat: 'telegram', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 2400, rating: 4.9, reviews: 1000, featured: true },
      { title: 'Discord Nitro 1 год', desc: 'Nitro на 12 месяцев.', price: 1499, oldPrice: 2499, cat: 'discord', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 600, rating: 4.7, reviews: 250, featured: true },
      { title: 'Roblox 10000 Robux', desc: '10000 Robux Gift Card.', price: 5999, oldPrice: 7999, cat: 'virtual-currency', type: 'Карта', region: 'Global', delivery: 'auto', sales: 1400, rating: 4.8, reviews: 600, featured: true },
      { title: 'PlayStation Stars 1000', desc: '1000 PlayStation Stars.', price: 399, oldPrice: 599, cat: 'virtual-currency', type: 'Код', region: 'Global', delivery: 'auto', sales: 2100, rating: 4.5, reviews: 700, featured: true },
      { title: 'Steam ключ $10 USA', desc: 'Пополнение Steam $10 (США).', price: 890, cat: 'steam', type: 'Пополнение', region: 'US', delivery: 'auto', sales: 1800, rating: 4.7, reviews: 500, featured: true },
      { title: 'Forza Horizon 5 Steam RU', desc: 'Ключ Forza Horizon 5.', price: 2999, oldPrice: 4499, cat: 'game-keys', type: 'Ключ', region: 'RU', delivery: 'auto', sales: 2800, rating: 4.8, reviews: 1200, featured: true },
      { title: 'Смена региона Steam Турция', desc: 'Профессиональная смена региона.', price: 199, oldPrice: 349, cat: 'steam', type: 'Услуга', region: 'TR', delivery: 'manual', sales: 3800, rating: 4.8, reviews: 1900, featured: true },
    ];

    const productIds = [];
    for (const p of products) {
      const id = nextId('prod');
      productIds.push(id);
      const deliveryData = p.delivery === 'auto'
        ? JSON.stringify(Array.from({ length: 10 }, () => `KEY-${Math.random().toString(36).substring(2, 16).toUpperCase()}`))
        : '';
      await client.query(
        `INSERT INTO products (id, title, description, price, old_price, category_id, seller_id, type, region, delivery_type, stock_count, sold_count, rating, rating_count, is_featured, delivery_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [id, p.title, p.desc, p.price, p.oldPrice || null, catIds[p.cat], pick([seller1Id, seller2Id, seller3Id]), p.type, p.region, p.delivery, 100, p.sales, p.rating, p.reviews, p.featured, deliveryData]
      );
    }

    // 20 Orders in different states
    const orderStatuses = ['pending', 'paid', 'delivered', 'completed', 'completed', 'completed', 'disputed', 'refunded', 'cancelled'];
    for (let i = 0; i < 20; i++) {
      const status = orderStatuses[i % orderStatuses.length];
      const amount = Math.floor(Math.random() * 5000) + 200;
      const commission = Math.round(amount * 0.08);
      await client.query(
        `INSERT INTO orders (id, buyer_id, product_id, seller_id, amount, commission, seller_amount, status, delivery_data, buyer_confirmed, seller_confirmed, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          nextId('order'),
          pick([buyer1Id, buyer2Id]),
          pick(productIds),
          pick([seller1Id, seller2Id, seller3Id]),
          amount,
          commission,
          amount - commission,
          status,
          status === 'completed' || status === 'delivered' ? `KEY-${Math.random().toString(36).substring(2, 12).toUpperCase()}` : '',
          status === 'completed',
          status === 'completed',
          new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        ]
      );
    }

    // 10 Reviews
    const reviewTexts = [
      'Все отлично, быстрая выдача! Рекомендую продавца.',
      'Ключ пришёл мгновенно, работает без проблем.',
      'Хороший продавец, все вопросы решил быстро.',
      'Покупал уже несколько раз — всегда всё ок.',
      'Быстрая доставка, ключ активировался без проблем.',
      'Отличные цены, лучше чем у других.',
      'Продавец ответил за 2 минуты, всё объяснил.',
      'Работает автоматически 24/7, очень удобно.',
      'Подписка активировалась сразу, спасибо!',
      'Лучший магазин на площадке, беру только здесь.',
    ];
    for (let i = 0; i < 10; i++) {
      await client.query(
        `INSERT INTO reviews (product_id, buyer_id, seller_id, rating, comment, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          pick(productIds),
          pick([buyer1Id, buyer2Id]),
          pick([seller1Id, seller2Id, seller3Id]),
          Math.random() > 0.2 ? 5 : 4,
          reviewTexts[i],
          new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        ]
      );
    }

    // 5 Flash Sales
    for (let i = 0; i < 5; i++) {
      const productId = pick(productIds);
      const product = await client.query('SELECT price FROM products WHERE id = $1', [productId]);
      if (product.rows[0]) {
        const salePrice = Math.round(Number(product.rows[0].price) * 0.7);
        await client.query(
          `INSERT INTO flash_sales (product_id, sale_price, start_time, end_time, max_quantity, sold_quantity, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            productId,
            salePrice,
            new Date(Date.now() - 2 * 86400000).toISOString(),
            new Date(Date.now() + 5 * 86400000).toISOString(),
            50,
            Math.floor(Math.random() * 30),
            'active',
          ]
        );
      }
    }

    // 3 Bundles
    const bundleNames = ['Игровой набор', 'Подписочный пакет', 'Программный комплект'];
    const bundleDiscounts = [15, 20, 25];
    for (let i = 0; i < 3; i++) {
      const res = await client.query(
        `INSERT INTO bundles (name, discount_percent, min_items, is_active) VALUES ($1, $2, 2, true) RETURNING id`,
        [bundleNames[i], bundleDiscounts[i]]
      );
      const bundleId = res.rows[0].id;
      const bundleProducts = productIds.slice(i * 3, i * 3 + 4);
      for (const pid of bundleProducts) {
        await client.query(
          'INSERT INTO bundle_products (bundle_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [bundleId, pid]
        );
      }
    }

    // 10 Gift Cards
    for (let i = 0; i < 10; i++) {
      const code = `KZ-GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await client.query(
        `INSERT INTO gift_cards (code, balance, currency, buyer_id, status, expires_at)
         VALUES ($1,$2,'RUB',$3,$4,$5)`,
        [
          code,
          pick([500, 1000, 2000, 5000]),
          Math.random() > 0.5 ? pick([buyer1Id, buyer2Id]) : null,
          'active',
          new Date(Date.now() + 180 * 86400000).toISOString(),
        ]
      );
    }

    // Blog Posts
    const blogPosts = [
      { title: 'Как безопасно покупать цифровые товары', slug: 'how-to-buy-digital-safely', category: 'guides', excerpt: 'Советы по безопасной покупке на маркетплейсах.' },
      { title: 'Обзор лучших подписок 2026', slug: 'best-subscriptions-2026', category: 'reviews', excerpt: 'Рейтинг лучших цифровых подписок.' },
      { title: 'Steam vs Epic Games: сравнение', slug: 'steam-vs-epic', category: 'news', excerpt: 'Что выгоднее для покупателя?' },
      { title: 'Как заработать на продаже ключей', slug: 'how-to-sell-keys', category: 'tips', excerpt: 'Гайд для начинающих продавцов.' },
      { title: 'Топ-10 игр для Xbox Game Pass', slug: 'top-10-xbox-games', category: 'reviews', excerpt: 'Лучшие игры в подписке.' },
    ];
    for (const post of blogPosts) {
      await client.query(
        `INSERT INTO blog_posts (title, slug, content, excerpt, author_id, category, is_published, views, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8)`,
        [
          post.title,
          post.slug,
          `## ${post.title}\n\n${post.excerpt}\n\nПодробный обзор и рекомендации.`,
          post.excerpt,
          adminId,
          post.category,
          Math.floor(Math.random() * 5000) + 100,
          new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
        ]
      );
    }

    // Promo Codes
    const promos = [
      ['WELCOME10', 10, 0, 1000, 100, 0, 0],
      ['KEYZO2026', 15, 0, 500, 500, 0, 0],
      ['SAVE500', 0, 500, 100, 3000, 0, 0],
      ['SALE20', 20, 0, -1, 0, 200, 0],
      ['SPRING15', 15, 0, 200, 500, 100, 0],
    ];
    for (const p of promos) {
      await client.query(
        `INSERT INTO promo_codes (code, discount_percent, discount_amount, max_uses, min_order_amount, max_discount, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW() + INTERVAL '30 days')`,
        p
      );
    }

    // Settings
    const settings = [
      ['commission_percent', '8'],
      ['escrow_hours', '24'],
      ['min_withdrawal', '100'],
      ['site_name', 'Keyzo.pro'],
    ];
    for (const [key, value] of settings) {
      await client.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, value]);
    }

    await client.query('COMMIT');
    console.log('Demo seed completed');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Demo seed failed:', e);
    throw e;
  } finally {
    client.release();
  }
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemo()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDemo;
