import { GalleryImage } from '../models/GalleryImage.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, boolQuery, escapeRegex, pageMeta, pageParams, reorder, send } from '../utils/helpers.js';
import { MediaTx, applyMedia, destroyAsset } from '../services/media.service.js';
import { fileOf } from '../middleware/upload.middleware.js';

export async function listGallery(req, res) {
  const q = req.query;
  const filter = req.isAdminScope ? {} : { enabled: true };
  if (q.type) filter.type = String(q.type);
  const featured = boolQuery(q.featured);
  if (featured !== undefined) filter.featured = featured;
  if (req.isAdminScope) {
    const enabled = boolQuery(q.enabled);
    if (enabled !== undefined) filter.enabled = enabled;
    if (q.q) filter.alt = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
  }
  const { page, limit, skip } = pageParams(q, { defaultLimit: req.isAdminScope ? 24 : 200, maxLimit: 200 });
  const [total, items] = await Promise.all([
    GalleryImage.countDocuments(filter),
    GalleryImage.find(filter).sort({ displayOrder: 1, createdAt: 1 }).skip(skip).limit(limit),
  ]);
  send(res, items, { meta: pageMeta(page, limit, total) });
}

export async function galleryTypes(_req, res) {
  const types = await GalleryImage.distinct('type');
  send(res, types.sort());
}

export async function createImage(req, res) {
  const file = fileOf(req, 'image');
  if (!file) throw ApiError.invalid('Choose an image to upload.', { image: 'Choose an image to upload.' });
  const last = await GalleryImage.findOne().sort({ displayOrder: -1 });
  const doc = new GalleryImage({ ...req.body, displayOrder: req.body.displayOrder ?? (last ? last.displayOrder + 1 : 0), image: {} });
  const tx = new MediaTx();
  await applyMedia(tx, doc, 'image', { file, folder: 'gallery', alt: req.body.alt });
  await tx.run(() => doc.save());
  send(res, doc, { status: 201 });
}

export async function updateImage(req, res) {
  const doc = await GalleryImage.findById(assertObjectId(req.params.id));
  if (!doc) throw ApiError.notFound('That image could not be found.');
  doc.set(req.body);
  const tx = new MediaTx();
  await applyMedia(tx, doc, 'image', { file: fileOf(req, 'image'), folder: 'gallery', alt: req.body.alt });
  await tx.run(() => doc.save());
  send(res, doc);
}

export async function patchImage(req, res) {
  const doc = await GalleryImage.findByIdAndUpdate(assertObjectId(req.params.id), { $set: req.body }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('That image could not be found.');
  send(res, doc);
}

export async function reorderGallery(req, res) {
  await reorder(GalleryImage, req.body.ids);
  send(res, { message: 'Order saved.' });
}

export async function deleteImage(req, res) {
  const doc = await GalleryImage.findByIdAndDelete(assertObjectId(req.params.id));
  if (!doc) throw ApiError.notFound('That image could not be found.');
  await destroyAsset(doc.image);
  send(res, { message: 'Image deleted.' });
}
