let redis = null;
let redisAvailable = false;
const memoryCache = new Map();
const stats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };

async function connectRedis() {
  try {
    const Redis = (await import('ioredis')).default;
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 0,
      retryStrategy(times) {
        return null;
      },
      lazyConnect: true,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });

    redis.on('error', () => {});
    redis.on('connect', () => { redisAvailable = true; });

    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    redisAvailable = true;
    console.log('[Cache] Redis connected');
  } catch (err) {
    redisAvailable = false;
    console.warn('[Cache] Redis unavailable, using in-memory cache');
  }
}

export async function initCache() {
  try {
    await connectRedis();
  } catch (err) {
    redisAvailable = false;
  }
  if (!redisAvailable) {
    console.log('[Cache] Using in-memory cache');
  }
  return redisAvailable;
}

export function cacheMiddleware(ttl = 60000) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await getCache(key);
      if (cached) {
        stats.hits++;
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch {
      stats.errors++;
    }

    stats.misses++;
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      setCache(key, data, ttl).catch(() => stats.errors++);
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };
    next();
  };
}

async function getCache(key) {
  if (redisAvailable && redis) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

async function setCache(key, data, ttl) {
  if (redisAvailable && redis) {
    await redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(data));
    return;
  }

  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });

  if (memoryCache.size > 10000) {
    const oldest = memoryCache.keys().next().value;
    memoryCache.delete(oldest);
  }
}

export async function invalidateCache(pattern) {
  stats.deletes++;

  if (redisAvailable && redis) {
    const keys = await redis.keys(`cache:*${pattern}*`);
    if (keys.length > 0) await redis.del(...keys);
    return;
  }

  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) memoryCache.delete(key);
  }
}

export function getCacheStats() {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    hitRate: total > 0 ? ((stats.hits / total) * 100).toFixed(1) + '%' : '0%',
    redisConnected: redisAvailable,
    memoryCacheSize: memoryCache.size,
  };
}

export async function closeCache() {
  if (redis) {
    await redis.quit().catch(() => {});
    redis = null;
    redisAvailable = false;
  }
  memoryCache.clear();
}
