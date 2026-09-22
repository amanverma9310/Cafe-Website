import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePayload } from './validate.middleware.js';

/** Detect real file type from magic bytes — the client-declared MIME type is never trusted. */
export function sniff(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: 'image', mime: 'image/jpeg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: 'image', mime: 'image/png' };
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return { kind: 'image', mime: 'image/webp' };
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return { kind: 'pdf', mime: 'application/pdf' };
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') return { kind: 'video', mime: 'video/mp4' };
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { kind: 'video', mime: 'video/webm' };
  return null;
}

const LABELS = { image: 'a JPG, PNG or WEBP image', pdf: 'a PDF file', video: 'an MP4, MOV or WEBM video' };
const ALLOWED_MIME = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  pdf: ['application/pdf'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
};

/**
 * Build upload middleware.
 *   uploadFields({ image: 'image' })            -> field "image" must be an image
 *   uploadFields({ pdf: 'pdf', cover: 'image' })
 * Files land in req.files[field][0] with { buffer, kind, mime, size }.
 */
export function uploadFields(spec) {
  const maxSize = Math.max(...Object.values(spec).map((k) => env.limits[k]));
  const mult = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize, files: Object.keys(spec).length, fields: 40, fieldSize: 512 * 1024 },
    fileFilter(_req, file, cb) {
      const kind = spec[file.fieldname];
      if (!kind) return cb(ApiError.invalid(`Unexpected file field "${file.fieldname}".`));
      if (!ALLOWED_MIME[kind].includes(file.mimetype)) {
        return cb(ApiError.invalid(`"${file.originalname}" is not supported. Please choose ${LABELS[kind]}.`));
      }
      cb(null, true);
    },
  }).fields(Object.keys(spec).map((name) => ({ name, maxCount: 1 })));

  const verify = (req, _res, next) => {
    for (const [field, kind] of Object.entries(spec)) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;
      const real = sniff(file.buffer);
      if (!real || real.kind !== kind) {
        throw ApiError.invalid(`"${file.originalname}" is not a valid file. Please choose ${LABELS[kind]}.`);
      }
      if (file.size > env.limits[kind]) {
        throw new ApiError(413, `"${file.originalname}" is too large. The limit is ${Math.round(env.limits[kind] / 1048576)} MB.`);
      }
      file.kind = kind;
      file.mime = real.mime;
    }
    next();
  };
  return [mult, verify, parsePayload];
}

export const fileOf = (req, field) => req.files?.[field]?.[0];
