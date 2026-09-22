import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export const assertObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound();
  return id;
};

/** Removes internal fields (Cloudinary public ids, __v) from anything sent to visitors. */
export function toPublic(value) {
  if (Array.isArray(value)) return value.map(toPublic);
  if (value instanceof Date || value instanceof mongoose.Types.ObjectId) return value;
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'publicId' || k === '__v' || k === 'passwordHash') continue;
      out[k === '_id' ? 'id' : k] = toPublic(v);
    }
    return out;
  }
  return value;
}

export const plain = (doc) => (doc?.toObject ? doc.toObject() : doc);

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-') || 'item';

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "7d" | "12h" | "30m" -> milliseconds */
export function durationToMs(str) {
  const m = /^(\d+)\s*([smhd])$/.exec(String(str).trim());
  if (!m) return 7 * 24 * 3600 * 1000;
  return Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
}

export function pageParams(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageMeta = (page, limit, total) => ({ page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });

export const boolQuery = (v) => (v === 'true' || v === true ? true : v === 'false' || v === false ? false : undefined);

/** Uniform JSON envelope. Round-trips through JSON so mongoose docs become plain data, then strips internals. */
export function send(res, data, { status = 200, meta } = {}) {
  const plainData = data === undefined ? undefined : JSON.parse(JSON.stringify(data));
  res.status(status).json({ success: true, ...(plainData !== undefined ? { data: toPublic(plainData) } : {}), ...(meta ? { meta } : {}) });
}

export async function reorder(Model, ids, field = 'displayOrder') {
  if (!Array.isArray(ids) || !ids.length) throw ApiError.invalid('No order was provided.');
  await Model.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { [field]: i } } } })));
}
