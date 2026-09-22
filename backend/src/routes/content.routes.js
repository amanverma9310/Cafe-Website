import { Router } from 'express';
import * as c from '../controllers/content.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aboutSchema, heroPageParam, heroSchema, homeSectionKey, homeSectionSchema, reorderSchema, sectionImageSchema, sectionOrderSchema } from '../validators/index.js';
import { ApiError } from '../utils/ApiError.js';

const param = (name, schema) => (req, _res, next, val) => {
  if (!schema.safeParse(val).success) return next(ApiError.notFound());
  next();
};

export const heroRouter = Router();
heroRouter.param('page', param('page', heroPageParam));
heroRouter.get('/', c.listHeroes);
heroRouter.get('/:page', c.getHero);
heroRouter.put('/:page', requireAdmin, ...uploadFields({ image: 'image', video: 'video', secondaryImage: 'image' }), validate(heroSchema), c.updateHero);

export const aboutRouter = Router();
aboutRouter.get('/', c.getAbout);
aboutRouter.put('/', requireAdmin, ...uploadFields({ storyImage: 'image' }), validate(aboutSchema), c.updateAbout);

export const homeRouter = Router();
homeRouter.get('/', c.homeContent);

export const sectionRouter = Router();
sectionRouter.param('key', param('key', homeSectionKey));
sectionRouter.use(requireAdmin);
sectionRouter.get('/', c.listSections);
sectionRouter.patch('/reorder', validate(sectionOrderSchema), c.reorderSections);
sectionRouter.put('/:key', validate(homeSectionSchema), c.updateSection);
sectionRouter.put('/:key/video', ...uploadFields({ video: 'video' }), c.setSectionVideo);
sectionRouter.delete('/:key/video', c.removeSectionVideo);
sectionRouter.post('/:key/images', ...uploadFields({ image: 'image' }), validate(sectionImageSchema), c.addSectionImage);
sectionRouter.patch('/:key/images/reorder', validate(reorderSchema), c.reorderSectionImages);
sectionRouter.put('/:key/images/:imageId', ...uploadFields({ image: 'image' }), validate(sectionImageSchema), c.updateSectionImage);
sectionRouter.put('/:key/images/:imageId/video', ...uploadFields({ video: 'video' }), c.setImageVideo);
sectionRouter.delete('/:key/images/:imageId/video', c.removeImageVideo);
sectionRouter.delete('/:key/images/:imageId', c.deleteSectionImage);
