import { Schema, model } from 'mongoose';
import { mediaSchema } from './_shared.js';

const schema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 80 },
    tabLabel: { type: String, trim: true, maxlength: 40, default: '' },
    description: { type: String, trim: true, maxlength: 240, default: '' },
    details: { type: String, trim: true, maxlength: 500, default: '' },
    type: { type: String, enum: ['main', 'dietary', 'bar'], default: 'dietary' },
    enabled: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    pdf: mediaSchema,
    cover: mediaSchema,
  },
  { timestamps: true },
);

export const MenuDocument = model('MenuDocument', schema);
