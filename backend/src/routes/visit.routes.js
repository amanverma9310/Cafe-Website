import { Router } from 'express';
import * as c from '../controllers/visit.controller.js';
import { visitLimiter } from '../middleware/rateLimit.middleware.js';

const r = Router();
r.post('/', visitLimiter, c.recordVisit); // public — pinged once per page view by the public site
export default r;
