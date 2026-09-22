import { MenuDocument } from '../models/MenuDocument.js';
import { MenuItem } from '../models/MenuItem.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, reorder, send, slugify } from '../utils/helpers.js';
import { MediaTx, applyMedia, destroyAsset } from '../services/media.service.js';
import { fileOf } from '../middleware/upload.middleware.js';

async function uniqueKey(title, ignoreId) {
  const base = slugify(title);
  let key = base;
  for (let n = 2; await MenuDocument.exists({ key, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) }); n += 1) key = `${base}-${n}`;
  return key;
}

export async function listDocs(req, res) {
  const docs = await MenuDocument.find(req.isAdminScope ? {} : { enabled: true }).sort({ displayOrder: 1, title: 1 });
  if (!req.isAdminScope) return send(res, docs);
  const counts = await MenuItem.aggregate([{ $group: { _id: '$menu', n: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  send(res, docs.map((d) => ({ ...d.toObject(), itemCount: map.get(String(d._id)) || 0 })));
}

export async function getDoc(req, res) {
  const id = assertObjectId(req.params.id);
  const doc = await MenuDocument.findOne(req.isAdminScope ? { _id: id } : { _id: id, enabled: true });
  if (!doc) throw ApiError.notFound('That menu could not be found.');
  send(res, doc);
}

export async function createDoc(req, res) {
  const { removePdf, removeCover, ...data } = req.body;
  const last = await MenuDocument.findOne().sort({ displayOrder: -1 });
  const doc = new MenuDocument({ ...data, key: await uniqueKey(data.title), displayOrder: data.displayOrder ?? (last ? last.displayOrder + 1 : 0) });
  const tx = new MediaTx();
  await applyMedia(tx, doc, 'pdf', { file: fileOf(req, 'pdf'), folder: 'menu-pdfs', alt: `${data.title} PDF` });
  await applyMedia(tx, doc, 'cover', { file: fileOf(req, 'cover'), folder: 'menu-covers', alt: `${data.title} cover` });
  await tx.run(() => doc.save());
  send(res, doc, { status: 201 });
}

export async function updateDoc(req, res) {
  const doc = await MenuDocument.findById(assertObjectId(req.params.id));
  if (!doc) throw ApiError.notFound('That menu could not be found.');
  const { removePdf, removeCover, ...data } = req.body;
  doc.set(data);
  const tx = new MediaTx();
  await applyMedia(tx, doc, 'pdf', { file: fileOf(req, 'pdf'), remove: removePdf, folder: 'menu-pdfs', alt: `${doc.title} PDF` });
  await applyMedia(tx, doc, 'cover', { file: fileOf(req, 'cover'), remove: removeCover, folder: 'menu-covers', alt: `${doc.title} cover` });
  await tx.run(() => doc.save());
  send(res, doc);
}

export async function reorderDocs(req, res) {
  await reorder(MenuDocument, req.body.ids);
  send(res, { message: 'Order saved.' });
}

export async function deleteDoc(req, res) {
  const id = assertObjectId(req.params.id);
  const doc = await MenuDocument.findById(id);
  if (!doc) throw ApiError.notFound('That menu could not be found.');
  const count = await MenuItem.countDocuments({ menu: id });
  if (count) throw ApiError.conflict(`This menu still contains ${count} dish${count === 1 ? '' : 'es'}. Move or delete them first.`, { itemCount: count });
  await doc.deleteOne();
  await Promise.all([destroyAsset(doc.pdf), destroyAsset(doc.cover)]);
  send(res, { message: 'Menu deleted.' });
}
