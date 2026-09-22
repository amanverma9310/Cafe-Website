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
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { sanitizeInput } from './middleware/validate.middleware.js';
import routes from './routes/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Render sits behind a proxy.
  // Needed for secure cookies and rate limiting.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );

  app.use(
    cors({
      origin(origin, cb) {
        // Allow requests without an Origin header
        // such as Postman/server-to-server requests.
        if (!origin) {
          return cb(null, true);
        }

        const cleanOrigin = origin.replace(/\/$/, '');

        if (env.clientOrigins.includes(cleanOrigin)) {
          return cb(null, true);
        }

        return cb(new Error(`CORS blocked origin: ${origin}`));
      },

      credentials: true,

      methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],

      allowedHeaders: [
        'Content-Type',
        'X-Requested-With',
      ],

      maxAge: 600,
    }),
  );

  app.use(compression());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }

  app.use(cookieParser());

  app.use(
    express.json({
      limit: '1mb',
    }),
  );

  app.use(
    express.urlencoded({
      extended: false,
      limit: '1mb',
    }),
  );

  /*
   * -------------------------------------------------------
   * STATIC SEED IMAGES
   * -------------------------------------------------------
   *
   * Current structure:
   *
   * backend/
   *   seed-assets/
   *     interior/
   *     food/
   *     drinks/
   *     hero/
   *     exterior/
   *     menu/
   *   src/
   *     app.js
   *
   * Example:
   *
   * backend/seed-assets/interior/interior-seating-wide.png
   *
   * becomes:
   *
   * /seed-media/interior/interior-seating-wide.png
   *
   * IMPORTANT:
   * Do NOT put this inside:
   *
   * if (env.seedMediaEnabled)
   *
   * because Render also needs access to these files.
   */
  const seedAssetsPath = path.resolve(here, '../seed-assets');

  app.use(
    '/seed-media',
    express.static(seedAssetsPath, {
      maxAge: '1h',
      fallthrough: true,
    }),
  );

  /*
   * API routes
   */
  app.use(
    '/api',
    globalLimiter,
    sanitizeInput,
    requireCustomHeader,
    routes,
  );

  /*
   * 404 handler must stay AFTER
   * static files and API routes.
   */
  app.use(notFoundHandler);

  /*
   * Error handler must be last.
   */
  app.use(errorHandler);

  return app;
}