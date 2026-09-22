import { MenuCategory } from '../models/MenuCategory.js';
import { MenuDocument } from '../models/MenuDocument.js';
import { MenuItem } from '../models/MenuItem.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, boolQuery, escapeRegex, pageMeta, pageParams, reorder, send, slugify } from '../utils/helpers.js';
import { MediaTx, applyMedia, destroyAsset } from '../services/media.service.js';
import { fileOf } from '../middleware/upload.middleware.js';

const populate = [
  { path: 'category', select: 'name slug displayOrder enabled' },
  { path: 'menu', select: 'key title type enabled' },
];

async function assertRefs({ category, menu }) {
  const [c, m] = await Promise.all([MenuCategory.findById(category), MenuDocument.findById(menu)]);
  if (!c) throw ApiError.invalid('Choose a valid category.', { category: 'Choose a valid category.' });
  if (!m) throw ApiError.invalid('Choose a valid menu.', { menu: 'Choose a valid menu.' });
  if (m.type === 'bar') throw ApiError.invalid('The bar menu is an informational PDF and cannot hold dishes.', { menu: 'Choose a different menu.' });
}

/* ---------------- items ---------------- */
export async function listItems(req, res) {
  const q = req.query;
  const filter = {};
  if (!req.isAdminScope) {
    filter.available = true;
    const [cats, menus] = await Promise.all([MenuCategory.find({ enabled: true }).select('_id'), MenuDocument.find({ enabled: true }).select('_id key')]);
    filter.category = { $in: cats.map((c) => c._id) };
    filter.menu = { $in: menus.map((m) => m._id) };
  }
  if (q.menu) {
    const doc = /^[a-f\d]{24}$/i.test(q.menu) ? await MenuDocument.findById(q.menu) : await MenuDocument.findOne({ key: String(q.menu).toLowerCase() });
    if (!doc || (!req.isAdminScope && !doc.enabled)) return send(res, [], { meta: pageMeta(1, 1, 0) });
    filter.menu = doc._id;
  }
  if (q.category) {
    if (!/^[a-f\d]{24}$/i.test(q.category)) {
      const cat = await MenuCategory.findOne({ slug: String(q.category).toLowerCase() });
      if (!cat) return send(res, [], { meta: pageMeta(1, 1, 0) });
      filter.category = cat._id;
    } else filter.category = q.category;
  }
  const featured = boolQuery(q.featured);
  if (featured !== undefined) filter.featured = featured;
  if (req.isAdminScope) {
    const available = boolQuery(q.available);
    if (available !== undefined) filter.available = available;
    if (q.q) {
      const rx = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
      filter.$or = [{ name: rx }, { description: rx }];
    }
  }

  const { page, limit, skip } = pageParams(q, { defaultLimit: req.isAdminScope ? 20 : 500, maxLimit: 500 });
  const [total, docs] = await Promise.all([
    MenuItem.countDocuments(filter),
    MenuItem.find(filter).sort({ displayOrder: 1, name: 1 }).skip(skip).limit(limit).populate(populate),
  ]);
  let items = docs;
  if (!req.isAdminScope) {
    items = [...docs].sort(
      (a, b) => (a.category?.displayOrder ?? 0) - (b.category?.displayOrder ?? 0) || a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
  }
  send(res, items, { meta: pageMeta(page, limit, total) });
}

export async function getItem(req, res) {
  const item = await MenuItem.findById(assertObjectId(req.params.id)).populate(populate);
  if (!item || (!req.isAdminScope && !item.available)) throw ApiError.notFound('That dish could not be found.');
  send(res, item);
}

export async function createItem(req, res) {
  const { removeImage, ...data } = req.body;
  await assertRefs(data);
  const item = new MenuItem(data);
  const tx = new MediaTx();
  await applyMedia(tx, item, 'image', { file: fileOf(req, 'image'), folder: 'menu-items', alt: data.name });
  await tx.run(() => item.save());
  await item.populate(populate);
  send(res, item, { status: 201 });
}

export async function updateItem(req, res) {
  const item = await MenuItem.findById(assertObjectId(req.params.id));
  if (!item) throw ApiError.notFound('That dish could not be found.');
  const { removeImage, ...data } = req.body;
  await assertRefs(data);
  item.set({ ...data, price: data.price ?? null });
  const tx = new MediaTx();
  await applyMedia(tx, item, 'image', { file: fileOf(req, 'image'), remove: removeImage, folder: 'menu-items', alt: data.name });
  await tx.run(() => item.save());
  await item.populate(populate);
  send(res, item);
}

export async function patchItem(req, res) {
  const item = await MenuItem.findByIdAndUpdate(assertObjectId(req.params.id), { $set: req.body }, { new: true, runValidators: true }).populate(populate);
  if (!item) throw ApiError.notFound('That dish could not be found.');
  send(res, item);
}

export async function deleteItem(req, res) {
  const item = await MenuItem.findByIdAndDelete(assertObjectId(req.params.id));
  if (!item) throw ApiError.notFound('That dish could not be found.');
  await destroyAsset(item.image);
  send(res, { message: 'Menu item deleted.' });
}

/* ---------------- categories ---------------- */
async function uniqueSlug(name, ignoreId) {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; await MenuCategory.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) }); n += 1) slug = `${base}-${n}`;
  return slug;
}

export async function listCategories(req, res) {
  const filter = req.isAdminScope ? {} : { enabled: true };
  const cats = await MenuCategory.find(filter).sort({ displayOrder: 1, name: 1 });
  if (!req.isAdminScope) return send(res, cats);
  const counts = await MenuItem.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  send(res, cats.map((c) => ({ ...c.toObject(), itemCount: map.get(String(c._id)) || 0 })));
}

export async function createCategory(req, res) {
  const last = await MenuCategory.findOne().sort({ displayOrder: -1 });
  const cat = await MenuCategory.create({ ...req.body, slug: await uniqueSlug(req.body.name), displayOrder: req.body.displayOrder ?? (last ? last.displayOrder + 1 : 0) });
  send(res, cat, { status: 201 });
}

export async function updateCategory(req, res) {
  const cat = await MenuCategory.findById(assertObjectId(req.params.id));
  if (!cat) throw ApiError.notFound('That category could not be found.');
  cat.set(req.body);
  if (cat.isModified('name')) cat.slug = await uniqueSlug(cat.name, cat._id);
  await cat.save();
  send(res, cat);
}

export async function reorderCategories(req, res) {
  await reorder(MenuCategory, req.body.ids);
  send(res, { message: 'Order saved.' });
}

/** Refuses to delete a category that still has dishes unless they are reassigned (?reassignTo=) or removed (?deleteItems=true). */
export async function deleteCategory(req, res) {
  const id = assertObjectId(req.params.id);
  const cat = await MenuCategory.findById(id);
  if (!cat) throw ApiError.notFound('That category could not be found.');
  const count = await MenuItem.countDocuments({ category: id });
  if (count) {
    const { reassignTo, deleteItems } = req.query;
    if (reassignTo) {
      if (reassignTo === String(id) || !(await MenuCategory.exists({ _id: assertObjectId(reassignTo) }))) throw ApiError.invalid('Choose a different category to move the dishes to.');
      await MenuItem.updateMany({ category: id }, { $set: { category: reassignTo } });
    } else if (deleteItems === 'true') {
      const items = await MenuItem.find({ category: id });
      await MenuItem.deleteMany({ category: id });
      await Promise.all(items.map((i) => destroyAsset(i.image)));
    } else {
      throw ApiError.conflict(`This category still has ${count} dish${count === 1 ? '' : 'es'}. Move them to another category or confirm deleting them.`, { itemCount: count });
    }
  }
  await cat.deleteOne();
  send(res, { message: 'Category deleted.', moved: Boolean(req.query.reassignTo) });
}
