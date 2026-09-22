import { About } from '../models/About.js';
import { Hero } from '../models/Hero.js';
import { HomeSection, HOME_SECTION_KEYS } from '../models/HomeSection.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, send } from '../utils/helpers.js';
import { getSingleton } from '../services/singleton.js';
import { MediaTx, applyMedia, destroyAsset } from '../services/media.service.js';
import { fileOf } from '../middleware/upload.middleware.js';

/* ---------- page heroes ---------- */
export const listHeroes = async (_req, res) => send(res, await Hero.find());

export async function getHero(req, res) {
  const hero = await Hero.findOne({ page: req.params.page });
  if (!hero) throw ApiError.notFound('That page banner has not been set up yet.');
  send(res, hero);
}

export async function updateHero(req, res) {
  const { removeImage, removeVideo, removeSecondaryImage, ...data } = req.body;
  const hero = (await Hero.findOne({ page: req.params.page })) ?? new Hero({ page: req.params.page });
  hero.set(data);
  const tx = new MediaTx();
  await applyMedia(tx, hero, 'image', { file: fileOf(req, 'image'), remove: removeImage, folder: `heroes/${req.params.page}`, alt: req.body.imageAlt });
  await applyMedia(tx, hero, 'video', { file: fileOf(req, 'video'), remove: removeVideo, folder: `heroes/${req.params.page}`, alt: `${hero.title} video` });
  await applyMedia(tx, hero, 'secondaryImage', { file: fileOf(req, 'secondaryImage'), remove: removeSecondaryImage, folder: `heroes/${req.params.page}`, alt: `${hero.title} photo` });
  await tx.run(() => hero.save());
  send(res, hero);
}

/* ---------- about page ---------- */
export const getAbout = async (_req, res) => send(res, await getSingleton(About));

export async function updateAbout(req, res) {
  const doc = await getSingleton(About);
  const { removeStoryImage, ...data } = req.body;
  doc.set(data);
  const tx = new MediaTx();
  await applyMedia(tx, doc, 'storyImage', { file: fileOf(req, 'storyImage'), remove: removeStoryImage, folder: 'about', alt: data.storyTitle });
  await tx.run(() => doc.save());
  send(res, doc);
}

/* ---------- home sections ---------- */
const byOrder = (a, b) => a.order - b.order;
const sortImages = (s) => {
  const o = s.toObject ? s.toObject() : s;
  o.images = [...(o.images || [])].sort(byOrder);
  return o;
};

export async function homeContent(_req, res) {
  const [hero, sections] = await Promise.all([Hero.findOne({ page: 'home' }), HomeSection.find({ enabled: true })]);
  send(res, { hero, sections: sections.sort(byOrder).map(sortImages) });
}

export async function listSections(_req, res) {
  const sections = await HomeSection.find();
  send(res, sections.sort(byOrder).map(sortImages));
}

async function sectionOr404(key) {
  const s = await HomeSection.findOne({ key });
  if (!s) throw ApiError.notFound('That home section could not be found.');
  return s;
}

export async function updateSection(req, res) {
  const s = await sectionOr404(req.params.key);
  s.set(req.body);
  await s.save();
  send(res, sortImages(s));
}

export async function reorderSections(req, res) {
  const rest = HOME_SECTION_KEYS.filter((k) => !req.body.keys.includes(k));
  const keys = [...req.body.keys, ...rest];
  await HomeSection.bulkWrite(keys.map((key, i) => ({ updateOne: { filter: { key }, update: { $set: { order: i } } } })));
  send(res, { message: 'Order saved.' });
}

export async function setSectionVideo(req, res) {
  const s = await sectionOr404(req.params.key);
  const file = fileOf(req, 'video');
  if (!file) throw ApiError.invalid('Choose a video to upload.', { video: 'Choose a video to upload.' });
  const tx = new MediaTx();
  await applyMedia(tx, s, 'video', { file, folder: 'reel', alt: req.body.alt ?? s.title });
  await tx.run(() => s.save());
  send(res, sortImages(s));
}

export async function removeSectionVideo(req, res) {
  const s = await sectionOr404(req.params.key);
  const old = s.video?.toObject?.();
  s.set('video', undefined);
  await s.save();
  await destroyAsset(old);
  send(res, sortImages(s));
}

export async function addSectionImage(req, res) {
  const s = await sectionOr404(req.params.key);
  const file = fileOf(req, 'image');
  if (!file) throw ApiError.invalid('Choose an image to upload.', { image: 'Choose an image to upload.' });
  const tx = new MediaTx();
  const media = await tx.put(file, `home/${s.key}`);
  s.images.push({ ...media, alt: req.body.alt, caption: req.body.caption, blend: Boolean(req.body.blend), order: s.images.length });
  await tx.run(() => s.save());
  send(res, sortImages(s), { status: 201 });
}

export async function updateSectionImage(req, res) {
  const s = await sectionOr404(req.params.key);
  const img = s.images.id(assertObjectId(req.params.imageId));
  if (!img) throw ApiError.notFound('That image could not be found.');
  const tx = new MediaTx();
  const file = fileOf(req, 'image');
  if (file) {
    tx.discard(img.toObject());
    Object.assign(img, await tx.put(file, `home/${s.key}`));
  }
  img.alt = req.body.alt;
  img.caption = req.body.caption;
  if (req.body.blend !== undefined) img.blend = req.body.blend;
  await tx.run(() => s.save());
  send(res, sortImages(s));
}

export async function deleteSectionImage(req, res) {
  const s = await sectionOr404(req.params.key);
  const img = s.images.id(assertObjectId(req.params.imageId));
  if (!img) throw ApiError.notFound('That image could not be found.');
  const old = img.toObject();
  img.deleteOne();
  await s.save();
  await Promise.all([destroyAsset(old), destroyAsset(old.video)]); // the photo and its clip
  send(res, sortImages(s));
}

export async function reorderSectionImages(req, res) {
  const s = await sectionOr404(req.params.key);
  req.body.ids.forEach((id, i) => {
    const img = s.images.id(id);
    if (img) img.order = i;
  });
  await s.save();
  send(res, sortImages(s));
}

/* ---------- short clip attached to a section photo (dish showcase) ---------- */
export async function setImageVideo(req, res) {
  const s = await sectionOr404(req.params.key);
  const img = s.images.id(assertObjectId(req.params.imageId));
  if (!img) throw ApiError.notFound('That photo could not be found.');
  const file = fileOf(req, 'video');
  if (!file) throw ApiError.invalid('Choose a video to upload.', { video: 'Choose a video to upload.' });
  const tx = new MediaTx();
  const media = await tx.put(file, `home/${s.key}/clips`);
  tx.discard(img.video?.toObject?.());
  img.video = { ...media, alt: img.caption || img.alt || '' };
  await tx.run(() => s.save());
  send(res, sortImages(s));
}

export async function removeImageVideo(req, res) {
  const s = await sectionOr404(req.params.key);
  const img = s.images.id(assertObjectId(req.params.imageId));
  if (!img) throw ApiError.notFound('That photo could not be found.');
  const old = img.video?.toObject?.();
  img.set('video', undefined);
  await s.save();
  await destroyAsset(old);
  send(res, sortImages(s));
}
