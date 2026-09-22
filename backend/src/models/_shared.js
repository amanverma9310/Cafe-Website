import { Schema } from 'mongoose';

const mediaFields = {
  secureUrl: { type: String, trim: true },
  publicId: { type: String, trim: true },
  resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
  bytes: Number,
  format: String,
  duration: Number,
  alt: { type: String, trim: true, maxlength: 200, default: '' },
  caption: { type: String, trim: true, maxlength: 120, default: '' },
};

/** Embedded single media slot: Cloudinary secureUrl + publicId. */
export const mediaSchema = new Schema(mediaFields, { _id: false });
/** Media entry inside an ordered list (keeps _id so it can be addressed). */
export const mediaItemSchema = new Schema({
  ...mediaFields,
  order: { type: Number, default: 0 },
  // Optional short looping clip for this photo (used by the dish showcase). The photo stays as the poster / fallback.
  video: mediaSchema,
  // Clip was shot on a black background: blend it into the page instead of showing it in a frame.
  blend: { type: Boolean, default: false },
});

export const linkSchema = new Schema(
  {
    label: { type: String, trim: true, maxlength: 60 },
    linkType: { type: String, enum: ['internal', 'external', 'maps', 'phone'], default: 'internal' },
    href: { type: String, trim: true, maxlength: 500, default: '' },
    variant: { type: String, enum: ['primary', 'secondary', 'link'], default: 'primary' },
  },
  { _id: false },
);

export const singletonOptions = { timestamps: true };
