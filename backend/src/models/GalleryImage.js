import { Schema, model } from 'mongoose';
import { mediaSchema } from './_shared.js';

const schema = new Schema(
  {
    image: { type: mediaSchema, required: true },
    alt: { type: String, required: [true, 'Alt text is required'], trim: true, maxlength: 200 },
    type: { type: String, required: [true, 'Type is required'], trim: true, maxlength: 30 },
    featured: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const GalleryImage = model('GalleryImage', schema);
