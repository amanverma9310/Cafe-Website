import { Schema, model } from 'mongoose';
import { mediaSchema } from './_shared.js';

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    siteTitle: { type: String, trim: true, maxlength: 120, default: 'Agama Cafe & Bar | Plant-Based Cafe in Greater Kailash II' },
    titleTemplate: { type: String, trim: true, maxlength: 80, default: '%s | Agama Cafe & Bar' },
    metaDescription: { type: String, trim: true, maxlength: 320, default: '' },
    keywords: [{ type: String, trim: true }],
    footerTagline: { type: String, trim: true, maxlength: 200, default: '' },
    footerNote: { type: String, trim: true, maxlength: 200, default: '' },
    copyrightName: { type: String, trim: true, maxlength: 80, default: 'Agama Cafe & Bar' },
    themeColor: { type: String, trim: true, default: '#0c1611' },
    logo: mediaSchema,
    favicon: mediaSchema,
    seoImage: mediaSchema,
  },
  { timestamps: true },
);

export const SiteSettings = model('SiteSettings', schema);
