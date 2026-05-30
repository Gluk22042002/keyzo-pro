import { get } from './db.js';

export function healthRoutes(app) {
  app.get('/api/health', async (req, res) => {
    const checks = { server: 'ok', database: 'ok', timestamp: new Date().toISOString() };

    try {
      const dbStart = Date.now();
      await get('SELECT 1');
      checks.database = 'ok';
      checks.databaseLatency = `${Date.now() - dbStart}ms`;
    } catch (e) {
      checks.database = 'error';
      checks.databaseError = e.message;
    }

    const memUsage = process.memoryUsage();
    checks.uptime = `${Math.floor(process.uptime())}s`;
    checks.memory = {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    };
    checks.version = '1.0.0';
    checks.nodeVersion = process.version;
    checks.platform = process.platform;

    const allOk = checks.server === 'ok' && checks.database === 'ok';
    res.status(allOk ? 200 : 503).json(checks);
  });
}
