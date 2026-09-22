import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { requireCustomHeader } from './middleware/auth.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { sanitizeInput } from './middleware/validate.middleware.js';
import routes from './routes/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY); // Render sits behind a proxy; needed for secure cookies + rate limiting

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      // Explicit allow-list. Never "*" — credentialed (cookie) requests require a specific origin.
      origin(origin, cb) {
        if (!origin || env.clientOrigins.includes(origin.replace(/\/$/, ''))) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Dev/demo only: serves the bundled Agama assets when the database was seeded with `npm run seed:local`.
  if (env.seedMediaEnabled) {
    app.use('/seed-media', express.static(path.resolve(here, '../seed-assets'), { maxAge: '1h', fallthrough: true }));
  }

  app.use('/api', globalLimiter, sanitizeInput, requireCustomHeader, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
