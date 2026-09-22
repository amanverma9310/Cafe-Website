import { Router } from 'express';
import * as c from '../controllers/enquiry.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { enquiryLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { enquiryPatch, enquirySchema } from '../validators/index.js';

const r = Router();
r.post('/', enquiryLimiter, validate(enquirySchema), c.submitEnquiry); // public
r.get('/', requireAdmin, c.listEnquiries);
r.get('/:id', requireAdmin, c.getEnquiry);
r.patch('/:id', requireAdmin, validate(enquiryPatch), c.patchEnquiry);
r.delete('/:id', requireAdmin, c.deleteEnquiry);
export default r;
