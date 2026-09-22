import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, passwordSchema, profileSchema } from '../validators/index.js';

const r = Router();
r.post('/login', loginLimiter, validate(loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', requireAdmin, c.me);
r.patch('/profile', requireAdmin, validate(profileSchema), c.updateProfile);
r.patch('/password', requireAdmin, validate(passwordSchema), c.changePassword);
export default r;
