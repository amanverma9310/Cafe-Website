import 'dotenv/config';
import { z } from 'zod';

const bool = (d) => z.preprocess((v) => (v === undefined || v === '' ? d : String(v) === 'true'), z.boolean());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).optional(),
  COOKIE_SECURE: bool(undefined).optional(),
  COOKIE_DOMAIN: z.string().optional(),
  TRUST_PROXY: z.coerce.number().default(1),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('agama'),
  MAX_IMAGE_MB: z.coerce.number().default(10),
  MAX_PDF_MB: z.coerce.number().default(25),
  MAX_VIDEO_MB: z.coerce.number().default(60),
  ENABLE_SEED_MEDIA: bool(undefined).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const msg = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`\nInvalid environment configuration:\n${msg}\n`);
  process.exit(1);
}
const e = parsed.data;
const isProd = e.NODE_ENV === 'production';

if (isProd && e.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

export const env = {
  ...e,
  isProd,
  clientOrigins: e.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  cookie: {
    // Cross-site (Vercel -> Render on different domains) needs SameSite=None + Secure.
    sameSite: e.COOKIE_SAMESITE ?? (isProd ? 'none' : 'lax'),
    secure: e.COOKIE_SECURE ?? isProd,
    domain: e.COOKIE_DOMAIN || undefined,
  },
  cloudinaryConfigured: Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET),
  seedMediaEnabled: e.ENABLE_SEED_MEDIA ?? !isProd,
  limits: { image: e.MAX_IMAGE_MB * 1024 * 1024, pdf: e.MAX_PDF_MB * 1024 * 1024, video: e.MAX_VIDEO_MB * 1024 * 1024 },
};
