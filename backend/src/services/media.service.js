import { Readable } from 'node:stream';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const IMAGE_TRANSFORM = [{ width: 2400, height: 2400, crop: 'limit', quality: 'auto:good' }];

export function assertConfigured() {
  if (!env.cloudinaryConfigured) {
    throw new ApiError(503, 'Media storage is not configured yet. Add your Cloudinary credentials to the backend .env file.');
  }
}

function pipeBuffer(buffer, stream) {
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    Readable.from(buffer).pipe(stream);
    resolve();
  });
}

function upload(buffer, options, chunked = false) {
  return new Promise((resolve, reject) => {
    const cb = (err, result) => (err ? reject(err) : resolve(result));
    const stream = chunked
      ? cloudinary.uploader.upload_chunked_stream({ ...options, chunk_size: 6 * 1024 * 1024 }, cb)
      : cloudinary.uploader.upload_stream(options, cb);
    pipeBuffer(buffer, stream).catch(reject);
  });
}

/**
 * Upload a validated multer file to Cloudinary.
 * Returns the fields we persist: { secureUrl, publicId, resourceType, bytes, format, duration }.
 */
export async function uploadFile(file, folder) {
  assertConfigured();
  const base = { folder: `${env.CLOUDINARY_FOLDER}/${folder}`, unique_filename: true, overwrite: false };
  let result;
  try {
    if (file.kind === 'image') {
      result = await upload(file.buffer, { ...base, resource_type: 'image', transformation: IMAGE_TRANSFORM });
    } else if (file.kind === 'pdf') {
      // PDFs go up as "image" resources so Cloudinary can serve page previews; resourceType is stored for deletion.
      result = await upload(file.buffer, { ...base, resource_type: 'image' });
    } else if (file.kind === 'video') {
      result = await upload(file.buffer, { ...base, resource_type: 'video' }, true);
    } else {
      throw ApiError.invalid('Unsupported file type.');
    }
  } catch (err) {
    if (err?.isApiError) throw err;
    console.error('[cloudinary upload failed]', err?.message || err);
    const msg = err?.message || '';
    if (/file size too large|too large/i.test(msg)) {
      throw new ApiError(413, 'Cloudinary rejected the file as too large for your plan. Try a smaller or compressed file.');
    }
    throw new ApiError(502, 'The file could not be uploaded to media storage. Please try again.');
  }
  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
    format: result.format,
    duration: result.duration,
  };
}

/** Best-effort removal of an asset. Never throws — a failed cleanup must not fail the user's request. */
export async function destroyAsset(media) {
  if (!media?.publicId || !env.cloudinaryConfigured) return false;
  try {
    const res = await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.resourceType || 'image',
      invalidate: true,
    });
    return res?.result === 'ok';
  } catch (err) {
    console.error('[cloudinary destroy failed]', media.publicId, err?.message || err);
    return false;
  }
}

/**
 * Keeps Cloudinary and MongoDB consistent:
 *   - files uploaded during a request are removed again if the DB write fails
 *   - replaced/deleted assets are removed only after the DB write succeeds
 */
export class MediaTx {
  uploaded = [];
  stale = [];

  async put(file, folder) {
    const media = await uploadFile(file, folder);
    this.uploaded.push(media);
    return media;
  }

  discard(media) {
    if (media?.publicId) this.stale.push(media);
  }

  async run(saveFn) {
    let out;
    try {
      out = await saveFn();
    } catch (err) {
      await Promise.all(this.uploaded.map(destroyAsset));
      throw err;
    }
    await Promise.all(this.stale.map(destroyAsset));
    return out;
  }
}

/** Apply an upload / removal to a media path on a mongoose document, tracking the old asset for cleanup. */
export async function applyMedia(tx, doc, path, { file, remove, folder, alt }) {
  const current = doc.get(path)?.toObject?.() ?? doc.get(path);
  if (file) {
    const media = await tx.put(file, folder);
    tx.discard(current);
    doc.set(path, { ...media, alt: alt ?? current?.alt ?? '' });
    doc.markModified(path);
  } else if (remove && current?.secureUrl) {
    tx.discard(current);
    doc.set(path, undefined);
  } else if (alt !== undefined && current?.secureUrl) {
    doc.set(`${path}.alt`, alt);
  }
}
