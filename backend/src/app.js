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

  // Render runs behind a proxy.
  // Needed for secure cookies and rate limiting.
  app.set('trust proxy', env.TRUST_PROXY);

  // -------------------------------------------------------
  // SECURITY HEADERS
  // -------------------------------------------------------

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );

  // -------------------------------------------------------
  // CORS
  // -------------------------------------------------------

  const corsOptions = {
    origin(origin, callback) {
      // Allow requests without Origin header.
      // Example: Postman, Render health checks,
      // server-to-server requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Remove trailing slash if present.
      const cleanOrigin = origin.replace(/\/$/, '');

      const allowedOrigins = (env.clientOrigins || []).map((item) =>
        item.replace(/\/$/, ''),
      );

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);

      return callback(
        new Error(`CORS blocked origin: ${origin}`),
      );
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
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],

    exposedHeaders: [
      'Content-Length',
      'Content-Type',
    ],

    optionsSuccessStatus: 204,

    // Cache preflight response for 10 minutes.
    maxAge: 600,
  };

  app.use(cors(corsOptions));

  // Explicitly handle preflight requests.
  app.options('*', cors(corsOptions));

  // -------------------------------------------------------
  // COMPRESSION
  // -------------------------------------------------------

  app.use(compression());

  // -------------------------------------------------------
  // LOGGING
  // -------------------------------------------------------

  if (env.NODE_ENV !== 'test') {
    app.use(
      morgan(env.isProd ? 'combined' : 'dev'),
    );
  }

  // -------------------------------------------------------
  // COOKIES
  // -------------------------------------------------------

  app.use(cookieParser());

  // -------------------------------------------------------
  // BODY PARSERS
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // STATIC SEED IMAGES
  // -------------------------------------------------------
  //
  // Folder structure:
  //
  // backend/
  //   seed-assets/
  //     interior/
  //     food/
  //     drinks/
  //     hero/
  //     exterior/
  //     menu/
  //
  //   src/
  //     app.js
  //
  // Example:
  //
  // backend/seed-assets/interior/interior-seating-wide.png
  //
  // becomes:
  //
  // /seed-media/interior/interior-seating-wide.png
  //
  // Keep this enabled in production so Render can serve
  // the seed images as well.
  // -------------------------------------------------------

  const seedAssetsPath = path.resolve(
    here,
    '../seed-assets',
  );

  app.use(
    '/seed-media',
    express.static(seedAssetsPath, {
      maxAge: '1h',
      fallthrough: true,
    }),
  );

  // -------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------

  app.use(
    '/api',
    globalLimiter,
    sanitizeInput,
    requireCustomHeader,
    routes,
  );

  // -------------------------------------------------------
  // 404 HANDLER
  // -------------------------------------------------------
  //
  // Must stay after all routes.
  // -------------------------------------------------------

  app.use(notFoundHandler);

  // -------------------------------------------------------
  // ERROR HANDLER
  // -------------------------------------------------------
  //
  // Must always be the final middleware.
  // -------------------------------------------------------

  app.use(errorHandler);

  return app;
}