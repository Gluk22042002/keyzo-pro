import pool from './db.js';

const schema = `
  -- UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- ENUMS
  DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('order', 'review', 'message', 'payment', 'dispute', 'refund', 'system');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  -- USERS
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar TEXT DEFAULT '',
    balance DECIMAL(12,2) DEFAULT 0 CHECK(balance >= 0),
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    verification_badge VARCHAR(100) DEFAULT '',
    bio TEXT DEFAULT '',
    telegram VARCHAR(100) DEFAULT '',
    discord VARCHAR(100) DEFAULT '',
    website VARCHAR(255) DEFAULT '',
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
  );

  -- CATEGORIES
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(10) DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
  );

  -- PRODUCTS
  CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    price DECIMAL(12,2) NOT NULL CHECK(price > 0),
    old_price DECIMAL(12,2),
    category_id INTEGER REFERENCES categories(id),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'Ключ',
    region VARCHAR(50) DEFAULT 'Global',
    delivery_type VARCHAR(20) DEFAULT 'auto',
    image TEXT DEFAULT '',
    images JSONB DEFAULT '[]',
    stock_count INTEGER DEFAULT 1 CHECK(stock_count >= 0),
    sold_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00,
    rating_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    delivery_data TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- PRODUCT VARIANTS
  CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    stock INTEGER DEFAULT 1,
    attributes JSONB DEFAULT '{}'
  );

  -- REVIEWS
  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    order_id VARCHAR(50),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    seller_reply TEXT DEFAULT '',
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- ORDERS
  CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    buyer_id UUID REFERENCES users(id),
    product_id VARCHAR(50) REFERENCES products(id),
    seller_id UUID REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    commission DECIMAL(12,2) DEFAULT 0,
    seller_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    promo_id INTEGER,
    status order_status DEFAULT 'pending',
    delivery_data TEXT DEFAULT '',
    buyer_confirmed BOOLEAN DEFAULT false,
    seller_confirmed BOOLEAN DEFAULT false,
    escrow_until TIMESTAMPTZ,
    dispute_reason TEXT DEFAULT '',
    dispute_resolved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- CART
  CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
  );

  -- FAVORITES
  CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
  );

  -- MESSAGES
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- PROMO CODES
  CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    max_uses INTEGER DEFAULT -1,
    used_count INTEGER DEFAULT 0,
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    max_discount DECIMAL(12,2) DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    seller_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- PROMO USAGE
  CREATE TABLE IF NOT EXISTS promo_usage (
    id SERIAL PRIMARY KEY,
    promo_id INTEGER REFERENCES promo_codes(id),
    user_id UUID REFERENCES users(id),
    order_id VARCHAR(50),
    used_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- VIEW HISTORY
  CREATE TABLE IF NOT EXISTS view_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    product_id VARCHAR(50) REFERENCES products(id),
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- NOTIFICATIONS
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- SETTINGS
  CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- INDEXES
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
  CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
  CREATE INDEX IF NOT EXISTS idx_products_sold ON products(sold_count DESC);
  CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(to_tsvector('russian', title || ' ' || description));
  CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
  CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_view_history_user ON view_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_view_history_product ON view_history(product_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

  -- 2FA
  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(100) DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

  -- REFERRALS
  CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES users(id),
    referred_id UUID REFERENCES users(id),
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    reward_amount DECIMAL(12,2) DEFAULT 100,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','completed','expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
  CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
  CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

  -- LOYALTY POINTS
  CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('earn','spend','expire','refund')),
    description TEXT DEFAULT '',
    order_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_balance INTEGER DEFAULT 0;
  CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_points(user_id);

  -- SELLER ANALYTICS
  CREATE TABLE IF NOT EXISTS seller_analytics (
    id SERIAL PRIMARY KEY,
    seller_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    UNIQUE(seller_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_seller_date ON seller_analytics(seller_id, date);

  -- DISPUTES
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_evidence TEXT DEFAULT '';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12,2) DEFAULT 0;

  -- PRODUCT VIEWS TRACKING (for analytics)
  CREATE TABLE IF NOT EXISTS product_views_daily (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id),
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    UNIQUE(product_id, date)
  );

  -- QUESTIONS (product Q&A)
  CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    question TEXT NOT NULL,
    answer TEXT DEFAULT '',
    answered_by UUID REFERENCES users(id),
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS idx_questions_product ON questions(product_id);
  CREATE INDEX IF NOT EXISTS idx_questions_user ON questions(user_id);

  -- ACHIEVEMENTS
  CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    icon VARCHAR(10) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- USER ACHIEVEMENTS
  CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(50) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_key)
  );
  CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

  -- SELLER SUBSCRIPTIONS
  CREATE TABLE IF NOT EXISTS seller_subscriptions (
    id SERIAL PRIMARY KEY,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active','cancelled','expired')),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_subscriptions_seller ON seller_subscriptions(seller_id);

  -- PRODUCT COMPARE (session-based)
  CREATE TABLE IF NOT EXISTS product_compare (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, product_id)
  );
  CREATE INDEX IF NOT EXISTS idx_compare_session ON product_compare(session_id);

  -- PRODUCT TAGS
  CREATE TABLE IF NOT EXISTS product_tags (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, tag)
  );
  CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
  CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);

  -- ORDER TIMELINE
  CREATE TABLE IF NOT EXISTS order_timeline (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_timeline_order ON order_timeline(order_id);

  -- PUSH SUBSCRIPTIONS
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);

  -- GEOLOCATION COLUMNS
  ALTER TABLE users ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT '';
  CREATE INDEX IF NOT EXISTS idx_users_coords ON users(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

  -- PROFILE SETTINGS COLUMNS
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"email_orders":true,"email_promos":false,"email_disputes":true}';

  -- PRODUCT IMAGE DIMENSIONS
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_width INTEGER;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_height INTEGER;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image2 TEXT DEFAULT '';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image2_width INTEGER;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image2_height INTEGER;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image3 TEXT DEFAULT '';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image3_width INTEGER;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image3_height INTEGER;

  -- PRODUCT VIDEO
  ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

  -- EXCHANGE RATES (multi-currency)
  CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
  );
  CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);

  -- BUNDLES
  CREATE TABLE IF NOT EXISTS bundles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK(discount_percent > 0),
    min_items INTEGER DEFAULT 2 CHECK(min_items >= 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS bundle_products (
    id SERIAL PRIMARY KEY,
    bundle_id INTEGER REFERENCES bundles(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(bundle_id, product_id)
  );
  CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle ON bundle_products(bundle_id);
  CREATE INDEX IF NOT EXISTS idx_bundle_products_product ON bundle_products(product_id);

  -- FLASH SALES
  CREATE TABLE IF NOT EXISTS flash_sales (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    sale_price DECIMAL(12,2) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_quantity INTEGER NOT NULL CHECK(max_quantity > 0),
    sold_quantity INTEGER DEFAULT 0 CHECK(sold_quantity >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active','expired','sold_out','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON flash_sales(product_id);
  CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(status, start_time, end_time);

  -- GIFT CARDS
  CREATE TABLE IF NOT EXISTS gift_cards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(25) UNIQUE NOT NULL,
    balance DECIMAL(12,2) NOT NULL CHECK(balance >= 0),
    currency VARCHAR(10) DEFAULT 'RUB',
    buyer_id UUID REFERENCES users(id),
    recipient_email VARCHAR(255) DEFAULT '',
    message TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active','redeemed','expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
  CREATE INDEX IF NOT EXISTS idx_gift_cards_buyer ON gift_cards(buyer_id);

  -- NEWSLETTER SUBSCRIBERS
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
  CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);

  -- BLOG POSTS
  CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT DEFAULT '',
    author_id UUID REFERENCES users(id),
    category VARCHAR(100) DEFAULT 'general',
    image TEXT DEFAULT '',
    is_published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
  CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);
  CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);
  CREATE INDEX IF NOT EXISTS idx_blog_author ON blog_posts(author_id);
`;

export async function migrate() {
  console.log('Running migrations...');
  await pool.query(schema);
  console.log('Migrations complete');
}

export default migrate;
