import { Schema, model } from 'mongoose';
import { linkSchema, mediaSchema } from './_shared.js';

export const HERO_PAGES = ['home', 'about', 'menu', 'dietary-menu', 'gallery', 'contact'];

const schema = new Schema(
  {
    page: { type: String, enum: HERO_PAGES, required: true, unique: true },
    eyebrow: { type: String, trim: true, maxlength: 120, default: '' },
    title: { type: String, trim: true, required: [true, 'Heading is required'], maxlength: 160 },
    copy: { type: String, trim: true, maxlength: 400, default: '' },
    image: mediaSchema,
    video: mediaSchema,
    secondaryImage: mediaSchema,
    topLeft: { type: String, trim: true, maxlength: 80, default: '' },
    topRight: { type: String, trim: true, maxlength: 80, default: '' },
    ctas: { type: [linkSchema], default: [] },
    showStats: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Hero = model('Hero', schema);
