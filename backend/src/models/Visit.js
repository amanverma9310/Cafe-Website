import crypto from 'node:crypto';
import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    path: { type: String, trim: true, maxlength: 200, default: '/' },
    // Anonymous fingerprint only — never the raw IP/user-agent. Lets us report "unique visitors" without storing PII.
    visitorHash: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ createdAt: -1 });

export const Visit = model('Visit', schema);

/** Non-reversible per-visitor fingerprint derived from IP + user agent. Used only to count unique visitors. */
export function hashVisitor(req) {
  const raw = `${req.ip || ''}|${req.get('user-agent') || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
