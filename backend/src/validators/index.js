import { z } from 'zod';
import { DAYS } from '../models/OpeningHours.js';
import { HERO_PAGES } from '../models/Hero.js';
import { HOME_SECTION_KEYS, ICONS } from '../models/HomeSection.js';
import { env } from '../config/env.js';
import { isDisposableEmail } from '../utils/disposableEmailDomains.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const str = (max, msg) => z.string().trim().max(max, msg ?? `Keep this under ${max} characters`);
const req = (max, label) => z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);
const optStr = (max) => str(max).optional().default('');
const bool = z.boolean().optional();
const order = z.number().int().min(0).max(100000).optional();
const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(100)
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const loginSchema = z.object({ email: z.email('Enter a valid email'), password: z.string().min(1, 'Password is required').max(100) });
export const profileSchema = z.object({ name: req(80, 'Name'), email: z.email('Enter a valid email') });
export const passwordSchema = z.object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: password });

export const menuItemSchema = z.object({
  name: req(100, 'Name'),
  description: optStr(400),
  price: z.preprocess(emptyToNull, z.number().min(0, 'Price cannot be negative').max(100000).nullable()).optional(),
  category: objectId,
  menu: objectId,
  dietaryTags: z.array(str(40)).max(10).optional(),
  featured: bool,
  available: bool,
  displayOrder: order,
  removeImage: bool,
});
export const menuItemPatch = z.object({ featured: bool, available: bool, displayOrder: order }).strict();

export const categorySchema = z.object({ name: req(60, 'Name'), description: optStr(240), enabled: bool, displayOrder: order });
export const reorderSchema = z.object({ ids: z.array(objectId).min(1).max(500) });

export const menuDocSchema = z.object({
  title: req(80, 'Title'),
  tabLabel: optStr(40),
  description: optStr(240),
  details: optStr(500),
  type: z.enum(['main', 'dietary', 'bar']).optional(),
  enabled: bool,
  displayOrder: order,
  removePdf: bool,
  removeCover: bool,
});

export const gallerySchema = z.object({ alt: req(200, 'Alt text'), type: req(30, 'Type'), featured: bool, enabled: bool, displayOrder: order });
export const galleryPatch = z.object({ featured: bool, enabled: bool, displayOrder: order }).strict();

export const reviewSchema = z.object({
  reviewerName: req(80, 'Reviewer name'),
  rating: z.number().int().min(1, 'Rating is 1 to 5').max(5, 'Rating is 1 to 5'),
  text: req(800, 'Review text'),
  source: optStr(40),
  enabled: bool,
  featured: bool,
  displayOrder: order,
});
export const reviewPatch = z.object({ enabled: bool, featured: bool, displayOrder: order }).strict();

// India: optional +91/91/0 prefix + a valid 10-digit mobile number (starts 6-9). INTL: broad E.164-ish shape.
// Normalizes to a consistent stored format so duplicate-submission checks and admin search work reliably.
const INDIA_MOBILE_RE = /^(?:\+91|91|0)?([6-9]\d{9})$/;
const INTL_PHONE_RE = /^\+?[0-9]{7,15}$/;
const phone = z
  .string()
  .trim()
  .min(1, 'Please enter your phone number')
  .max(20, 'Enter a valid phone number')
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .superRefine((v, ctx) => {
    const ok = env.PHONE_REGION === 'INTL' ? INTL_PHONE_RE.test(v) : INDIA_MOBILE_RE.test(v);
    if (!ok) {
      ctx.addIssue({ code: 'custom', message: env.PHONE_REGION === 'INTL' ? 'Enter a valid phone number' : 'Enter a valid 10-digit Indian mobile number' });
    }
  })
  .transform((v) => {
    if (env.PHONE_REGION === 'INTL') return v;
    const m = INDIA_MOBILE_RE.exec(v);
    return m ? `+91${m[1]}` : v; // invalid input was already flagged by superRefine above; never throw here
  });

const enquiryEmail = z
  .email('Enter a valid email')
  .refine((v) => !isDisposableEmail(v), 'Please use a permanent email address, not a temporary/disposable one');

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  phone,
  email: z.union([z.literal(''), enquiryEmail]).optional().default(''),
  enquiryType: z.enum(['Reservation', 'General enquiry']).default('General enquiry'),
  message: z.string().trim().min(10, 'Please add at least 10 characters').max(2000),
  preferredDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
  website: z.string().optional(),
});
export const enquiryPatch = z.object({ isRead: bool, status: z.enum(['pending', 'resolved']).optional() }).strict();

const url = z.union([z.literal(''), z.url('Enter a full link starting with https://')]).optional().default('');
const linkPath = z.string().trim().max(500).optional().default('');

export const businessSchema = z.object({
  name: req(100, 'Cafe name'),
  hindiName: optStr(100),
  strapline: optStr(160),
  category: optStr(120),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  spend: optStr(80),
  phone: z.string().trim().max(24).optional().default(''),
  displayPhone: optStr(30),
  address: optStr(300),
  shortAddress: optStr(120),
  plusCode: optStr(80),
  currencySymbol: str(4).optional().default('₹'),
  priceRange: str(10).optional().default('₹₹'),
  whatsappEnabled: bool,
  reservationInfo: optStr(600),
  addressParts: z.object({ streetAddress: optStr(200), locality: optStr(80), region: optStr(80), postalCode: optStr(20), country: optStr(4) }).optional(),
  links: z
    .object({
      maps: url,
      reservation: linkPath,
      instagram: url,
      facebook: url,
      orderOnline: url,
      other: z.array(z.object({ label: req(40, 'Label'), url: z.url('Enter a full link starting with https://') })).max(8).optional(),
    })
    .optional(),
});

const time = z.union([z.literal(''), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')]).optional().default('');
export const hoursSchema = z.object({
  days: z
    .array(z.object({ day: z.enum(DAYS), isClosed: bool, opensAt: time, closesAt: time, note: optStr(80) }))
    .length(7, 'Provide all seven days'),
  badgeText: optStr(60),
  disclaimer: optStr(300),
});

export const siteSettingsSchema = z.object({
  siteTitle: req(120, 'Site title'),
  titleTemplate: str(80).optional().default('%s | Agama Cafe & Bar'),
  metaDescription: optStr(320),
  keywords: z.array(str(60)).max(20).optional(),
  footerTagline: optStr(200),
  footerNote: optStr(200),
  copyrightName: optStr(80),
  themeColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour like #0c1611').optional(),
  removeLogo: bool,
  removeFavicon: bool,
  removeSeoImage: bool,
});

const link = z.object({
  label: req(60, 'Button label'),
  linkType: z.enum(['internal', 'external', 'maps', 'phone']),
  href: linkPath,
  variant: z.enum(['primary', 'secondary', 'link']).optional().default('primary'),
});
export const heroSchema = z.object({
  eyebrow: optStr(120),
  title: req(160, 'Heading'),
  copy: optStr(400),
  topLeft: optStr(80),
  topRight: optStr(80),
  ctas: z.array(link).max(4).optional(),
  showStats: bool,
  imageAlt: str(200).optional(),
  removeImage: bool,
  removeVideo: bool,
  removeSecondaryImage: bool,
});
export const heroPageParam = z.enum(HERO_PAGES);

export const aboutSchema = z.object({
  storyTitle: optStr(200),
  storyCopy: optStr(1200),
  ctaLabel: optStr(60),
  pillarsTitle: optStr(160),
  pillars: z
    .array(z.object({ title: req(60, 'Title'), copy: optStr(240), icon: z.enum(['leaf', 'wheat-off', 'coffee', 'utensils', 'sprout', 'heart', 'star', 'map-pin']) }))
    .max(8)
    .optional(),
  note: optStr(300),
  removeStoryImage: bool,
});

export const homeSectionSchema = z.object({
  enabled: bool,
  eyebrow: optStr(100),
  title: optStr(200),
  copy: optStr(600),
  note: optStr(400),
  badge: optStr(60),
  tagline: optStr(100),
  quote: optStr(400),
  quoteNote: optStr(200),
  highlights: z.array(z.object({ title: req(60, 'Title'), text: optStr(240) })).max(6).optional(),
  items: z.array(z.object({ title: req(60, 'Title'), icon: z.enum(ICONS) })).max(12).optional(),
  ctas: z.array(link).max(4).optional(),
});
export const homeSectionKey = z.enum(HOME_SECTION_KEYS);
export const sectionOrderSchema = z.object({ keys: z.array(homeSectionKey).min(1) });
export const sectionImageSchema = z.object({ alt: optStr(200), caption: optStr(120), blend: bool });
