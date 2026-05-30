import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool, query, get } from './db.js';

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

const SELLER_NAMES = [
  'DigitalKeys24', 'GameShop_RU', 'KeyMaster', 'ProKeys', 'DigitalOcean',
  'KeyZone', 'GameZone', 'SoftMarket', 'LicenseKing', 'KeyStore',
  'DigitalShop', 'GameWorld', 'KeyPoint', 'SoftZone', 'LicensePro',
  'KeyBase', 'GameMarket', 'DigitalBase', 'KeyLink', 'SoftKey',
  'GameKey24', 'KeyOnline', 'DigitalPlus', 'GameBase', 'KeyPro',
  'SoftShop', 'LicenseShop', 'KeyMarket', 'GameSoft', 'DigitalLink',
  'KeyShop24', 'GameLink', 'DigitalWorld', 'KeyWorld', 'SoftBase',
  'GamePro', 'KeyStar', 'DigitalStar', 'GameStar', 'KeyCity',
  'DigitalCity', 'GameCity', 'KeyZone24', 'DigitalZone', 'GameZone24',
  'KeyHouse', 'DigitalHouse', 'GameHouse', 'KeyStore24', 'DigitalStore'
];

const BIO_TEMPLATES = [
  'Продажа цифровых товаров с {years} летним опытом. Быстрая выдача, поддержка 24/7.',
  'Официальный продавец лицензионных ключей. Гарантия на все товары.',
  'Автоматическая выдача заказов. Низкие цены, высокое качество.',
  'Продавец с репутацией {rating}★. Более {sales} успешных продаж.',
  'Только оригинальные ключи и подписки. Возврат гарантирован.',
  'Профессиональный подход к каждому клиенту. Работаем без выходных.',
  'Лицензионное ПО и игровые ключи. Все товары проверены.',
  'Мгновенная доставка после оплаты. Поддержка в Telegram.',
];

const CATEGORIES = [
  { name: 'Steam', slug: 'steam', icon: '🎮', description: 'Пополнение Steam, ключи, гифты' },
  { name: 'PlayStation', slug: 'playstation', icon: '🎯', description: 'PS Plus, игры, пополнение PSN' },
  { name: 'Xbox', slug: 'xbox', icon: '🟢', description: 'Game Pass, Xbox Live' },
  { name: 'Подписки', slug: 'subscriptions', icon: '⭐', description: 'ChatGPT, Spotify, Netflix, YouTube' },
  { name: 'Игровые ключи', slug: 'game-keys', icon: '🔑', description: 'Ключи Steam, Epic, GOG' },
  { name: 'Игровые аккаунты', slug: 'game-accounts', icon: '👤', description: 'Готовые аккаунты' },
  { name: 'Виртуальная валюта', slug: 'virtual-currency', icon: '💰', description: 'Robux, V-Bucks, монеты' },
  { name: 'Программы', slug: 'software', icon: '💻', description: 'Windows, Office, антивирусы' },
  { name: 'Telegram', slug: 'telegram', icon: '✈️', description: 'Premium, звёзды, буст' },
  { name: 'Discord', slug: 'discord', icon: '🤖', description: 'Nitro, буст серверов' },
];

const PRODUCT_TEMPLATES = {
  steam: [
    { title: 'STEAM РФ-СНГ RUB-KZT-UAH 24/7', price: 106, region: 'RU/CIS', type: 'Пополнение' },
    { title: 'Пополнение Steam Казахстан KZT', price: 17, region: 'KZ', type: 'Пополнение' },
    { title: 'STEAM Баланс $5 USD', price: 450, region: 'Global', type: 'Пополнение' },
    { title: 'STEAM Баланс €5 EUR', price: 490, region: 'Global', type: 'Пополнение' },
    { title: 'Steam Gift Card 500₽', price: 480, region: 'RU', type: 'Карта' },
    { title: 'Смена региона Steam Казахстан', price: 179, region: 'KZ', type: 'Услуга' },
    { title: 'Steam ключ $10 USA', price: 890, region: 'US', type: 'Пополнение' },
    { title: 'Steam баланс 1000₽', price: 990, region: 'RU', type: 'Пополнение' },
  ],
  playstation: [
    { title: 'PS Plus Essential 1 мес', price: 499, region: 'RU', type: 'Подписка' },
    { title: 'PS Plus Extra 3 мес', price: 1899, region: 'TR', type: 'Подписка' },
    { title: 'PS Plus Deluxe 12 мес', price: 5499, region: 'TR', type: 'Подписка' },
    { title: 'PlayStation Turkey PSN Код 100 TRY', price: 428, region: 'TR', type: 'Код' },
    { title: 'PS Plus Premium 1 мес Турция', price: 849, region: 'TR', type: 'Подписка' },
    { title: 'Пополнение PSN 500₽', price: 480, region: 'RU', type: 'Пополнение' },
  ],
  xbox: [
    { title: 'Xbox Game Pass Ultimate 1 мес', price: 1049, region: 'Global', type: 'Подписка' },
    { title: 'Xbox Game Pass Ultimate 3 мес', price: 2899, region: 'Global', type: 'Подписка' },
    { title: 'Xbox Game Pass PC 1 мес', price: 599, region: 'Global', type: 'Подписка' },
    { title: 'Xbox Live Gold 12 мес', price: 2499, region: 'Global', type: 'Подписка' },
    { title: 'Xbox Game Pass 15 мес', price: 4999, region: 'Global', type: 'Подписка' },
  ],
  subscriptions: [
    { title: 'ChatGPT Plus подписка 1 месяц', price: 1899, region: 'Global', type: 'Подписка' },
    { title: 'Spotify Premium личный 1 мес', price: 229, region: 'Global', type: 'Подписка' },
    { title: 'YouTube Premium 1 месяц', price: 299, region: 'Global', type: 'Подписка' },
    { title: 'Netflix Premium 1 мес 4K', price: 899, region: 'Global', type: 'Подписка' },
    { title: 'Apple Music 1 мес', price: 199, region: 'Global', type: 'Подписка' },
    { title: 'YouTube Music Premium 1 мес', price: 179, region: 'Global', type: 'Подписка' },
    { title: 'Disney+ Premium 1 мес', price: 399, region: 'Global', type: 'Подписка' },
    { title: 'ChatGPT Pro подписка 1 месяц', price: 4999, region: 'Global', type: 'Подписка' },
  ],
  'game-keys': [
    { title: 'GTA V Premium Enhanced + Legacy', price: 1674, region: 'RU', type: 'Гифт' },
    { title: 'Minecraft Java + Bedrock ключ', price: 1449, region: 'Global', type: 'Ключ' },
    { title: 'Forza Horizon 6 Steam RU', price: 5199, region: 'RU', type: 'Гифт' },
    { title: 'Cyberpunk 2077 Steam ключ', price: 1999, region: 'RU', type: 'Ключ' },
    { title: 'Red Dead Redemption 2 Steam', price: 2499, region: 'RU', type: 'Гифт' },
    { title: 'Elden Ring Steam RU ключ', price: 2999, region: 'RU', type: 'Ключ' },
    { title: 'Baldurs Gate 3 Steam ключ', price: 3499, region: 'Global', type: 'Ключ' },
    { title: 'The Witcher 3 Steam ключ', price: 599, region: 'RU', type: 'Ключ' },
  ],
  'game-accounts': [
    { title: 'Аккаунт Steam Level 50+', price: 4999, region: 'Global', type: 'Аккаунт' },
    { title: 'Аккаунт Epic Games 50+ игр', price: 9999, region: 'Global', type: 'Аккаунт' },
    { title: 'Аккаунт Netflix Premium', price: 1999, region: 'Global', type: 'Аккаунт' },
    { title: 'Аккаунт Spotify с плейлистами', price: 599, region: 'Global', type: 'Аккаунт' },
  ],
  'virtual-currency': [
    { title: 'Roblox Gift Card 225 Robux', price: 299, region: 'Global', type: 'Карта' },
    { title: 'V-Bucks 1000 Fortnite', price: 699, region: 'Global', type: 'Код' },
    { title: 'Roblox 10000 Robux', price: 5999, region: 'Global', type: 'Карта' },
    { title: 'PlayStation Stars 1000', price: 399, region: 'Global', type: 'Код' },
    { title: 'Valorant VP 1000', price: 599, region: 'Global', type: 'Код' },
  ],
  software: [
    { title: 'Windows 10/11 Pro ключ', price: 549, region: 'Global', type: 'Ключ' },
    { title: 'Microsoft Office 2021 Pro Plus', price: 1499, region: 'Global', type: 'Ключ' },
    { title: 'Cursor Pro AI 1 месяц', price: 1699, region: 'Global', type: 'Аккаунт' },
    { title: 'Windows 11 Home ключ', price: 399, region: 'Global', type: 'Ключ' },
    { title: 'Office 365 Personal 1 год', price: 1999, region: 'Global', type: 'Подписка' },
    { title: 'Kaspersky Internet Security 1 год', price: 299, region: 'Global', type: 'Ключ' },
  ],
  telegram: [
    { title: 'Telegram Premium 3 мес', price: 399, region: 'Global', type: 'Подписка' },
    { title: 'Telegram Premium 6 мес', price: 699, region: 'Global', type: 'Подписка' },
    { title: 'Telegram Premium 12 мес', price: 1119, region: 'Global', type: 'Подписка' },
    { title: 'Telegram Звёзды по @Username', price: 131, region: 'Global', type: 'Услуга' },
    { title: 'Telegram Stars 100', price: 199, region: 'Global', type: 'Услуга' },
  ],
  discord: [
    { title: 'Discord Nitro 1 месяц', price: 199, region: 'Global', type: 'Подписка' },
    { title: 'Discord Nitro 3 месяца', price: 499, region: 'Global', type: 'Подписка' },
    { title: 'Discord Nitro 1 год', price: 1499, region: 'Global', type: 'Подписка' },
    { title: 'Discord Server Boost 1 мес', price: 299, region: 'Global', type: 'Подписка' },
  ],
};

const REVIEW_COMMENTS = [
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
  'Немного ждал выдачу, но в итоге всё получил.',
  'Всё работает, продавец честный.',
  'Хороший товар, но цена могла бы быть ниже.',
  'Быстро и надёжно, пять звёзд!',
  'Проблема с активацией, но продавец помог решить.',
  'Рекомендую! Всё чётко и без задержек.',
  'Покупал ключ — пришёл за секунду, всё работает.',
  'Отличный сервис, буду покупать ещё.',
  'Продавец профессионал, всё на высшем уровне.',
  'Товар соответствует описанию, всё супер.',
];

const BLOG_TITLES = [
  'Как выбрать идеальный VPN для игр',
  'Обзор лучших подписок 2026 года',
  'Steam vs Epic Games: что выгоднее',
  'Как безопасно покупать цифровые товары',
  'Лучшие игры для Xbox Game Pass',
  'Как работает эскроу на маркетплейсе',
  'Обзор ChatGPT Plus: стоит ли покупать',
  'Как заработать на продаже игровых ключах',
  'Безопасность аккаунтов: советы',
  'Топ-10 подписок для студентов',
];

const BLOG_CONTENT = `## Введение

Цифровые товары становятся всё популярнее. В этой статье мы рассмотрим ключевые аспекты покупки и продажи на маркетплейсах.

## Основные преимущества

1. **Быстрая выдача** — большинство товаров выдаётся автоматически
2. **Низкие цены** — маркетплейс конкурирует за покупателей
3. **Гарантия возврата** — система эскроу защищает обе стороны

## Советы для покупателей

- Всегда проверяйте рейтинг продавца
- Читайте отзывы перед покупкой
- Используйте промокоды для скидок

## Заключение

Цифровые товары — это удобно и безопасно при правильном подходе.`;

const PROMO_CODES = [
  'WELCOME10', 'KEYZO2026', 'SAVE500', 'SALE20', 'SPRING15',
  'SUMMER25', 'WINTER30', 'NEWYEAR', 'CYBERMONDAY', 'BLACKFRIDAY',
  'VALENTINE', 'EASTER10', 'BACK2SCHOOL', 'GAMER20', 'PROSELLER',
  'FIRSTBUY', 'LOYALTY50', 'BONUS100', 'MEGADEAL', 'ULTRA25',
  'FLASH35', 'MEGA50', 'SUPER40', 'ULTRA60', 'PREMIUM70',
  'VIP100', 'TOP200', 'BEST300', 'KING400', 'ROYAL500',
];

export async function seedLarge() {
  const existing = await get('SELECT COUNT(*)::int as c FROM users');
  if (existing && existing.c > 5) {
    console.log('Database already has data. Skipping large seed.');
    return;
  }

  console.log('Seeding large dataset...');
  const hash = bcrypt.hashSync('password123', 10);
  const startTime = Date.now();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Categories
    for (const c of CATEGORIES) {
      await client.query(
        'INSERT INTO categories (name, slug, icon, description, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING',
        [c.name, c.slug, c.icon, c.description, CATEGORIES.indexOf(c) + 1]
      );
    }
    const catRows = (await client.query('SELECT id, slug FROM categories')).rows;
    const catIds = {};
    catRows.forEach(r => catIds[r.slug] = r.id);

    // Admin
    const adminId = uuidv4();
    await client.query(
      'INSERT INTO users (id, username, email, password, balance, role, is_verified, bio, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (email) DO NOTHING',
      [adminId, 'Admin', 'admin@keyzo.pro', hash, 0, 'admin', true, 'Администратор платформы Keyzo.pro', 'ADMIN001']
    );

    // Sellers
    const sellerIds = [];
    for (let i = 0; i < 50; i++) {
      const sellerId = uuidv4();
      sellerIds.push(sellerId);
      const rating = randFloat(4.0, 5.0);
      const sales = rand(10, 50000);
      const revenue = sales * rand(100, 3000);
      const years = rand(1, 5);
      const bio = pick(BIO_TEMPLATES)
        .replace('{years}', years)
        .replace('{rating}', rating)
        .replace('{sales}', sales.toLocaleString());
      await client.query(
        `INSERT INTO users (id, username, email, password, balance, role, is_verified, verification_badge, bio, telegram, total_sales, total_revenue, rating, rating_count, referral_code)
         VALUES ($1, $2, $3, $4, $5, 'seller', $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (email) DO NOTHING`,
        [
          sellerId,
          SELLER_NAMES[i % SELLER_NAMES.length] + (i >= SELLER_NAMES.length ? i : ''),
          `seller${i}@keyzo.pro`,
          hash,
          rand(0, 100000),
          i < 40,
          i < 30 ? 'Verified Seller' : '',
          bio,
          `@seller${i}`,
          sales,
          revenue,
          rating,
          rand(5, 5000),
          `SEL${String(i).padStart(3, '0')}`,
        ]
      );
    }

    // Buyers
    const buyerIds = [];
    for (let i = 0; i < 100; i++) {
      const buyerId = uuidv4();
      buyerIds.push(buyerId);
      await client.query(
        `INSERT INTO users (id, username, email, password, balance, role, loyalty_balance, referral_code)
         VALUES ($1, $2, $3, $4, $5, 'user', $6, $7) ON CONFLICT (email) DO NOTHING`,
        [
          buyerId,
          `Buyer${i}_${Math.random().toString(36).slice(2, 6)}`,
          `buyer${i}@test.com`,
          hash,
          rand(1000, 100000),
          rand(0, 5000),
          `BUY${String(i).padStart(3, '0')}`,
        ]
      );
    }

    // Products
    const productIds = [];
    const allSlugs = Object.keys(PRODUCT_TEMPLATES);
    for (let i = 0; i < 1200; i++) {
      const catSlug = pick(allSlugs);
      const templates = PRODUCT_TEMPLATES[catSlug];
      const template = pick(templates);
      const id = nextId('prod');
      productIds.push(id);
      const sellerId = pick(sellerIds);
      const stock = rand(1, 500);
      const sold = rand(0, 100000);
      const priceVariation = randFloat(0.8, 1.2);
      const price = Math.max(10, Math.round(template.price * priceVariation));
      const oldPrice = Math.random() > 0.6 ? Math.round(price * randFloat(1.1, 1.5)) : null;
      const rating = randFloat(4.0, 5.0);
      const ratingCount = rand(0, 10000);
      const viewCount = rand(100, 500000);
      const isFeatured = i < 100;
      const deliveryType = Math.random() > 0.85 ? 'manual' : 'auto';
      const deliveryData = deliveryType === 'auto'
        ? JSON.stringify(Array.from({ length: rand(5, 20) }, () => `KEY-${Math.random().toString(36).substring(2, 16).toUpperCase()}`))
        : '';

      await client.query(
        `INSERT INTO products (id, title, description, price, old_price, category_id, seller_id, type, region, delivery_type, stock_count, sold_count, rating, rating_count, view_count, is_featured, delivery_data, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          id,
          template.title + (i > 50 ? ` #${i}` : ''),
          `Описание товара: ${template.title}. Автоматическая выдача 24/7. Гарантия на все товары.`,
          price,
          oldPrice,
          catIds[catSlug],
          sellerId,
          template.type,
          template.region,
          deliveryType,
          stock,
          sold,
          rating,
          ratingCount,
          viewCount,
          isFeatured,
          deliveryData,
          JSON.stringify([catSlug, template.type.toLowerCase(), template.region.toLowerCase()]),
        ]
      );
    }

    // Orders
    const orderStatuses = ['pending', 'paid', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled'];
    const statusWeights = [5, 10, 10, 60, 5, 5, 5];
    const totalWeight = statusWeights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < 600; i++) {
      let randVal = Math.random() * totalWeight;
      let status = orderStatuses[0];
      for (let j = 0; j < statusWeights.length; j++) {
        randVal -= statusWeights[j];
        if (randVal <= 0) { status = orderStatuses[j]; break; }
      }

      const buyerId = pick(buyerIds);
      const sellerId = pick(sellerIds);
      const amount = rand(100, 10000);
      const commission = Math.round(amount * 0.08);
      const sellerAmount = amount - commission;
      const daysAgo = rand(0, 90);
      const createdDate = new Date(Date.now() - daysAgo * 86400000);

      await client.query(
        `INSERT INTO orders (id, buyer_id, product_id, seller_id, amount, commission, seller_amount, status, delivery_data, buyer_confirmed, seller_confirmed, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
        [
          nextId('order'),
          buyerId,
          pick(productIds),
          sellerId,
          amount,
          commission,
          sellerAmount,
          status,
          status === 'delivered' || status === 'completed' ? `KEY-${Math.random().toString(36).substring(2, 16).toUpperCase()}` : '',
          status === 'completed',
          status === 'completed',
          createdDate.toISOString(),
        ]
      );
    }

    // Reviews
    for (let i = 0; i < 300; i++) {
      const rating = Math.random() > 0.15 ? rand(4, 5) : rand(1, 3);
      await client.query(
        `INSERT INTO reviews (product_id, buyer_id, seller_id, rating, comment, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          pick(productIds),
          pick(buyerIds),
          pick(sellerIds),
          rating,
          pick(REVIEW_COMMENTS),
          new Date(Date.now() - rand(0, 90) * 86400000).toISOString(),
        ]
      );
    }

    // Promo codes
    for (let i = 0; i < 100; i++) {
      const code = PROMO_CODES[i % PROMO_CODES.length] + (i >= PROMO_CODES.length ? rand(1, 99) : '');
      const discountPercent = Math.random() > 0.5 ? rand(5, 50) : 0;
      const discountAmount = discountPercent === 0 ? rand(50, 1000) : 0;
      await client.query(
        `INSERT INTO promo_codes (code, discount_percent, discount_amount, max_uses, used_count, min_order_amount, max_discount, expires_at, is_active, seller_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          code.toUpperCase(),
          discountPercent,
          discountAmount,
          rand(10, 1000),
          rand(0, 50),
          rand(0, 1000),
          rand(0, 500),
          new Date(Date.now() + rand(1, 180) * 86400000).toISOString(),
          Math.random() > 0.2,
          pick(sellerIds),
        ]
      );
    }

    // Flash sales
    for (let i = 0; i < 20; i++) {
      const productId = pick(productIds);
      const product = await client.query('SELECT price FROM products WHERE id = $1', [productId]);
      if (product.rows[0]) {
        const salePrice = Math.round(Number(product.rows[0].price) * randFloat(0.5, 0.8));
        await client.query(
          `INSERT INTO flash_sales (product_id, sale_price, start_time, end_time, max_quantity, sold_quantity, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            productId,
            salePrice,
            new Date(Date.now() - rand(1, 5) * 86400000).toISOString(),
            new Date(Date.now() + rand(1, 30) * 86400000).toISOString(),
            rand(10, 100),
            rand(0, 50),
            pick(['active', 'active', 'expired']),
          ]
        );
      }
    }

    // Gift cards
    for (let i = 0; i < 30; i++) {
      const code = `KZ-GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await client.query(
        `INSERT INTO gift_cards (code, balance, currency, buyer_id, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          code,
          pick([500, 1000, 2000, 5000, 10000]),
          'RUB',
          Math.random() > 0.3 ? pick(buyerIds) : null,
          pick(['active', 'active', 'active', 'redeemed']),
          new Date(Date.now() + rand(30, 365) * 86400000).toISOString(),
        ]
      );
    }

    // Blog posts
    for (let i = 0; i < 10; i++) {
      const slug = BLOG_TITLES[i].toLowerCase().replace(/[^a-zа-я0-9]+/g, '-').replace(/-+/g, '-');
      await client.query(
        `INSERT INTO blog_posts (title, slug, content, excerpt, author_id, category, is_published, views, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
        [
          BLOG_TITLES[i],
          slug + '-' + i,
          BLOG_CONTENT,
          BLOG_TITLES[i].slice(0, 100),
          adminId,
          pick(['guides', 'news', 'reviews', 'tips']),
          rand(100, 10000),
          new Date(Date.now() - rand(1, 60) * 86400000).toISOString(),
        ]
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
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Large seed completed in ${duration}s`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', e);
    throw e;
  } finally {
    client.release();
  }
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedLarge()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedLarge;
