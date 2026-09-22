import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { durationToMs } from '../utils/helpers.js';

export const COOKIE_NAME = 'agama_token';

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/',
  maxAge: durationToMs(env.JWT_EXPIRES_IN),
});

export function issueSession(res, admin) {
  const token = jwt.sign({ sub: String(admin._id), tv: admin.tokenVersion }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearSession(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
}

export async function requireAdmin(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw ApiError.unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }
  const admin = await Admin.findById(payload.sub);
  if (!admin || admin.tokenVersion !== payload.tv) throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  req.admin = admin;
  next();
}

/** GET routes: `?scope=admin` requires a session and unlocks hidden records; otherwise public. */
export async function adminScope(req, res, next) {
  req.isAdminScope = false;
  if (req.query.scope === 'admin') {
    await requireAdmin(req, res, () => {});
    req.isAdminScope = true;
  }
  next();
}

/**
 * CSRF defence for cookie auth: unsafe methods must carry a custom header. Browsers only allow
 * custom headers cross-origin after a CORS preflight, which our allow-list rejects for other sites.
 */
export function requireCustomHeader(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'agama-web') throw ApiError.forbidden('Missing required request header.');
  next();
}
