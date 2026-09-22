import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit: env.NODE_ENV === 'test' ? 1000 : limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
  });

export const globalLimiter = make(15 * 60 * 1000, 600, 'Too many requests. Please slow down and try again shortly.');
export const loginLimiter = make(15 * 60 * 1000, 10, 'Too many sign-in attempts. Please wait 15 minutes and try again.');
export const enquiryLimiter = make(60 * 60 * 1000, 8, 'You have sent several enquiries recently. Please call the cafe or try again later.');
