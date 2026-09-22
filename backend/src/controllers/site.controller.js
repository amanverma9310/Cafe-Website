import { Business } from '../models/Business.js';
import { OpeningHours } from '../models/OpeningHours.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { send } from '../utils/helpers.js';
import { getSingleton } from '../services/singleton.js';
import { MediaTx, applyMedia } from '../services/media.service.js';
import { fileOf } from '../middleware/upload.middleware.js';

export const getSettings = async (_req, res) => send(res, await getSingleton(SiteSettings));
export const getBusiness = async (_req, res) => send(res, await getSingleton(Business, { name: 'Agama Cafe & Bar' }));
export const getHours = async (_req, res) => send(res, await getSingleton(OpeningHours));

export async function bootstrap(_req, res) {
  const [settings, business, hours] = await Promise.all([
    getSingleton(SiteSettings),
    getSingleton(Business, { name: 'Agama Cafe & Bar' }),
    getSingleton(OpeningHours),
  ]);
  send(res, { settings, business, hours });
}

export async function updateSettings(req, res) {
  const doc = await getSingleton(SiteSettings);
  const { removeLogo, removeFavicon, removeSeoImage, ...data } = req.body;
  doc.set(data);
  const tx = new MediaTx();
  await applyMedia(tx, doc, 'logo', { file: fileOf(req, 'logo'), remove: removeLogo, folder: 'site', alt: 'Logo' });
  await applyMedia(tx, doc, 'favicon', { file: fileOf(req, 'favicon'), remove: removeFavicon, folder: 'site', alt: 'Favicon' });
  await applyMedia(tx, doc, 'seoImage', { file: fileOf(req, 'seoImage'), remove: removeSeoImage, folder: 'site', alt: 'Social sharing image' });
  await tx.run(() => doc.save());
  send(res, doc);
}

export async function updateBusiness(req, res) {
  const doc = await getSingleton(Business, { name: 'Agama Cafe & Bar' });
  doc.set(req.body);
  await doc.save();
  send(res, doc);
}

export async function updateHours(req, res) {
  const doc = await getSingleton(OpeningHours);
  doc.set(req.body);
  await doc.save();
  send(res, doc);
}
