const API_URL = import.meta.env.VITE_API_URL || '/api';
let apiOrigin = '';
try { apiOrigin = new URL(API_URL, window.location.origin).origin; } catch { apiOrigin = ''; }

const isCloudinary = (u) => typeof u === 'string' && u.includes('res.cloudinary.com') && u.includes('/upload/');

/** Media URLs come from the API. Locally-seeded assets are relative paths served by the API. */
export const mediaSrc = (url) => (!url ? '' : url.startsWith('/') ? `${apiOrigin}${url}` : url);

/** Cloudinary delivery transformation: automatic format + quality at a bounded width. */
export function optimized(url, width) {
  if (!isCloudinary(url)) return mediaSrc(url);
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

export function srcSet(url, widths = [480, 800, 1200, 1600, 2200]) {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${optimized(url, w)} ${w}w`).join(', ');
}

/** First-frame poster for a Cloudinary-hosted video. */
export function videoPoster(url, width = 900) {
  if (!isCloudinary(url)) return undefined;
  return url.replace('/upload/', `/upload/so_0,f_jpg,q_auto,w_${width}/`).replace(/\.\w+$/, '.jpg');
}

export const fileSize = (bytes) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
