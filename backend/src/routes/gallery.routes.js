import { Router } from 'express';
import * as c from '../controllers/gallery.controller.js';
import { adminScope, requireAdmin } from '../middleware/auth.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { galleryPatch, gallerySchema, reorderSchema } from '../validators/index.js';

const r = Router();
const file = uploadFields({ image: 'image' });
r.get('/', adminScope, c.listGallery);
r.get('/types', c.galleryTypes);
r.patch('/reorder', requireAdmin, validate(reorderSchema), c.reorderGallery);
r.post('/', requireAdmin, ...file, validate(gallerySchema), c.createImage);
r.put('/:id', requireAdmin, ...file, validate(gallerySchema), c.updateImage);
r.patch('/:id', requireAdmin, validate(galleryPatch), c.patchImage);
r.delete('/:id', requireAdmin, c.deleteImage);
export default r;
