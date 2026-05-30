import { get, getAll, run } from './db.js';

const DEFAULT_RATES = { RUB: 1, USD: 84, KZT: 0.17, UAH: 2.07 };
let ratesCache = null;
let lastRefresh = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function refreshRates() {
  try {
    const rows = await getAll('SELECT from_currency, to_currency, rate FROM exchange_rates');
    if (rows.length > 0) {
      ratesCache = {};
      for (const r of rows) {
        if (!ratesCache[r.from_currency]) ratesCache[r.from_currency] = {};
        ratesCache[r.from_currency][r.to_currency] = Number(r.rate);
      }
    }
    lastRefresh = Date.now();
  } catch {
    if (!ratesCache) ratesCache = buildDefaultRates();
  }
}

function buildDefaultRates() {
  const rates = {};
  for (const [from, fromRate] of Object.entries(DEFAULT_RATES)) {
    rates[from] = {};
    for (const [to, toRate] of Object.entries(DEFAULT_RATES)) {
      rates[from][to] = fromRate / toRate;
    }
  }
  return rates;
}

export async function convert(amount, from, to) {
  from = from.toUpperCase();
  to = to.toUpperCase();
  if (from === to) return amount;

  if (!ratesCache || Date.now() - lastRefresh > CACHE_TTL) {
    await refreshRates();
  }

  if (ratesCache[from] && ratesCache[from][to]) {
    return Math.round(amount * ratesCache[from][to] * 100) / 100;
  }

  const defaultRates = buildDefaultRates();
  if (defaultRates[from] && defaultRates[from][to]) {
    return Math.round(amount * defaultRates[from][to] * 100) / 100;
  }

  throw new Error(`Conversion from ${from} to ${to} not supported`);
}

export async function initDefaultRates() {
  try {
    const existing = await getAll('SELECT id FROM exchange_rates LIMIT 1');
    if (existing.length === 0) {
      for (const [from, fromRate] of Object.entries(DEFAULT_RATES)) {
        for (const [to, toRate] of Object.entries(DEFAULT_RATES)) {
          if (from !== to) {
            const rate = fromRate / toRate;
            await run('INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [from, to, rate]);
          }
        }
      }
      console.log('Default exchange rates initialized');
    }
  } catch (e) {
    console.error('Failed to init rates:', e.message);
  }
}

export function currencyMiddleware(req, res, next) {
  req.convert = async (amount, from, to) => convert(amount, from, to);
  next();
}

export function currencyRoutes(app, auth) {
  app.get('/api/currency/rates', async (req, res) => {
    try {
      if (!ratesCache || Date.now() - lastRefresh > CACHE_TTL) {
        await refreshRates();
      }
      const fallback = buildDefaultRates();
      const allRates = ratesCache || fallback;
      res.json({ rates: allRates, base_currency: 'RUB', updated_at: new Date(lastRefresh).toISOString() });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/currency/convert', async (req, res) => {
    try {
      const { amount, from, to } = req.body;
      if (!amount || !from || !to) return res.status(400).json({ error: 'amount, from, to required' });
      const result = await convert(Number(amount), from, to);
      res.json({ from: from.toUpperCase(), to: to.toUpperCase(), original: Number(amount), converted: result });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/currency/rates', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { rates } = req.body;
      if (!rates || typeof rates !== 'object') return res.status(400).json({ error: 'rates object required' });
      for (const [pair, rate] of Object.entries(rates)) {
        const [from, to] = pair.split('_');
        if (from && to && rate) {
          await run('INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES ($1, $2, $3) ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = $3, updated_at = NOW()', [from.toUpperCase(), to.toUpperCase(), Number(rate)]);
        }
      }
      await refreshRates();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { currencyRoutes, currencyMiddleware, convert };
