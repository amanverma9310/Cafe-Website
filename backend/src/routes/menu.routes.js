import { Router } from 'express';
import * as c from '../controllers/menu.controller.js';
import { adminScope, requireAdmin } from '../middleware/auth.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { categorySchema, menuItemPatch, menuItemSchema, reorderSchema } from '../validators/index.js';

export const menuRouter = Router();
menuRouter.get('/', adminScope, c.listItems);
menuRouter.get('/:id', adminScope, c.getItem);
menuRouter.post('/', requireAdmin, ...uploadFields({ image: 'image' }), validate(menuItemSchema), c.createItem);
menuRouter.put('/:id', requireAdmin, ...uploadFields({ image: 'image' }), validate(menuItemSchema), c.updateItem);
menuRouter.patch('/:id', requireAdmin, validate(menuItemPatch), c.patchItem);
menuRouter.delete('/:id', requireAdmin, c.deleteItem);

export const categoryRouter = Router();
categoryRouter.get('/', adminScope, c.listCategories);
categoryRouter.post('/', requireAdmin, validate(categorySchema), c.createCategory);
categoryRouter.patch('/reorder', requireAdmin, validate(reorderSchema), c.reorderCategories);
categoryRouter.put('/:id', requireAdmin, validate(categorySchema), c.updateCategory);
categoryRouter.delete('/:id', requireAdmin, c.deleteCategory);
