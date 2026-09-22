import { Router } from 'express';
import * as c from '../controllers/site.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { businessSchema, hoursSchema, siteSettingsSchema } from '../validators/index.js';

export const siteRouter = Router();
siteRouter.get('/', c.bootstrap);

export const settingsRouter = Router();
settingsRouter.get('/', c.getSettings);
settingsRouter.put('/', requireAdmin, ...uploadFields({ logo: 'image', favicon: 'image', seoImage: 'image' }), validate(siteSettingsSchema), c.updateSettings);

export const businessRouter = Router();
businessRouter.get('/', c.getBusiness);
businessRouter.put('/', requireAdmin, validate(businessSchema), c.updateBusiness);

export const hoursRouter = Router();
hoursRouter.get('/', c.getHours);
hoursRouter.put('/', requireAdmin, validate(hoursSchema), c.updateHours);
