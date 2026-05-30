import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = join(__dirname, '..', 'logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  format: logFormat,
  defaultMeta: { service: 'keyzo-api' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: join(LOG_DIR, 'app.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}

export function errorLogger(err, req, res, next) {
  logger.error(`${err.message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });
  next(err);
}

export default logger;
