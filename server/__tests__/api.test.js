import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

const { query, get, getAll, run, transaction } = globalThis.__mocks;

let app;

beforeEach(() => {
  jest.clearAllMocks();

  app = express();
  app.use(cors());
  app.use(express.json());

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

  // === PRODUCTS ===
  app.get('/api/products', optionalAuth, async (req, res) => {
    try {
      let where = ['p.is_active = true'];
      let params = [];
      let idx = 1;
      if (req.query.category) { where.push(`c.slug = $${idx++}`); params.push(req.query.category); }

      let orderBy = 'p.sold_count DESC';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const whereClause = where.join(' AND ');

      const total = (await get(`SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause}`, params))?.count || 0;
      const products = await getAll(`SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${whereClause} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx}`, [...params, limit, offset]);
      res.json({ products, total, page, pages: Math.ceil(total / limit) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/products/:id', optionalAuth, async (req, res) => {
    try {
      const product = await get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1', [req.params.id]);
      if (!product) return res.status(404).json({ error: 'Not found' });
      await run('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
      const reviews = await getAll('SELECT r.*, u.username as buyer_name FROM reviews r LEFT JOIN users u ON r.buyer_id = u.id WHERE r.product_id = $1', [req.params.id]);
      res.json({ ...product, reviews });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/products', auth, async (req, res) => {
    try {
      const { title, price, category_slug } = req.body;
      if (!title || !price || !category_slug) return res.status(400).json({ error: 'Title, price and category required' });
      const cat = await get('SELECT id FROM categories WHERE slug = $1', [category_slug]);
      const id = `prod-${Date.now()}`;
      await run('INSERT INTO products (id, title, price, category_id, seller_id) VALUES ($1,$2,$3,$4,$5)', [id, title, price, cat?.id || 1, req.user.id]);
      res.json(await get('SELECT * FROM products WHERE id = $1', [id]));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // === CATEGORIES ===
  app.get('/api/categories', async (req, res) => {
    try {
      res.json(await getAll('SELECT * FROM categories WHERE is_active = true ORDER BY sort_order'));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // === HEALTH ===
  app.get('/api/health', async (req, res) => {
    try {
      res.json({ status: 'ok', uptime: process.uptime() });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    get.mockResolvedValue(null);
    run.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.role).toBe('user');
  });

  it('should return 400 for duplicate user', async () => {
    get.mockResolvedValue({ id: 'existing-id' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exists/i);
  });

  it('should return 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should return 400 for short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/min/i);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/min/i);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    get.mockResolvedValue({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      balance: 0,
      is_verified: false,
      avatar: '',
    });
    run.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe('testuser');
  });

  it('should return 401 for wrong password', async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    get.mockResolvedValue({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/wrong/i);
  });

  it('should return 401 for non-existent user', async () => {
    get.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/wrong/i);
  });
});

describe('GET /api/products', () => {
  it('should return products array', async () => {
    const mockProducts = [
      { id: 'prod-1', title: 'Test Product', price: 100, is_active: true },
      { id: 'prod-2', title: 'Another Product', price: 200, is_active: true },
    ];
    get.mockResolvedValue({ count: '2' });
    getAll.mockResolvedValue(mockProducts);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pages');
  });

  it('should filter by category', async () => {
    get.mockResolvedValue({ count: '0' });
    getAll.mockResolvedValue([]);

    const res = await request(app).get('/api/products?category=games');

    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });
});

describe('GET /api/products/:id', () => {
  it('should return a product by id', async () => {
    const mockProduct = {
      id: 'prod-1',
      title: 'Test Product',
      price: 100,
      category_name: 'Games',
      seller_name: 'seller1',
    };
    get.mockResolvedValue(mockProduct);
    getAll.mockResolvedValue([]);

    const res = await request(app).get('/api/products/prod-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('prod-1');
    expect(res.body.title).toBe('Test Product');
  });

  it('should return 404 for non-existent product', async () => {
    get.mockResolvedValue(null);

    const res = await request(app).get('/api/products/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('POST /api/products', () => {
  it('should create product with valid auth', async () => {
    const token = makeToken({ id: 'seller-1', username: 'seller', role: 'seller' });
    get
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 'prod-new', title: 'New Product', price: 50 });
    run.mockResolvedValue({});

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Product',
        price: 50,
        category_slug: 'games',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('prod-new');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        title: 'New Product',
        price: 50,
        category_slug: 'games',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        title: 'New Product',
        price: 50,
        category_slug: 'games',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should return 400 when required fields missing', async () => {
    const token = makeToken({ id: 'seller-1', username: 'seller', role: 'seller' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No Price' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });
});

describe('GET /api/categories', () => {
  it('should return categories array', async () => {
    const mockCategories = [
      { id: 1, name: 'Games', slug: 'games', icon: '🎮', is_active: true },
      { id: 2, name: 'Software', slug: 'software', icon: '💻', is_active: true },
    ];
    getAll.mockResolvedValue(mockCategories);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe('Games');
  });
});

describe('GET /api/health', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
  });
});
