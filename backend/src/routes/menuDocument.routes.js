import { Router } from 'express';
import * as c from '../controllers/menuDocument.controller.js';
import { adminScope, requireAdmin } from '../middleware/auth.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { menuDocSchema, reorderSchema } from '../validators/index.js';

const r = Router();
const files = uploadFields({ pdf: 'pdf', cover: 'image' });
r.get('/', adminScope, c.listDocs);
r.patch('/reorder', requireAdmin, validate(reorderSchema), c.reorderDocs);
r.get('/:id', adminScope, c.getDoc);
r.post('/', requireAdmin, ...files, validate(menuDocSchema), c.createDoc);
r.put('/:id', requireAdmin, ...files, validate(menuDocSchema), c.updateDoc);
r.delete('/:id', requireAdmin, c.deleteDoc);
export default r;
