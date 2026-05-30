const requests = new Map();

export function rateLimit({ windowMs = 60000, max = 100 } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!requests.has(key)) requests.set(key, []);
    const times = requests.get(key).filter(t => t > now - windowMs);
    times.push(now);
    requests.set(key, times);
    if (times.length > max) return res.status(429).json({ error: 'Too many requests' });
    res.set('X-RateLimit-Remaining', max - times.length);
    next();
  };
}

const cache = new Map();

export function cacheMiddleware(ttl = 60000) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < ttl) {
      res.set('X-Cache', 'HIT');
      return res.json(cached.data);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, time: Date.now() });
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };
    next();
  };
}

export function clearCache(pattern) {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}
