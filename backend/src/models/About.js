import { Schema, model } from 'mongoose';
import { mediaSchema } from './_shared.js';

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    storyTitle: { type: String, trim: true, maxlength: 200, default: '' },
    storyCopy: { type: String, trim: true, maxlength: 1200, default: '' },
    storyImage: mediaSchema,
    ctaLabel: { type: String, trim: true, maxlength: 60, default: 'Explore the menu' },
    pillarsTitle: { type: String, trim: true, maxlength: 160, default: '' },
    pillars: [
      {
        _id: false,
        title: { type: String, trim: true, maxlength: 60 },
        copy: { type: String, trim: true, maxlength: 240 },
        icon: { type: String, enum: ['leaf', 'wheat-off', 'coffee', 'utensils', 'sprout', 'heart', 'star', 'map-pin'], default: 'leaf' },
      },
    ],
    note: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true },
);

export const About = model('About', schema);
