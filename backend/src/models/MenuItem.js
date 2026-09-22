import { Schema, model } from 'mongoose';
import { mediaSchema } from './_shared.js';

const schema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    price: { type: Number, min: [0, 'Price cannot be negative'], default: null },
    category: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: [true, 'Category is required'], index: true },
    menu: { type: Schema.Types.ObjectId, ref: 'MenuDocument', required: [true, 'Menu is required'], index: true },
    dietaryTags: [{ type: String, trim: true, maxlength: 40 }],
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    image: mediaSchema,
  },
  { timestamps: true },
);
schema.index({ menu: 1, displayOrder: 1 });

export const MenuItem = model('MenuItem', schema);
