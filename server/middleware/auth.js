import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../../.env` });

const JWT_SECRET = process.env.JWT_SECRET || 'xK9#mP2$vL8@nQ4#wR7!tY6&uI3*eO1?aS5^dF0%gH9#jK2$lZ8';

export function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  next();
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

export function sellerOnly(req, res, next) {
  if (req.user?.role !== 'seller' && req.user?.role !== 'admin') return res.status(403).json({ error: 'Seller only' });
  next();
}

export default auth;
