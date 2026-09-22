/**
 * Seeds Agama's initial content (migrated from the original Next.js data files) and the first administrator.
 *
 *   npm run seed              upload the bundled assets to Cloudinary and seed everything that is still empty
 *   npm run seed:local        skip Cloudinary; serve bundled assets from the API (/seed-media) — for local preview only
 *   npm run seed:reset        wipe seeded content (NOT enquiries / admin) and seed again
 *
 * Re-running is safe: collections that already have data are left untouched so owner edits are never overwritten.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Admin } from '../src/models/Admin.js';
import { About } from '../src/models/About.js';
import { Business } from '../src/models/Business.js';
import { GalleryImage } from '../src/models/GalleryImage.js';
import { Hero } from '../src/models/Hero.js';
import { HomeSection } from '../src/models/HomeSection.js';
import { MenuCategory } from '../src/models/MenuCategory.js';
import { MenuDocument } from '../src/models/MenuDocument.js';
import { MenuItem } from '../src/models/MenuItem.js';
import { OpeningHours, DAYS } from '../src/models/OpeningHours.js';
import { Review } from '../src/models/Review.js';
import { SiteSettings } from '../src/models/SiteSettings.js';
import { destroyAsset, uploadFile } from '../src/services/media.service.js';
import { sniff } from '../src/middleware/upload.middleware.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../seed-assets');
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, 'seed-data', f), 'utf8'));
const { categories, main: mainMenu, glutenFree, onionGarlicFree, featuredDishes } = read('menu.json');
const galleryData = read('gallery.json');
const { business: biz, menuDocuments: docsSrc } = read('business.json');

const args = new Set(process.argv.slice(2));
const LOCAL = args.has('--local-media');
const FORCE = args.has('--force');
const log = (...a) => console.log(...a);
const warnings = [];

/* ---------------- media ---------------- */
async function media(rel, { alt = '', folder = 'seed', caption = '' } = {}) {
  const file = path.join(ASSETS, rel.replace(/^\/?assets\//, ''));
  if (!fs.existsSync(file)) {
    warnings.push(`Missing bundled asset: ${rel}`);
    return undefined;
  }
  if (LOCAL) {
    return { secureUrl: `/seed-media/${path.relative(ASSETS, file).split(path.sep).join('/')}`, resourceType: 'image', alt, caption };
  }
  const buffer = fs.readFileSync(file);
  const kind = sniff(buffer)?.kind;
  try {
    // Each record gets its own Cloudinary asset so deleting/replacing one never affects another.
    const up = await uploadFile({ buffer, kind, size: buffer.length }, folder);
    process.stdout.write('.');
    return { ...up, alt, caption };
  } catch (err) {
    process.stdout.write('x');
    warnings.push(`Could not upload ${rel}: ${err.message}`);
    return undefined;
  }
}
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const n = i++; out[n] = await fn(items[n], n); }
  }));
  return out;
}
const sizeOf = (rel) => fs.statSync(path.join(ASSETS, rel.replace(/^\/?assets\//, ''))).size;
const price = (s) => (s ? Number(String(s).replace(/[^\d.]/g, '')) : null);

/* ---------------- helpers ---------------- */
async function empty(Model, name) {
  const n = await Model.estimatedDocumentCount();
  if (n > 0 && !FORCE) { log(`- ${name}: already has data, skipped`); return false; }
  return true;
}
async function wipe(Model, paths = []) {
  const docs = await Model.find();
  if (!LOCAL) for (const d of docs) for (const p of paths) {
    const v = d.get(p);
    if (Array.isArray(v)) await Promise.all(v.flatMap((m) => [destroyAsset(m?.toObject?.() ?? m), destroyAsset(m?.video?.toObject?.() ?? m?.video)]));
    else if (v?.publicId) await destroyAsset(v.toObject?.() ?? v);
  }
  await Model.deleteMany({});
}

/* ---------------- seeders ---------------- */
async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.');
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  const email = ADMIN_EMAIL.toLowerCase();
  let admin = await Admin.findOne({ email });
  if (admin) { log(`- admin ${email}: already exists, left unchanged`); return; }
  admin = new Admin({ name: ADMIN_NAME || 'Agama Admin', email });
  await admin.setPassword(ADMIN_PASSWORD);
  await admin.save();
  log(`+ admin created: ${email}`);
}

async function seedBusiness() {
  if (await empty(Business, 'business')) {
    await Business.deleteMany({});
    await Business.create({
      key: 'main', name: biz.name, hindiName: biz.hindiName, strapline: biz.strapline, category: biz.category,
      rating: biz.rating, reviewCount: biz.reviewCount, spend: biz.spend, phone: biz.phone, displayPhone: biz.displayPhone,
      address: biz.address, shortAddress: biz.shortAddress, plusCode: biz.plusCode, whatsappEnabled: biz.whatsappEnabled,
      addressParts: { streetAddress: 'M-18, Block M, Greater Kailash II, Greater Kailash', locality: 'New Delhi', region: 'Delhi', postalCode: '110048', country: 'IN' },
      links: { maps: biz.links.maps, reservation: biz.links.reservation, instagram: '', facebook: '', orderOnline: '' },
    });
    log('+ business information');
  }
  if (await empty(OpeningHours, 'opening hours')) {
    await OpeningHours.deleteMany({});
    await OpeningHours.create({
      key: 'main',
      days: DAYS.map((day) => ({ day, note: 'Confirm timing' })),
      badgeText: 'Closes at 12:00 AM',
      disclaimer: 'Google listing information indicates that the cafe closes at 12:00 AM. Please confirm daily timings before visiting.',
    });
    log('+ opening hours (times left blank: the source only says "Confirm timing")');
  }
  if (await empty(SiteSettings, 'site settings')) {
    await SiteSettings.deleteMany({});
    await SiteSettings.create({
      key: 'main',
      siteTitle: 'Agama Cafe & Bar | Plant-Based Cafe in Greater Kailash II',
      titleTemplate: '%s | Agama Cafe & Bar',
      metaDescription: 'A warm plant-based dining experience in Greater Kailash II, New Delhi, with thoughtful food, desserts, coffee and dedicated dietary menus.',
      keywords: ['Agama Cafe', 'vegan cafe Delhi', 'plant based restaurant Greater Kailash', 'gluten free menu Delhi'],
      footerTagline: 'Plant-based food and a warm cafe experience in Greater Kailash II.',
      footerNote: 'Open until 12:00 AM — confirm day-wise timings with the cafe.',
      copyrightName: 'Agama Cafe & Bar',
      seoImage: await media('hero/agama-cafe-interior.png', { alt: 'Warm, naturally lit seating inside Agama Cafe and Bar', folder: 'site' }),
    });
    log('+ site settings');
  }
}

async function seedMenu() {
  if (!(await empty(MenuCategory, 'menu categories'))) return;
  await Promise.all([MenuCategory.deleteMany({}), MenuDocument.deleteMany({}), MenuItem.deleteMany({})]);
  const cats = await MenuCategory.insertMany(categories.map((c, i) => ({ name: c.label, slug: c.value, displayOrder: i })));
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  log(`+ ${cats.length} menu categories`);

  const spec = [
    { key: 'main', tabLabel: 'Main Menu', type: 'main', details: '' },
    { key: 'gluten-free', tabLabel: 'Gluten Free', type: 'dietary', details: 'A dedicated menu with soups, salads, small plates, mains, chickpea and lentil pasta, and desserts. Individual icons and preparation notes remain available in the original PDF.' },
    { key: 'onion-garlic-free', tabLabel: 'Onion & Garlic Free', type: 'dietary', details: 'A dedicated selection spanning brunch, small plates, mains, pasta, pizza and desserts. Consult the original menu for dietary icons and detailed preparation notes.' },
    { key: 'bar', tabLabel: 'Bar Menu', type: 'bar', details: 'View the supplied bar-menu document for its complete selection. This website does not provide alcohol ordering or purchase actions.' },
  ];
  const docs = await mapLimit(docsSrc, 2, async (d, i) => {
    const s = spec[i];
    const pdfRel = d.href;
    const oversize = LOCAL ? false : sizeOf(pdfRel) > env.limits.pdf;
    if (oversize) warnings.push(`${d.title} PDF is ${(sizeOf(pdfRel) / 1048576).toFixed(1)} MB, above MAX_PDF_MB (${env.MAX_PDF_MB}). Upload a compressed version from the admin panel.`);
    return MenuDocument.create({
      key: s.key, title: d.title, tabLabel: s.tabLabel, description: d.description, details: s.details, type: s.type, displayOrder: i,
      pdf: oversize ? undefined : await media(pdfRel, { alt: `${d.title} PDF`, folder: 'menu-pdfs' }),
      cover: await media(d.image, { alt: `${d.title} cover`, folder: 'menu-covers' }),
    });
  });
  const docId = Object.fromEntries(docs.map((d) => [d.key, d._id]));
  log(`\n+ ${docs.length} menu documents`);

  const featuredNames = new Set(['Carrot & Ginger Soup', 'Vegan Shakshuka', 'Avocado Fritters', 'Agama Asian Bowl', 'Red Lion', 'Shroom Cacio e Pepe', 'Cheesecake Deconstructed', 'Cappuccino']);
  const rows = [];
  const push = (list, menu, tag) => list.forEach((it, i) => rows.push({
    name: it.name, description: it.description, price: price(it.price), category: catBySlug[it.category], menu: docId[menu],
    dietaryTags: tag ? [tag] : [], featured: menu === 'main' && featuredNames.has(it.name), displayOrder: i,
  }));
  push(mainMenu, 'main');
  push(glutenFree, 'gluten-free', 'Gluten free');
  push(onionGarlicFree, 'onion-garlic-free', 'Onion & garlic free');
  await MenuItem.insertMany(rows);
  log(`+ ${rows.length} menu items`);
}

async function seedGallery() {
  if (!(await empty(GalleryImage, 'gallery'))) return;
  await GalleryImage.deleteMany({});
  const docs = await mapLimit(galleryData, 4, async (g, i) => ({
    image: await media(g.src, { alt: g.alt, folder: 'gallery' }), alt: g.alt, type: g.type, featured: Boolean(g.featured), displayOrder: i,
  }));
  const ok = docs.filter((d) => d.image);
  await GalleryImage.insertMany(ok);
  log(`\n+ ${ok.length} gallery images`);
}

const cta = (label, linkType, href, variant = 'primary') => ({ label, linkType, href, variant });

async function seedContent() {
  if (await empty(Hero, 'page banners')) {
    await Hero.deleteMany({});
    const H = (page, eyebrow, title, copy, rel, alt, extra = {}) => ({ page, eyebrow, title, copy, rel, alt, ...extra });
    const defs = [
      H('home', biz.strapline, 'From the farm,\nto your table.', 'A warm plant-based dining experience in Greater Kailash II, serving thoughtfully crafted food, desserts, coffee and more.', 'hero/agama-cafe-interior.png', 'Warm, naturally lit seating inside Agama Cafe and Bar', {
        topLeft: 'Greater Kailash II · New Delhi', topRight: 'Plant-based dining · Warm cafe experience', showStats: true,
        ctas: [cta('View Menu', 'internal', '/menu'), cta('Reserve a Table', 'internal', '/contact#enquiry', 'secondary'), cta('Directions', 'maps', '', 'link')],
      }),
      H('about', 'Our point of view', 'A modern plant-based cafe.', 'Agama brings thoughtful vegan food and a warm, contemporary cafe experience to Greater Kailash II.', 'interior/interior-ambience.png', 'Warm interior and framed wall art inside Agama Cafe'),
      H('menu', 'Explore the kitchen', 'The Agama menu.', 'Plant-based soups, brunch, small plates, pizza, pasta, mains, desserts and drinks—plus dedicated dietary selections.', 'food/food-04-vegan-loaded-nachos.png', 'Vegan loaded nachos at Agama Cafe'),
      H('dietary-menu', 'Dedicated choices', 'Dietary menus, clearly presented.', 'Explore selections from Agama’s supplied gluten-free and onion-and-garlic-free menu documents.', 'food/food-11-beetroot-hummus.png', 'Beetroot hummus finished with fresh greens'),
      H('gallery', 'A look inside', 'Food. Space. Agama.', 'An editorial glimpse of colourful plates, quiet corners, warm light and the details that shape the cafe.', 'interior/interior-window.png', 'Window-side dining tables at Agama Cafe'),
      H('contact', 'Find your way here', 'Visit Agama.', 'A plant-lined cafe in Greater Kailash II, ready for brunch, coffee, dinner and everything in between.', 'exterior/exterior-02-entrance.png', 'Plant-lined entrance to Agama Cafe and Bar'),
    ];
    const heroes = await mapLimit(defs, 3, async ({ rel, alt, ...d }) => ({
      ...d,
      image: await media(rel, { alt, folder: `heroes/${d.page}` }),
      ...(d.page === 'contact' ? { secondaryImage: await media('exterior/exterior-01-signboard.png', { alt: 'Agama Cafe and Bar signboard in Greater Kailash II', folder: 'heroes/contact' }) } : {}),
    }));
    await Hero.insertMany(heroes);
    log('\n+ page banners');
  }

  if (await empty(About, 'about page')) {
    await About.deleteMany({});
    await About.create({
      key: 'main',
      storyTitle: 'Farmer’s Experiential Café, interpreted with a calm city sensibility.',
      storyCopy: 'The supplied menus move from soups, salads and all-day brunch to hummus, pizzas, pastas, mains, bakery offerings and desserts. Dedicated dietary menus make it easier to explore suitable options without overstating what every dish can offer.',
      storyImage: await media('interior/interior-seating-wide.png', { alt: 'Natural light and relaxed seating at Agama Cafe', folder: 'about' }),
      ctaLabel: 'Explore the menu',
      pillarsTitle: 'Rooted in choice, warmth and ease.',
      pillars: [
        { title: 'Plant-based dining', copy: 'A broad vegan menu spanning brunch, small plates, mains, bakery and desserts.', icon: 'leaf' },
        { title: 'Dietary choice', copy: 'Dedicated gluten-free and onion-and-garlic-free menu documents.', icon: 'wheat-off' },
        { title: 'Cafe rhythm', copy: 'A setting that moves naturally from coffee and brunch into relaxed evening dining.', icon: 'coffee' },
        { title: 'Thoughtful variety', copy: 'Comforting favourites and creative plates drawn from the supplied Agama menus.', icon: 'utensils' },
      ],
      note: 'Owner story, founding date and team details are intentionally left open for verified owner content.',
    });
    log('+ about page');
  }

  if (await empty(HomeSection, 'home sections')) {
    await HomeSection.deleteMany({});
    const dishes = await mapLimit(featuredDishes, 3, async (d, i) => ({ ...(await media(d.image, { alt: `${d.name} at Agama Cafe`, caption: d.name, folder: 'home/featuredDishes' })), order: i }));
    const S = async (key, order, data) => ({ key, order, enabled: true, ...data });
    const sections = await Promise.all([
      S('about', 0, {
        eyebrow: 'A modern vegan cafe', title: 'Food, ambience and a gentler pace.',
        copy: 'Agama brings plant-based dining into a warm, contemporary cafe setting in Greater Kailash II. The experience moves easily from brunch and coffee to small plates, mains and desserts.',
        highlights: [
          { title: 'Thoughtful choices', text: 'Dedicated gluten-free and onion-and-garlic-free menus make dietary choices easier to explore.' },
          { title: 'Cafe to evening', text: 'Coffee, refined-sugar-free bakery mentions, desserts and a relaxed dining atmosphere.' },
        ],
        badge: 'Plant Focused', tagline: 'Women-owned · LGBTQ+ friendly', ctas: [cta('Discover Agama', 'internal', '/about')],
        images: [
          { ...(await media('interior/interior-seating-wide.png', { alt: 'Relaxed seating and natural light inside Agama Cafe', folder: 'home/about' })), order: 0 },
          { ...(await media('interior/interior-window.png', { alt: 'Window-side tables at Agama Cafe', folder: 'home/about' })), order: 1 },
        ],
      }),
      S('featuredMenu', 1, { eyebrow: 'From the menu', title: 'Familiar comfort, a plant-based point of view.', copy: 'A short selection from the supplied main menu. Menu prices shown here come from that source; dietary-menu versions may differ.', ctas: [cta('Browse every category', 'internal', '/menu')] }),
      S('dietaryMenus', 2, { eyebrow: 'Dietary menus', title: 'More ways to dine together.', copy: 'Explore dedicated gluten-free and onion-and-garlic-free menus. These options come directly from Agama’s supplied menu documents.', note: 'Not every dish on the wider menu carries these dietary designations. Please speak with the cafe about individual requirements.', ctas: [cta('Explore dietary menu highlights', 'internal', '/dietary-menu', 'link')] }),
      S('featuredDishes', 3, { eyebrow: 'Popular picks', title: 'A table full of colour.', copy: 'A visual selection from Agama’s plant-based kitchen. Prices are left off here because supplied menu versions differ.', ctas: [cta('Explore the full menu', 'internal', '/menu', 'link')], images: dishes.filter((d) => d.secureUrl) }),
      S('ambience', 4, {
        eyebrow: 'The cafe', title: 'A space to slow down.', copy: 'Natural light, olive seating, warm wood and quiet plant details shape an easygoing room for coffee, conversation and unhurried meals.', ctas: [cta('See the gallery', 'internal', '/gallery', 'link')],
        images: [
          { ...(await media('interior/interior-ambience.png', { alt: 'Warm seating, framed artwork and natural light at Agama Cafe', folder: 'home/ambience' })), order: 0 },
          { ...(await media('interior/interior-seating.png', { alt: 'Relaxed seating inside Agama Cafe', folder: 'home/ambience' })), order: 1 },
          { ...(await media('exterior/exterior-01-signboard.png', { alt: 'Agama Cafe exterior sign', folder: 'home/ambience' })), order: 2 },
          { ...(await media('exterior/exterior-02-entrance.png', { alt: 'Plant-lined Agama Cafe entrance', folder: 'home/ambience' })), order: 3 },
        ],
      }),
      // Off until the owner uploads their own video from Admin > Home.
      S('reel', 5, { enabled: false, eyebrow: 'Inside Agama', title: 'Step inside, for a moment.', copy: 'A short look at the room, the plates and the light.' }),
      S('whyChoose', 6, {
        eyebrow: 'Why Agama', title: 'Designed for more than one kind of meal.',
        items: [
          { title: 'Plant-Based Menu', icon: 'leaf' }, { title: 'Gluten-Free Options', icon: 'wheat-off' }, { title: 'Dedicated Dietary Menus', icon: 'salad' },
          { title: 'Dine-In', icon: 'coffee' }, { title: 'Takeaway & Delivery', icon: 'package' }, { title: 'Table Reservations', icon: 'calendar' }, { title: 'Greater Kailash II', icon: 'map-pin' },
        ],
      }),
      S('reviews', 7, {
        eyebrow: 'Guest impressions', title: 'Opening Hours', tagline: 'Plan your visit',
        quote: 'Guests frequently describe Agama as warm, relaxed and welcoming, with fresh vegan food and friendly service.',
        quoteNote: 'A summary of recurring review themes, not a direct quotation.',
      }),
      S('visit', 8, {
        eyebrow: 'Visit Agama', title: 'Come in and stay awhile.', badge: 'M-18, Block M · Greater Kailash II',
        images: [{ ...(await media('exterior/exterior-02-entrance.png', { alt: 'Entrance to Agama Cafe and Bar in Greater Kailash II', folder: 'home/visit' })), order: 0 }],
      }),
      S('cta', 9, {
        eyebrow: 'Plan your next visit', title: 'Your table at Agama awaits.',
        ctas: [cta('Reserve a Table', 'internal', '/contact#enquiry'), cta('View Menu', 'internal', '/menu', 'secondary'), cta('Get Directions', 'maps', '', 'link')],
        images: [{ ...(await media('hero/agama-cafe-interior.png', { alt: '', folder: 'home/cta' })), order: 0 }],
      }),
    ]);
    await HomeSection.insertMany(sections);
    log('\n+ home sections');
  }
}

async function main() {
  if (!LOCAL && !env.cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Fill CLOUDINARY_* in .env, or run `npm run seed:local` for a local-only preview.');
  }
  await connectDB();
  log(`Seeding (${LOCAL ? 'local media' : 'Cloudinary'})${FORCE ? ' — FORCE: wiping seeded content' : ''}`);
  if (FORCE) {
    await wipe(GalleryImage, ['image']);
    await wipe(MenuDocument, ['pdf', 'cover']);
    await wipe(MenuItem, ['image']);
    await wipe(Hero, ['image', 'video', 'secondaryImage']);
    await wipe(About, ['storyImage']);
    await wipe(HomeSection, ['images', 'video']);
    await wipe(SiteSettings, ['logo', 'favicon', 'seoImage']);
    await Promise.all([MenuCategory.deleteMany({}), Business.deleteMany({}), OpeningHours.deleteMany({}), Review.deleteMany({})]);
  }
  await seedAdmin();
  await seedBusiness();
  await seedMenu();
  await seedGallery();
  await seedContent();
  if (warnings.length) { log('\nWarnings:'); warnings.forEach((w) => log(`  ! ${w}`)); }
  log('\nDone.');
}

main().then(disconnectDB).catch(async (e) => { console.error('\nSeed failed:', e.message); await disconnectDB().catch(() => {}); process.exit(1); });
