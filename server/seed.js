import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { get, getAll, run, transaction } from './db.js';

function nextId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

export async function seedDatabase() {
  const existing = await get('SELECT id FROM users LIMIT 1');
  if (existing) { console.log('Database already seeded'); return; }

  console.log('Seeding database...');
  const hash = bcrypt.hashSync('password123', 10);

  await transaction(async (client) => {
    const adminId = uuidv4();
    const sellerId = uuidv4();
    const seller2Id = uuidv4();
    const userId = uuidv4();

    await client.query(`INSERT INTO users (id, username, email, password, balance, role, is_verified, bio, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [adminId, 'Admin', 'admin@keyzo.pro', hash, 0, 'admin', true, 'Администратор платформы Keyzo.pro', 'ADMIN001']);
    await client.query(`INSERT INTO users (id, username, email, password, balance, role, is_verified, bio, telegram, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [sellerId, 'DigitalShop', 'shop@keyzo.pro', hash, 50000, 'seller', true, 'Продажа игровых ключей и подписок. Работаю 24/7.', '@digitalshop', 'SHOP001']);
    await client.query(`INSERT INTO users (id, username, email, password, balance, role, is_verified, bio, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [seller2Id, 'GameZone', 'game@keyzo.pro', hash, 25000, 'seller', true, 'Лучшие цены на игры и подписки', 'GAME001']);
    await client.query(`INSERT INTO users (id, username, email, password, balance, role, loyalty_balance, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'Player1', 'player@test.com', hash, 10000, 'user', 500, 'PLAY001']);

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
      await client.query('INSERT INTO categories (name, slug, icon, description, sort_order) VALUES ($1, $2, $3, $4, $5)', c);
    }

    const catRows = (await client.query('SELECT id, slug FROM categories')).rows;
    const catIds = {};
    catRows.forEach(r => catIds[r.slug] = r.id);

    const products = [
      { title: 'STEAM РФ-СНГ RUB-KZT-UAH 24/7', desc: 'Быстрое пополнение Steam кошелька. Автоматическая выдача 24/7.', price: 106, cat: 'steam', type: 'Пополнение', region: 'RU/CIS', delivery: 'auto', sales: 4545053, rating: 4.9, reviews: 12580, featured: true },
      { title: 'Пополнение Steam Казахстан KZT', desc: 'Автоматическое пополнение Steam кошелька в казахстанских тенге.', price: 17, cat: 'steam', type: 'Пополнение', region: 'KZ', delivery: 'auto', sales: 836952, rating: 4.8, reviews: 3200, featured: true },
      { title: 'ChatGPT Plus подписка 1 месяц', desc: 'Полный доступ к ChatGPT Plus через токен. Быстрая активация.', price: 1899, old_price: 2499, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 2500, rating: 4.7, reviews: 890, featured: true },
      { title: 'PS Plus Essential Extra Deluxe', desc: 'Подписка PlayStation Plus на 1/3/12 месяцев. Турция.', price: 849, old_price: 1199, cat: 'playstation', type: 'Подписка', region: 'TR', delivery: 'auto', sales: 26629, rating: 4.8, reviews: 1890, featured: true },
      { title: 'GTA V Premium Enhanced + Legacy', desc: 'Steam гифт с полным доступом к GTA V Online.', price: 1674, old_price: 3145, cat: 'game-keys', type: 'Гифт', region: 'RU', delivery: 'gift', sales: 3500, rating: 4.9, reviews: 2100, featured: true },
      { title: 'Xbox Game Pass Ultimate 1-15 мес', desc: 'Доступ к Game Pass Ultimate. Игры на консоль и ПК.', price: 1049, old_price: 1999, cat: 'xbox', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 24855, rating: 4.7, reviews: 3500, featured: true },
      { title: 'Spotify Premium личный 1 мес', desc: 'Музыка без рекламы, оффлайн, высокое качество.', price: 229, old_price: 399, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 4200, rating: 4.6, reviews: 890, featured: false },
      { title: 'Windows 10/11 Pro ключ', desc: 'Лицензионный ключ Windows. Бессрочная активация.', price: 549, old_price: 1299, cat: 'software', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 63529, rating: 4.9, reviews: 8900, featured: true },
      { title: 'Minecraft Java + Bedrock ключ', desc: 'Ключ для активации Minecraft Java и Bedrock.', price: 1449, old_price: 1899, cat: 'game-keys', type: 'Ключ', region: 'Global', delivery: 'auto', sales: 5600, rating: 4.8, reviews: 2100, featured: true },
      { title: 'Telegram Premium 3/6/12 мес', desc: 'Официальная подписка Telegram Premium.', price: 1119, old_price: 1499, cat: 'telegram', type: 'Услуга', region: 'Global', delivery: 'auto', sales: 3200, rating: 4.9, reviews: 1200, featured: false },
      { title: 'Roblox Gift Card 225-10000 Robux', desc: 'Подарочная карта Roblox для покупки Robux.', price: 299, old_price: 399, cat: 'virtual-currency', type: 'Карта', region: 'Global', delivery: 'auto', sales: 2800, rating: 4.7, reviews: 560, featured: false },
      { title: 'Discord Nitro 1 месяц', desc: 'Nitro: эмодзи везде, 2 стрима, 500 МБ.', price: 199, old_price: 299, cat: 'discord', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 1500, rating: 4.5, reviews: 320, featured: false },
      { title: 'Forza Horizon 6 Steam RU', desc: 'Гифт Forza Horizon 6 с выбором издания.', price: 5199, old_price: 5999, cat: 'game-keys', type: 'Гифт', region: 'RU', delivery: 'gift', sales: 751, rating: 4.9, reviews: 420, featured: true },
      { title: 'YouTube Premium 1 месяц', desc: 'Без рекламы, фоновое воспроизведение.', price: 299, old_price: 499, cat: 'subscriptions', type: 'Подписка', region: 'Global', delivery: 'auto', sales: 1800, rating: 4.5, reviews: 450, featured: false },
      { title: 'Apple iTunes Gift Card USD', desc: 'Подарочная карта Apple $2-$100. США.', price: 159, old_price: 299, cat: 'subscriptions', type: 'Карта', region: 'US', delivery: 'auto', sales: 2200, rating: 4.8, reviews: 1200, featured: false },
      { title: 'Смена региона Steam Казахстан', desc: 'Профессиональная смена региона Steam.', price: 179, old_price: 299, cat: 'steam', type: 'Услуга', region: 'KZ', delivery: 'manual', sales: 4500, rating: 4.9, reviews: 2300, featured: true },
      { title: 'Cursor Pro AI 1 месяц', desc: 'AI-редактор кода Cursor Pro.', price: 1699, old_price: 2499, cat: 'software', type: 'Аккаунт', region: 'Global', delivery: 'auto', sales: 1000, rating: 4.8, reviews: 350, featured: true },
      { title: 'PlayStation Turkey PSN Код', desc: 'Пополнение PSN Турция.', price: 428, old_price: 599, cat: 'playstation', type: 'Код', region: 'TR', delivery: 'auto', sales: 3100, rating: 4.7, reviews: 890, featured: false },
      { title: 'Telegram Звёзды по @Username', desc: 'Покупка звёзд Telegram по имени.', price: 131, cat: 'telegram', type: 'Услуга', region: 'Global', delivery: 'auto', sales: 5200, rating: 4.9, reviews: 1500, featured: false },
    ];

    for (const p of products) {
      const id = nextId('prod');
      const deliveryData = p.delivery === 'auto' ? JSON.stringify(Array.from({length: 5}, () => `KEY-${Math.random().toString(36).substring(2,16).toUpperCase()}`)) : '';
      await client.query(`INSERT INTO products (id, title, description, price, old_price, category_id, seller_id, type, region, delivery_type, stock_count, sold_count, rating, rating_count, is_featured, delivery_data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [id, p.title, p.desc, p.price, p.old_price || null, catIds[p.cat], sellerId, p.type, p.region, p.delivery, 100, p.sales, p.rating, p.reviews, p.featured, deliveryData]);
    }

    await client.query(`INSERT INTO promo_codes (code, discount_percent, max_uses, min_order_amount, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`, ['WELCOME10', 10, 1000, 100]);
    await client.query(`INSERT INTO promo_codes (code, discount_percent, max_uses, min_order_amount, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`, ['KEYZO2026', 15, 500, 500]);
    await client.query(`INSERT INTO promo_codes (code, discount_amount, max_uses, min_order_amount, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '60 days')`, ['SAVE500', 500, 100, 3000]);

    await client.query(`INSERT INTO settings (key, value) VALUES ('commission_percent', '8') ON CONFLICT (key) DO NOTHING`);
    await client.query(`INSERT INTO settings (key, value) VALUES ('escrow_hours', '24') ON CONFLICT (key) DO NOTHING`);
    await client.query(`INSERT INTO settings (key, value) VALUES ('min_withdrawal', '100') ON CONFLICT (key) DO NOTHING`);
    await client.query(`INSERT INTO settings (key, value) VALUES ('site_name', 'Keyzo.pro') ON CONFLICT (key) DO NOTHING`);
  });

  console.log('Database seeded successfully');
}
