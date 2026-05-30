import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer } from 'http';
import * as OTPAuth from 'otpauth';
import { get, getAll, run, transaction } from './db.js';
import migrate from './migrate.js';
import { seedDatabase } from './seed.js';
import { rateLimit, cacheMiddleware, clearCache } from './middleware.js';
import logger, { requestLogger, errorLogger } from './logger.js';
import { securityMiddleware } from './security.js';
import { initCache, closeCache } from './cache.js';
import { gracefulShutdown } from './queue.js';
import { initWebSocket } from './websocket.js';
import { setupSwagger } from './swagger.js';
import { healthRoutes } from './health.js';
import { exportRoutes } from './export.js';
import { importRoutes } from './import.js';
import { pdfRoutes } from './pdf.js';
import { achievementRoutes, checkAndAwardAchievements } from './achievements.js';
import { subscriptionRoutes } from './subscriptions.js';
import { backupRoutes } from './backup.js';
import { canAddProduct } from './subscriptions.js';
import tagsRoutes from './tags.js';
import orderTimelineRoutes, { logTimelineEvent } from './orderTimeline.js';
import quickViewRoutes from './quickView.js';
import pushRoutes from './notifications_push.js';
import recommendationsRoutes from './ai_recommendations.js';
import geolocationRoutes from './geolocation.js';
import tagsSearchRoutes from './tags_search.js';
import { currencyRoutes, currencyMiddleware } from './currency.js';
import { bundleRoutes } from './bundles.js';
import { flashSalesRoutes } from './flashsales.js';
import { giftCardRoutes } from './giftcards.js';
import { productVideoRoutes } from './productvideo.js';
import { chatbotRoutes } from './chatbot.js';
import { newsletterRoutes } from './newsletter.js';
import { blogRoutes } from './blog.js';
import { sellerAnalyticsRoutes } from './analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` });

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'xK9#mP2$vL8@nQ4#wR7!tY6&uI3*eO1?aS5^dF0%gH9#jK2$lZ8';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { cb(null, ['image/jpeg','image/png','image/gif','image/webp'].includes(file.mimetype)); }});

securityMiddleware(app);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '..', 'public')));
app.use(requestLogger);
app.use(rateLimit({ windowMs: 60000, max: 200 }));
app.use('/api/products', cacheMiddleware(30000));
app.use(currencyMiddleware);

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  next();
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

async function notify(userId, type, title, message, link = '') {
  await run('INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)', [userId, type, title, message, link]);
}

function nextId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

// === FILE UPLOAD ===
app.post('/api/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  let width = null;
  let height = null;
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(req.file.path).metadata();
    width = metadata.width || null;
    height = metadata.height || null;
  } catch {}
  res.json({ url: `/uploads/${req.file.filename}`, width, height });
});

// === AUTH ===
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (username.length < 3) return res.status(400).json({ error: 'Username min 3 chars' });
    if (password.length < 6) return res.status(400).json({ error: 'Password min 6 chars' });
    const existing = await get('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing) return res.status(400).json({ error: 'User exists' });
    const id = uuidv4();
    await run('INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)', [id, username, email, bcrypt.hashSync(password, 10), role === 'seller' ? 'seller' : 'user']);
    const token = jwt.sign({ id, username, role: role === 'seller' ? 'seller' : 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, username, role: role === 'seller' ? 'seller' : 'user', balance: 0 } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong credentials' });
    await run('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, balance: user.balance, is_verified: user.is_verified, avatar: user.avatar } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === CATEGORIES ===
app.get('/api/categories', async (req, res) => {
  res.json(await getAll('SELECT * FROM categories WHERE is_active = true ORDER BY sort_order'));
});

// === PRODUCTS ===
app.get('/api/products', optionalAuth, async (req, res) => {
  try {
    let where = ['p.is_active = true'];
    let params = [];
    let idx = 1;
    if (req.query.category) { where.push(`c.slug = $${idx++}`); params.push(req.query.category); }
    if (req.query.seller_id) { where.push(`p.seller_id = $${idx++}`); params.push(req.query.seller_id); }
    if (req.query.search) { where.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`); params.push(`%${req.query.search}%`); idx++; }
    if (req.query.type) { where.push(`p.type = $${idx++}`); params.push(req.query.type); }
    if (req.query.region) { where.push(`p.region = $${idx++}`); params.push(req.query.region); }
    if (req.query.min_price) { where.push(`p.price >= $${idx++}`); params.push(Number(req.query.min_price)); }
    if (req.query.max_price) { where.push(`p.price <= $${idx++}`); params.push(Number(req.query.max_price)); }
    if (req.query.featured === '1') where.push('p.is_featured = true');

    let orderBy = 'p.sold_count DESC';
    if (req.query.sort === 'cheapest') orderBy = 'p.price ASC';
    else if (req.query.sort === 'expensive') orderBy = 'p.price DESC';
    else if (req.query.sort === 'newest') orderBy = 'p.created_at DESC';
    else if (req.query.sort === 'rating') orderBy = 'p.rating DESC';
    else if (req.query.sort === 'views') orderBy = 'p.view_count DESC';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const whereClause = where.join(' AND ');

    const total = (await get(`SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause}`, params))?.count || 0;
    const products = await getAll(`SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon, u.username as seller_name, u.avatar as seller_avatar, u.is_verified as seller_verified FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id WHERE ${whereClause} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx}`, [...params, limit, offset]);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:id', optionalAuth, async (req, res) => {
  try {
    const product = await get('SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon, u.username as seller_name, u.avatar as seller_avatar, u.is_verified as seller_verified, u.rating as seller_rating, u.total_sales as seller_total_sales, u.bio as seller_bio FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = $1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    await run('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
    if (req.user) await run('INSERT INTO view_history (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
    const reviews = await getAll('SELECT r.*, u.username as buyer_name, u.avatar as buyer_avatar FROM reviews r LEFT JOIN users u ON r.buyer_id = u.id WHERE r.product_id = $1 AND r.is_visible = true ORDER BY r.created_at DESC LIMIT 20', [req.params.id]);
    const isFavorite = req.user ? await get('SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.id]) : null;
    const related = await getAll('SELECT p.*, u.username as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true ORDER BY p.sold_count DESC LIMIT 4', [product.category_id, product.id]);
    res.json({ ...product, reviews, is_favorite: !!isFavorite, related });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { title, description, price, old_price, category_slug, type, region, delivery_type, image, stock_count, delivery_data, tags, image_width, image_height } = req.body;
    if (!title || !price || !category_slug) return res.status(400).json({ error: 'Title, price and category required' });
    const cat = await get('SELECT id FROM categories WHERE slug = $1', [category_slug]);
    const id = nextId('prod');
    await run(`INSERT INTO products (id, title, description, price, old_price, category_id, seller_id, type, region, delivery_type, image, stock_count, delivery_data, tags, image_width, image_height) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [id, title, description || '', price, old_price || null, cat?.id || 1, req.user.id, type || 'Ключ', region || 'Global', delivery_type || 'auto', image || '', stock_count || 1, delivery_data || '', JSON.stringify(tags || []), image_width || null, image_height || null]);
    res.json(await get('SELECT * FROM products WHERE id = $1', [id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    if (product.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });
    const { title, description, price, old_price, category_slug, type, region, delivery_type, image, stock_count, is_active, delivery_data, image_width, image_height } = req.body;
    const cat = category_slug ? await get('SELECT id FROM categories WHERE slug = $1', [category_slug]) : null;
    await run(`UPDATE products SET title=COALESCE($1,title), description=COALESCE($2,description), price=COALESCE($3,price), old_price=$4, category_id=COALESCE($5,category_id), type=COALESCE($6,type), region=COALESCE($7,region), delivery_type=COALESCE($8,delivery_type), image=COALESCE($9,image), stock_count=COALESCE($10,stock_count), is_active=COALESCE($11,is_active), delivery_data=COALESCE($12,delivery_data), image_width=COALESCE($13,image_width), image_height=COALESCE($14,image_height), updated_at=NOW() WHERE id=$15`,
      [title, description, price, old_price, cat?.id, type, region, delivery_type, image, stock_count, is_active, delivery_data, image_width || null, image_height || null, req.params.id]);
    res.json(await get('SELECT * FROM products WHERE id = $1', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    if (product.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });
    await run('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === SEARCH ===
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  res.json(await getAll('SELECT id, title, price, old_price, image FROM products WHERE title ILIKE $1 AND is_active = true ORDER BY sold_count DESC LIMIT 10', [`%${q}%`]));
});

// === REVIEWS ===
app.post('/api/products/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    const existing = await get('SELECT id FROM reviews WHERE product_id = $1 AND buyer_id = $2', [req.params.id, req.user.id]);
    if (existing) return res.status(400).json({ error: 'Already reviewed' });
    await run('INSERT INTO reviews (product_id, buyer_id, seller_id, rating, comment) VALUES ($1,$2,$3,$4,$5)', [req.params.id, req.user.id, product.seller_id, rating, comment || '']);
    const stats = await get('SELECT AVG(rating) as avg_rating, COUNT(*)::int as count FROM reviews WHERE product_id = $1', [req.params.id]);
    await run('UPDATE products SET rating = $1, rating_count = $2 WHERE id = $3', [stats.avg_rating, stats.count, req.params.id]);
    const sellerStats = await get('SELECT AVG(rating) as avg_rating, COUNT(*)::int as count FROM reviews WHERE seller_id = $1', [product.seller_id]);
    await run('UPDATE users SET rating = $1, rating_count = $2 WHERE id = $3', [sellerStats.avg_rating, sellerStats.count, product.seller_id]);
    await notify(product.seller_id, 'review', 'Новый отзыв', `${req.user.username} оставил отзыв на ${product.title}`, `/product/${product.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === CART ===
app.get('/api/cart', auth, async (req, res) => {
  res.json(await getAll('SELECT c.*, p.title, p.price, p.image, p.delivery_type, p.stock_count, u.username as seller_name FROM cart c JOIN products p ON c.product_id = p.id LEFT JOIN users u ON p.seller_id = u.id WHERE c.user_id = $1', [req.user.id]));
});
app.get('/api/cart/count', auth, async (req, res) => res.json({ count: (await get('SELECT COUNT(*)::int as c FROM cart WHERE user_id = $1', [req.user.id]))?.c || 0 }));
app.post('/api/cart', auth, async (req, res) => {
  await run('INSERT INTO cart (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, req.body.product_id]);
  res.json({ success: true });
});
app.delete('/api/cart/:productId', auth, async (req, res) => {
  await run('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
  res.json({ success: true });
});

// === FAVORITES ===
app.get('/api/favorites', auth, async (req, res) => {
  res.json(await getAll('SELECT p.*, u.username as seller_name FROM favorites f JOIN products p ON f.product_id = p.id LEFT JOIN users u ON p.seller_id = u.id WHERE f.user_id = $1 ORDER BY f.created_at DESC', [req.user.id]));
});
app.post('/api/favorites', auth, async (req, res) => {
  const existing = await get('SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2', [req.user.id, req.body.product_id]);
  if (existing) { await run('DELETE FROM favorites WHERE id = $1', [existing.id]); res.json({ success: true, is_favorite: false }); }
  else { await run('INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)', [req.user.id, req.body.product_id]); res.json({ success: true, is_favorite: true }); }
});

// === PROMO CODES ===
app.post('/api/promo/validate', auth, async (req, res) => {
  try {
    const { code, order_amount } = req.body;
    const promo = await get('SELECT * FROM promo_codes WHERE code = $1 AND is_active = true', [code?.toUpperCase()]);
    if (!promo) return res.status(404).json({ error: 'Промокод не найден' });
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return res.status(400).json({ error: 'Промокод истёк' });
    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) return res.status(400).json({ error: 'Промокод использован' });
    if (order_amount < promo.min_order_amount) return res.status(400).json({ error: `Минимальная сумма: ${promo.min_order_amount} ₽` });
    const used = await get('SELECT id FROM promo_usage WHERE promo_id = $1 AND user_id = $2', [promo.id, req.user.id]);
    if (used) return res.status(400).json({ error: 'Вы уже использовали этот промокод' });
    let discount = promo.discount_percent > 0 ? order_amount * (promo.discount_percent / 100) : promo.discount_amount;
    if (promo.max_discount > 0) discount = Math.min(discount, promo.max_discount);
    res.json({ discount: Math.round(discount), promo_id: promo.id, code: promo.code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === ORDERS ===
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { product_id, promo_code } = req.body;
    const product = await get('SELECT * FROM products WHERE id = $1 AND is_active = true', [product_id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock_count <= 0) return res.status(400).json({ error: 'Out of stock' });
    if (product.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot buy own product' });

    let amount = Number(product.price);
    let discount = 0;
    let promoId = null;

    if (promo_code) {
      const promo = await get('SELECT * FROM promo_codes WHERE code = $1 AND is_active = true', [promo_code.toUpperCase()]);
      if (promo && (!promo.expires_at || new Date(promo.expires_at) >= new Date()) && (promo.max_uses <= 0 || promo.used_count < promo.max_uses) && amount >= promo.min_order_amount) {
        discount = promo.discount_percent > 0 ? Math.round(amount * (promo.discount_percent / 100)) : Number(promo.discount_amount);
        if (promo.max_discount > 0) discount = Math.min(discount, Number(promo.max_discount));
        promoId = promo.id;
        amount -= discount;
      }
    }

    const commission = Math.round(amount * 0.08);
    const buyer = await get('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (buyer.balance < amount) return res.status(400).json({ error: `Нужно: ${amount} ₽, на балансе: ${buyer.balance} ₽` });

    const orderId = nextId('order');
    const escrowHours = parseInt((await get('SELECT value FROM settings WHERE key = $1', ['escrow_hours']))?.value || '24');

    await transaction(async (client) => {
      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
      await client.query(`INSERT INTO orders (id, buyer_id, product_id, seller_id, amount, commission, seller_amount, discount, promo_id, status, escrow_until, delivery_data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'paid', NOW() + INTERVAL '1 hour' * $10, '')`,
        [orderId, req.user.id, product_id, product.seller_id, amount, commission, amount - commission, discount, promoId, escrowHours]);
      await client.query('UPDATE products SET sold_count = sold_count + 1, stock_count = stock_count - 1 WHERE id = $1', [product_id]);
      await client.query('UPDATE users SET total_sales = total_sales + 1, total_revenue = total_revenue + $1 WHERE id = $2', [amount - commission, product.seller_id]);
      if (promoId) await client.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [promoId]);
    });

    let deliveryData = '';
    if (product.delivery_type === 'auto' && product.delivery_data) {
      const keys = JSON.parse(product.delivery_data);
      if (keys.length > 0) { deliveryData = keys.shift(); await run('UPDATE products SET delivery_data = $1 WHERE id = $2', [JSON.stringify(keys), product_id]); }
    }

    if (deliveryData) {
      await run('UPDATE orders SET delivery_data = $1, status = \'delivered\' WHERE id = $2', [deliveryData, orderId]);
    }

    await notify(product.seller_id, 'order', 'Новый заказ', `${product.title} на ${amount} ₽`, '/seller');
    await notify(req.user.id, 'order', 'Заказ оформлен', `Заказ на ${amount} ₽`, '/orders');

    const cartItem = await get('SELECT id FROM cart WHERE user_id = $1 AND product_id = $2', [req.user.id, product_id]);
    if (cartItem) await run('DELETE FROM cart WHERE id = $1', [cartItem.id]);

    const updatedBalance = (await get('SELECT balance FROM users WHERE id = $1', [req.user.id]))?.balance;
    res.json({ order_id: orderId, delivery: deliveryData, amount, discount, commission, status: deliveryData ? 'delivered' : 'paid', balance: updatedBalance });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders', auth, async (req, res) => {
  res.json(await getAll('SELECT o.*, p.title, p.image, p.delivery_type, u.username as seller_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.seller_id = u.id WHERE o.buyer_id = $1 ORDER BY o.created_at DESC', [req.user.id]));
});

app.get('/api/orders/seller', auth, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Seller only' });
  res.json(await getAll('SELECT o.*, p.title, p.image, u.username as buyer_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id WHERE o.seller_id = $1 ORDER BY o.created_at DESC', [req.user.id]));
});

// === SELLER ===
app.get('/api/sellers/:id', async (req, res) => {
  const user = await get('SELECT id, username, avatar, bio, is_verified, verification_badge, telegram, discord, website, rating, rating_count, total_sales, total_revenue, created_at, role FROM users WHERE id = $1 AND role = \'seller\'', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Seller not found' });
  const stats = await get('SELECT COUNT(*)::int as products, SUM(sold_count)::int as total_sold FROM products WHERE seller_id = $1 AND is_active = true', [req.params.id]);
  const reviews = await getAll('SELECT r.*, u.username as buyer_name, p.title as product_title FROM reviews r LEFT JOIN users u ON r.buyer_id = u.id LEFT JOIN products p ON r.product_id = p.id WHERE r.seller_id = $1 ORDER BY r.created_at DESC LIMIT 20', [req.params.id]);
  res.json({ ...user, ...stats, reviews });
});

app.get('/api/seller/dashboard', auth, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Seller only' });
  const stats = await get('SELECT COUNT(*)::int as total_products, SUM(sold_count)::int as total_sales, SUM(sold_count * price)::numeric as total_revenue, AVG(rating)::numeric as avg_rating FROM products WHERE seller_id = $1', [req.user.id]);
  const activeProducts = (await get('SELECT COUNT(*)::int as c FROM products WHERE seller_id = $1 AND is_active = true', [req.user.id]))?.c || 0;
  const pendingOrders = (await get('SELECT COUNT(*)::int as c FROM orders WHERE seller_id = $1 AND status IN (\'paid\',\'delivered\')', [req.user.id]))?.c || 0;
  const recentOrders = await getAll('SELECT o.*, p.title, u.username as buyer_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id WHERE o.seller_id = $1 ORDER BY o.created_at DESC LIMIT 10', [req.user.id]);
  const recentReviews = await getAll('SELECT r.*, u.username as buyer_name, p.title as product_title FROM reviews r LEFT JOIN users u ON r.buyer_id = u.id LEFT JOIN products p ON r.product_id = p.id WHERE r.seller_id = $1 ORDER BY r.created_at DESC LIMIT 5', [req.user.id]);
  const products = await getAll('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.seller_id = $1 ORDER BY p.created_at DESC', [req.user.id]);
  res.json({ stats: { ...stats, active_products: activeProducts, pending_orders: pendingOrders }, recentOrders, recentReviews, products });
});

// === MESSAGES ===
app.get('/api/messages', auth, async (req, res) => {
  const convos = await getAll(`SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_id, MAX(created_at) as last_time, SUM(CASE WHEN receiver_id = $1 AND is_read = false THEN 1 ELSE 0 END)::int as unread FROM messages WHERE sender_id = $1 OR receiver_id = $1 GROUP BY other_id ORDER BY last_time DESC`, [req.user.id]);
  const result = [];
  for (const c of convos) {
    const user = await get('SELECT id, username, avatar, is_verified FROM users WHERE id = $1', [c.other_id]);
    const lastMsg = await get('SELECT text FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1', [req.user.id, c.other_id]);
    result.push({ ...c, ...user, last_message: lastMsg?.text || '' });
  }
  res.json(result);
});

app.get('/api/messages/:userId', auth, async (req, res) => {
  await run('UPDATE messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2', [req.params.userId, req.user.id]);
  const other = await get('SELECT id, username, avatar, is_verified FROM users WHERE id = $1', [req.params.userId]);
  const messages = await getAll('SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at', [req.user.id, req.params.userId]);
  res.json({ messages, user: other });
});

app.post('/api/messages', auth, async (req, res) => {
  const { receiver_id, text } = req.body;
  if (!receiver_id || !text?.trim()) return res.status(400).json({ error: 'Missing fields' });
  await run('INSERT INTO messages (sender_id, receiver_id, text) VALUES ($1, $2, $3)', [req.user.id, receiver_id, text.trim()]);
  const msg = await get('SELECT * FROM messages ORDER BY id DESC LIMIT 1');
  res.json(msg);
});

app.get('/api/messages/unread/count', auth, async (req, res) => res.json({ count: (await get('SELECT COUNT(*)::int as c FROM messages WHERE receiver_id = $1 AND is_read = false', [req.user.id]))?.c || 0 }));

// === USER ===
app.get('/api/user/balance', auth, async (req, res) => { res.json({ balance: (await get('SELECT balance FROM users WHERE id = $1', [req.user.id]))?.balance || 0 }); });
app.post('/api/user/balance', auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0 || amount > 100000) return res.status(400).json({ error: 'Invalid amount' });
  await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [Number(amount), req.user.id]);
  res.json({ balance: (await get('SELECT balance FROM users WHERE id = $1', [req.user.id])).balance });
});
app.put('/api/user/profile', auth, async (req, res) => {
  const { username, avatar, bio, telegram, discord, website } = req.body;
  if (username && username.length >= 3) await run('UPDATE users SET username = $1 WHERE id = $2', [username, req.user.id]);
  if (avatar !== undefined) await run('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, req.user.id]);
  if (bio !== undefined) await run('UPDATE users SET bio = $1 WHERE id = $2', [bio, req.user.id]);
  if (telegram !== undefined) await run('UPDATE users SET telegram = $1 WHERE id = $2', [telegram, req.user.id]);
  if (discord !== undefined) await run('UPDATE users SET discord = $1 WHERE id = $2', [discord, req.user.id]);
  if (website !== undefined) await run('UPDATE users SET website = $1 WHERE id = $2', [website, req.user.id]);
  res.json(await get('SELECT id, username, role, balance, avatar, bio, telegram, discord, website, is_verified FROM users WHERE id = $1', [req.user.id]));
});

// === NOTIFICATIONS ===
app.get('/api/notifications', auth, async (req, res) => res.json(await getAll('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id])));
app.get('/api/notifications/unread', auth, async (req, res) => res.json({ count: (await get('SELECT COUNT(*)::int as c FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]))?.c || 0 }));
app.post('/api/notifications/read', auth, async (req, res) => { await run('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]); res.json({ success: true }); });

// === ADMIN ===
app.get('/api/admin/stats', auth, adminOnly, async (req, res) => {
  const users = (await get('SELECT COUNT(*)::int as c FROM users'))?.c;
  const sellers = (await get('SELECT COUNT(*)::int as c FROM users WHERE role = \'seller\''))?.c;
  const products = (await get('SELECT COUNT(*)::int as c FROM products WHERE is_active = true'))?.c;
  const orders = (await get('SELECT COUNT(*)::int as c FROM orders'))?.c;
  const revenue = (await get('SELECT COALESCE(SUM(commission), 0)::numeric as total FROM orders WHERE status = \'completed\''))?.total;
  const pendingOrders = (await get('SELECT COUNT(*)::int as c FROM orders WHERE status IN (\'paid\',\'delivered\')'))?.c;
  const disputes = (await get('SELECT COUNT(*)::int as c FROM orders WHERE status = \'disputed\''))?.c;
  const recentOrders = await getAll('SELECT o.*, p.title, u.username as buyer_name, s.username as seller_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id JOIN users s ON o.seller_id = s.id ORDER BY o.created_at DESC LIMIT 20');
  const topSellers = await getAll('SELECT id, username, total_sales, total_revenue, rating FROM users WHERE role = \'seller\' ORDER BY total_revenue DESC LIMIT 10');
  res.json({ users, sellers, products, orders, revenue, pendingOrders, disputes, recentOrders, topSellers });
});

app.get('/api/admin/users', auth, adminOnly, async (req, res) => res.json(await getAll('SELECT id, username, email, role, balance, is_verified, verification_badge, total_sales, total_revenue, rating, created_at, last_active FROM users ORDER BY created_at DESC')));
app.put('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  const { role, is_verified, verification_badge, balance } = req.body;
  if (role) await run('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  if (is_verified !== undefined) await run('UPDATE users SET is_verified = $1 WHERE id = $2', [is_verified, req.params.id]);
  if (verification_badge !== undefined) await run('UPDATE users SET verification_badge = $1 WHERE id = $2', [verification_badge, req.params.id]);
  if (balance !== undefined) await run('UPDATE users SET balance = $1 WHERE id = $2', [balance, req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/products', auth, adminOnly, async (req, res) => res.json(await getAll('SELECT p.*, u.username as seller_name, c.name as category_name FROM products p LEFT JOIN users u ON p.seller_id = u.id LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC')));
app.get('/api/admin/orders', auth, adminOnly, async (req, res) => res.json(await getAll('SELECT o.*, p.title, u.username as buyer_name, s.username as seller_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id JOIN users s ON o.seller_id = s.id ORDER BY o.created_at DESC')));
app.get('/api/admin/promos', auth, adminOnly, async (req, res) => res.json(await getAll('SELECT * FROM promo_codes ORDER BY created_at DESC')));
app.post('/api/admin/promos', auth, adminOnly, async (req, res) => {
  const { code, discount_percent, discount_amount, max_uses, min_order_amount, max_discount, expires_at } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  await run('INSERT INTO promo_codes (code, discount_percent, discount_amount, max_uses, min_order_amount, max_discount, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [code.toUpperCase(), discount_percent || 0, discount_amount || 0, max_uses || -1, min_order_amount || 0, max_discount || 0, expires_at || null]);
  res.json({ success: true });
});

// === SETTINGS ===
app.get('/api/settings', async (req, res) => {
  const settings = {};
  (await getAll('SELECT * FROM settings')).forEach(s => settings[s.key] = s.value);
  res.json(settings);
});

// === 2FA ===
app.post('/api/2fa/setup', auth, async (req, res) => {
  try {
    const totp = new OTPAuth.TOTP({ issuer: 'Keyzo.pro', label: req.user.email, algorithm: 'SHA1', digits: 6, period: 30 });
    const secret = totp.secret;
    await run('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret.base32, req.user.id]);
    const uri = totp.toString();
    res.json({ secret: secret.base32, uri });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/2fa/verify', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await get('SELECT two_factor_secret FROM users WHERE id = $1', [req.user.id]);
    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.two_factor_secret), algorithm: 'SHA1', digits: 6, period: 30 });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return res.status(400).json({ error: 'Invalid code' });
    await run('UPDATE users SET two_factor_enabled = true WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/2fa/disable', auth, async (req, res) => {
  await run('UPDATE users SET two_factor_enabled = false, two_factor_secret = \'\' WHERE id = $1', [req.user.id]);
  res.json({ success: true });
});

app.post('/api/2fa/login', async (req, res) => {
  try {
    const { email, password, code } = req.body;
    const user = await get('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong credentials' });
    if (user.two_factor_enabled) {
      const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.two_factor_secret), algorithm: 'SHA1', digits: 6, period: 30 });
      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) return res.status(400).json({ error: 'Invalid 2FA code', requires2fa: true });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, balance: user.balance } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === REFERRALS ===
app.get('/api/referrals/my', auth, async (req, res) => {
  const user = await get('SELECT referral_code FROM users WHERE id = $1', [req.user.id]);
  if (!user.referral_code) {
    const code = `KZ${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await run('UPDATE users SET referral_code = $1 WHERE id = $2', [code, req.user.id]);
    user.referral_code = code;
  }
  const referrals = await getAll('SELECT r.*, u.username as referred_name, u.created_at as joined_at FROM referrals r LEFT JOIN users u ON r.referred_id = u.id WHERE r.referrer_id = $1 ORDER BY r.created_at DESC', [req.user.id]);
  const totalEarned = (await get('SELECT COALESCE(SUM(reward_amount), 0)::numeric as total FROM referrals WHERE referrer_id = $1 AND status = \'completed\'', [req.user.id]))?.total || 0;
  res.json({ code: user.referral_code, referrals, totalEarned, totalReferrals: referrals.length });
});

app.post('/api/referrals/apply', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });
    const referrer = await get('SELECT id FROM users WHERE referral_code = $1', [code.toUpperCase()]);
    if (!referrer) return res.status(404).json({ error: 'Referral code not found' });
    if (referrer.id === req.user.id) return res.status(400).json({ error: 'Cannot refer yourself' });
    const existing = await get('SELECT id FROM referrals WHERE referred_id = $1', [req.user.id]);
    if (existing) return res.status(400).json({ error: 'Already referred' });
    await run('INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_amount, status) VALUES ($1, $2, $3, 100, \'completed\')', [referrer.id, req.user.id, code.toUpperCase()]);
    await run('UPDATE users SET balance = balance + 100, referred_by = $1 WHERE id = $2', [referrer.id, req.user.id]);
    await run('UPDATE users SET balance = balance + 50 WHERE id = $1', [referrer.id]);
    await notify(referrer.id, 'system', 'Реферал', 'Ваш реферал получил бонус! +50 ₽ на баланс', '');
    res.json({ success: true, bonus: 100 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === LOYALTY ===
app.get('/api/loyalty/balance', auth, async (req, res) => {
  const user = await get('SELECT loyalty_balance FROM users WHERE id = $1', [req.user.id]);
  const history = await getAll('SELECT * FROM loyalty_points WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [req.user.id]);
  res.json({ balance: user?.loyalty_balance || 0, history });
});

app.post('/api/loyalty/redeem', auth, async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points <= 0) return res.status(400).json({ error: 'Invalid points' });
    const user = await get('SELECT loyalty_balance FROM users WHERE id = $1', [req.user.id]);
    if (user.loyalty_balance < points) return res.status(400).json({ error: 'Not enough points' });
    const rubAmount = Math.floor(points / 10);
    await run('UPDATE users SET loyalty_balance = loyalty_balance - $1, balance = balance + $2 WHERE id = $3', [points, rubAmount, req.user.id]);
    await run('INSERT INTO loyalty_points (user_id, points, type, description) VALUES ($1, $2, \'spend\', $3)', [req.user.id, -points, `Обмен ${points} баллов на ${rubAmount} ₽`]);
    res.json({ success: true, rubAmount, remaining: user.loyalty_balance - points });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === SELLER ANALYTICS ===
app.get('/api/seller/analytics', auth, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Seller only' });
  const days = parseInt(req.query.days) || 30;
  const analytics = await getAll(`SELECT date, views, orders, revenue FROM seller_analytics WHERE seller_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2 ORDER BY date`, [req.user.id, days]);
  const totalViews = analytics.reduce((s, a) => s + a.views, 0);
  const totalOrders = analytics.reduce((s, a) => s + a.orders, 0);
  const totalRevenue = analytics.reduce((s, a) => s + Number(a.revenue), 0);
  const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : '0';
  const topProducts = await getAll(`SELECT p.id, p.title, p.view_count, p.sold_count, p.rating, p.price FROM products p WHERE p.seller_id = $1 ORDER BY p.sold_count DESC LIMIT 5`, [req.user.id]);
  res.json({ analytics, summary: { totalViews, totalOrders, totalRevenue, conversionRate }, topProducts });
});

// === DISPUTES ===
app.post('/api/orders/:id/dispute', auth, async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Not your order' });
    if (order.status === 'disputed') return res.status(400).json({ error: 'Already disputed' });
    const { reason, evidence } = req.body;
    await run('UPDATE orders SET status = \'disputed\', dispute_reason = $1, dispute_evidence = $2 WHERE id = $3', [reason || 'Не указано', evidence || '', req.params.id]);
    await notify(order.seller_id, 'dispute', 'Открыт спор', `Покупатель открыл спор по заказу ${req.params.id.slice(-8)}`, '/seller');
    await notify(order.buyer_id, 'dispute', 'Спор открыт', `Ваш спор принят. Ожидайте решения.`, '/orders');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/orders/:id/resolve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const order = await get('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    const { action, refund_amount } = req.body;
    if (action === 'refund_full') {
      await run('UPDATE orders SET status = \'refunded\', refund_amount = $1, dispute_resolved_at = NOW() WHERE id = $2', [order.amount, req.params.id]);
      await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [order.amount, order.buyer_id]);
      await notify(order.buyer_id, 'refund', 'Полный возврат', `${order.amount} ₽ возвращено`, '/orders');
    } else if (action === 'refund_partial') {
      const amt = Math.min(refund_amount || 0, order.amount);
      await run('UPDATE orders SET status = \'refunded\', refund_amount = $1, dispute_resolved_at = NOW() WHERE id = $2', [amt, req.params.id]);
      await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [amt, order.buyer_id]);
      await notify(order.buyer_id, 'refund', 'Частичный возврат', `${amt} ₽ возвращено`, '/orders');
    } else if (action === 'resolve_seller') {
      await run('UPDATE orders SET status = \'completed\', dispute_resolved_at = NOW() WHERE id = $1', [req.params.id]);
      await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [order.seller_amount, order.seller_id]);
      await notify(order.seller_id, 'payment', 'Спор resolved', `${order.seller_amount} ₽ зачислено`, '/seller');
    }
    await notify(order.buyer_id, 'dispute', 'Спор resolved', `Спор по заказу ${req.params.id.slice(-8)} resolved`, '/orders');
    await notify(order.seller_id, 'dispute', 'Спор resolved', `Спор по заказу ${req.params.id.slice(-8)} resolved`, '/seller');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/disputes', auth, adminOnly, async (req, res) => {
  res.json(await getAll('SELECT o.*, p.title, u.username as buyer_name, s.username as seller_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id JOIN users s ON o.seller_id = s.id WHERE o.status = \'disputed\' ORDER BY o.created_at DESC'));
});

// === PRODUCT ANALYTICS ===
app.post('/api/products/:id/view', async (req, res) => {
  await run('INSERT INTO product_views_daily (product_id, date, views) VALUES ($1, CURRENT_DATE, 1) ON CONFLICT (product_id, date) DO UPDATE SET views = product_views_daily.views + 1', [req.params.id]);
  res.json({ success: true });
});

// === SELLER BADGE REQUEST ===
app.post('/api/seller/verify-request', auth, async (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Seller only' });
  const { document_url, description } = req.body;
  await notify('8e32e118-0b49-4466-a204-24d8d7557e22', 'system', 'Запрос верификации', `Продавец ${req.user.username} запросил верификацию. Документ: ${document_url}`, '/admin');
  res.json({ success: true, message: 'Запрос отправлен. Ожидайте проверки.' });
});

// === ADMIN: VERIFY SELLER ===
app.put('/api/admin/verify/:id', auth, adminOnly, async (req, res) => {
  const { is_verified, verification_badge } = req.body;
  await run('UPDATE users SET is_verified = $1, verification_badge = $2 WHERE id = $3', [is_verified, verification_badge || '', req.params.id]);
  if (is_verified) await notify(req.params.id, 'system', 'Верификация', 'Ваш аккаунт верифицирован! ✓', '');
  res.json({ success: true });
});

// === SEO ===
app.get('/api/seo/product/:id', async (req, res) => {
  const p = await get('SELECT title, description, image, price FROM products WHERE id = $1', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ title: `${p.title} — Keyzo.pro`, description: p.description?.slice(0, 160), image: p.image, price: p.price });
});

// === QUESTIONS (Q&A) ===
app.get('/api/questions/:productId', async (req, res) => {
  try {
    const questions = await getAll(
      `SELECT q.*, u.username as user_name, u.avatar as user_avatar, a.username as answered_by_name FROM questions q LEFT JOIN users u ON q.user_id = u.id LEFT JOIN users a ON q.answered_by = a.id WHERE q.product_id = $1 AND q.is_visible = true ORDER BY q.created_at DESC`,
      [req.params.productId]
    );
    res.json(questions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/questions/:productId', auth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question required' });
    const product = await get('SELECT id, seller_id FROM products WHERE id = $1', [req.params.productId]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await run('INSERT INTO questions (product_id, user_id, question) VALUES ($1, $2, $3)', [req.params.productId, req.user.id, question.trim()]);
    await notify(product.seller_id, 'system', 'Новый вопрос', `${req.user.username} задал вопрос к товару`, `/product/${req.params.productId}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/questions/:id/answer', auth, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Answer required' });
    const q = await get('SELECT q.*, p.seller_id FROM questions q JOIN products p ON q.product_id = p.id WHERE q.id = $1', [req.params.id]);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    if (q.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });

    await run('UPDATE questions SET answer = $1, answered_by = $2, answered_at = NOW() WHERE id = $3', [answer.trim(), req.user.id, req.params.id]);
    await notify(q.user_id, 'system', 'Ответ на вопрос', `Продавец ответил на ваш вопрос`, `/product/${q.product_id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/questions/:id', auth, async (req, res) => {
  try {
    const q = await get('SELECT q.*, p.seller_id FROM questions q JOIN products p ON q.product_id = p.id WHERE q.id = $1', [req.params.id]);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    if (q.user_id !== req.user.id && q.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed' });
    await run('UPDATE questions SET is_visible = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === PRODUCT COMPARE ===
app.post('/api/compare', async (req, res) => {
  try {
    const { product_id, session_id } = req.body;
    if (!product_id || !session_id) return res.status(400).json({ error: 'product_id and session_id required' });

    const existing = await getAll('SELECT product_id FROM product_compare WHERE session_id = $1', [session_id]);
    if (existing.length >= 4) return res.status(400).json({ error: 'Максимум 4 товара для сравнения' });

    await run('INSERT INTO product_compare (session_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [session_id, product_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/compare/:sessionId', async (req, res) => {
  try {
    const products = await getAll(
      `SELECT p.*, c.name as category_name, u.username as seller_name FROM product_compare pc JOIN products p ON pc.product_id = p.id LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id WHERE pc.session_id = $1 ORDER BY pc.created_at`,
      [req.params.sessionId]
    );
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/compare/:sessionId/:productId', async (req, res) => {
  try {
    await run('DELETE FROM product_compare WHERE session_id = $1 AND product_id = $2', [req.params.sessionId, req.params.productId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/compare/:sessionId', async (req, res) => {
  try {
    await run('DELETE FROM product_compare WHERE session_id = $1', [req.params.sessionId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === INTEGRATE ACHIEVEMENT CHECKS INTO KEY ACTIONS ===
app.post('/api/orders/:id/confirm', auth, async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (req.body.action === 'buyer_confirm') {
      if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Not your order' });
      await run('UPDATE orders SET buyer_confirmed = true, status = \'completed\' WHERE id = $1', [req.params.id]);
      await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [order.seller_amount, order.seller_id]);
      await notify(order.seller_id, 'payment', 'Оплата получена', `${order.seller_amount} ₽ зачислено`, '/seller');
      await checkAndAwardAchievements(req.user.id);
      await checkAndAwardAchievements(order.seller_id);
    } else if (req.body.action === 'open_dispute') {
      await run('UPDATE orders SET status = \'disputed\', dispute_reason = $1 WHERE id = $2', [req.body.reason || 'Не указано', req.params.id]);
      await notify(order.seller_id, 'dispute', 'Открыт спор', `Спор по заказу ${req.params.id.slice(-8)}`, '/seller');
    } else if (req.body.action === 'refund' && req.user.role === 'admin') {
      await run('UPDATE orders SET status = \'refunded\' WHERE id = $1', [req.params.id]);
      await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [order.amount, order.buyer_id]);
      await notify(order.buyer_id, 'refund', 'Возврат', `${order.amount} ₽ возвращено`, '/orders');
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === PROFILE SETTINGS ===
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, '..', 'public', 'uploads', 'avatars')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${extname(file.originalname)}`)
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { cb(null, ['image/jpeg','image/png','image/gif','image/webp'].includes(file.mimetype)); }});

app.get('/api/user/settings', auth, async (req, res) => {
  try {
    const user = await get('SELECT id, username, email, avatar, bio, telegram, discord, website, role, is_verified, two_factor_enabled, last_username_change, notification_prefs, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/stats', auth, async (req, res) => {
  try {
    const user = await get('SELECT created_at FROM users WHERE id = $1', [req.user.id]);
    const orderStats = await get('SELECT COUNT(*)::int as total_orders, COALESCE(SUM(amount), 0)::numeric as total_spent FROM orders WHERE buyer_id = $1', [req.user.id]);
    res.json({
      member_since: user?.created_at,
      total_orders: orderStats?.total_orders || 0,
      total_spent: orderStats?.total_spent || 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { username, bio, telegram, discord, website, avatar } = req.body;

    if (username !== undefined && username.length >= 3) {
      const current = await get('SELECT username, last_username_change FROM users WHERE id = $1', [req.user.id]);
      if (username !== current.username) {
        if (current.last_username_change) {
          const last = new Date(current.last_username_change);
          const now = new Date();
          const diffDays = (now - last) / (1000 * 60 * 60 * 24);
          if (diffDays < 30) {
            return res.status(400).json({ error: 'Можно менять раз в 30 дней' });
          }
        }
        await run('UPDATE users SET username = $1, last_username_change = NOW() WHERE id = $2', [username, req.user.id]);
      }
    }
    if (bio !== undefined) await run('UPDATE users SET bio = $1 WHERE id = $2', [bio, req.user.id]);
    if (telegram !== undefined) await run('UPDATE users SET telegram = $1 WHERE id = $2', [telegram, req.user.id]);
    if (discord !== undefined) await run('UPDATE users SET discord = $1 WHERE id = $2', [discord, req.user.id]);
    if (website !== undefined) await run('UPDATE users SET website = $1 WHERE id = $2', [website, req.user.id]);
    if (avatar !== undefined) await run('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, req.user.id]);

    const updated = await get('SELECT id, username, email, avatar, bio, telegram, discord, website, role, is_verified, last_username_change FROM users WHERE id = $1', [req.user.id]);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/avatar', auth, avatarUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const url = `/uploads/avatars/${req.file.filename}`;
    await run('UPDATE users SET avatar = $1 WHERE id = $2', [url, req.user.id]);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/user/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Заполните все поля' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    const user = await get('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ error: 'Неверный текущий пароль' });
    await run('UPDATE users SET password = $1 WHERE id = $2', [bcrypt.hashSync(newPassword, 10), req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/user/notifications', auth, async (req, res) => {
  try {
    const prefs = req.body;
    await run('UPDATE users SET notification_prefs = $1 WHERE id = $2', [JSON.stringify(prefs), req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/user/account', auth, async (req, res) => {
  try {
    await run('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === START ===
async function start() {
  await migrate();
  await seedDatabase();
  await initCache();
  logger.info('Cache initialized');

  const shutdown = async () => {
    logger.info('Shutting down...');
    await gracefulShutdown();
    await closeCache();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const server = createServer(app);

  setupSwagger(app);
  healthRoutes(app);
  exportRoutes(app, auth, adminOnly);
  importRoutes(app, auth);
  pdfRoutes(app, auth);
  achievementRoutes(app, auth);
  subscriptionRoutes(app, auth);
  backupRoutes(app, auth, adminOnly);
  tagsRoutes(app, auth);
  orderTimelineRoutes(app, auth);
  quickViewRoutes(app);
  pushRoutes(app, auth);
  recommendationsRoutes(app);
  geolocationRoutes(app, auth);
  tagsSearchRoutes(app);
  currencyRoutes(app, auth);
  bundleRoutes(app, auth);
  flashSalesRoutes(app, auth);
  giftCardRoutes(app, auth);
  productVideoRoutes(app, auth);
  chatbotRoutes(app);
  newsletterRoutes(app, auth);
  blogRoutes(app, auth);
  sellerAnalyticsRoutes(app, auth);

  initWebSocket(server);

  // SPA catch-all AFTER all API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  app.use(errorLogger);

  server.listen(PORT, HOST, () => {
    logger.info(`Keyzo.pro server running on http://${HOST}:${PORT}`);
    logger.info(`API docs: http://localhost:${PORT}/api/docs`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err.message || err);
});

start().catch(console.error);
