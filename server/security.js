import helmet from 'helmet';

const failedAttempts = new Map();
const BLOCK_THRESHOLD = 50;
const BLOCK_WINDOW_MS = 15 * 60 * 1000;

export function securityMiddleware(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(xssProtection);
  app.use(requestSizeLimit('10mb'));
  app.use(ipBlocker);
}

function xssProtection(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

function requestSizeLimit(limit) {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const limitBytes = parseSize(limit);
    if (contentLength > limitBytes) {
      return res.status(413).json({ error: 'Request entity too large' });
    }
    next();
  };
}

function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  if (!match) return 10 * 1024 * 1024;
  return parseInt(match[1]) * units[match[2]];
}

function ipBlocker(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();

  if (!failedAttempts.has(ip)) {
    failedAttempts.set(ip, []);
  }

  const attempts = failedAttempts.get(ip).filter(t => t > now - BLOCK_WINDOW_MS);
  failedAttempts.set(ip, attempts);

  if (attempts.length >= BLOCK_THRESHOLD) {
    logger.warn(`IP blocked: ${ip} (${attempts.length} failures)`);
    return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
  }

  next();
}

export function recordFailure(req) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!failedAttempts.has(ip)) failedAttempts.set(ip, []);
  failedAttempts.get(ip).push(Date.now());
}

export function resetFailures(ip) {
  failedAttempts.delete(ip);
}

export function getFailedAttempts() {
  return failedAttempts.size;
}
