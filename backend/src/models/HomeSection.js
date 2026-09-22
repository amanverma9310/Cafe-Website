import { Schema, model } from 'mongoose';
import { linkSchema, mediaItemSchema, mediaSchema } from './_shared.js';

export const HOME_SECTION_KEYS = ['about', 'featuredMenu', 'dietaryMenus', 'featuredDishes', 'ambience', 'whyChoose', 'reviews', 'reel', 'visit', 'cta'];
export const ICONS = ['leaf', 'wheat-off', 'salad', 'coffee', 'package', 'calendar', 'map-pin', 'sprout', 'heart', 'star', 'utensils', 'leaf-heart'];

const schema = new Schema(
  {
    key: { type: String, enum: HOME_SECTION_KEYS, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    eyebrow: { type: String, trim: true, maxlength: 100, default: '' },
    title: { type: String, trim: true, maxlength: 200, default: '' },
    copy: { type: String, trim: true, maxlength: 600, default: '' },
    note: { type: String, trim: true, maxlength: 400, default: '' },
    badge: { type: String, trim: true, maxlength: 60, default: '' },
    tagline: { type: String, trim: true, maxlength: 100, default: '' },
    quote: { type: String, trim: true, maxlength: 400, default: '' },
    quoteNote: { type: String, trim: true, maxlength: 200, default: '' },
    highlights: [{ _id: false, title: { type: String, trim: true, maxlength: 60 }, text: { type: String, trim: true, maxlength: 240 } }],
    items: [{ _id: false, title: { type: String, trim: true, maxlength: 60 }, icon: { type: String, enum: ICONS, default: 'leaf' } }],
    ctas: { type: [linkSchema], default: [] },
    images: { type: [mediaItemSchema], default: [] },
    video: mediaSchema,
  },
  { timestamps: true },
);

export const HomeSection = model('HomeSection', schema);
