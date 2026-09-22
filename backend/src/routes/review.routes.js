import { Router } from 'express';
import * as c from '../controllers/review.controller.js';
import { adminScope, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { reorderSchema, reviewPatch, reviewSchema } from '../validators/index.js';

const r = Router();
r.get('/', adminScope, c.listReviews);
r.patch('/reorder', requireAdmin, validate(reorderSchema), c.reorderReviews);
r.post('/', requireAdmin, validate(reviewSchema), c.createReview);
r.put('/:id', requireAdmin, validate(reviewSchema), c.updateReview);
r.patch('/:id', requireAdmin, validate(reviewPatch), c.updateReview);
r.delete('/:id', requireAdmin, c.deleteReview);
export default r;
