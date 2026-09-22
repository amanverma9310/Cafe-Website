import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGO_URI: process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/agama_test',
  JWT_SECRET: 'test-secret-test-secret-test-secret',
  CLIENT_URL: 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's',
  MAX_IMAGE_MB: '1', MAX_PDF_MB: '2', MAX_VIDEO_MB: '3',
});

const { createApp } = await import('../src/app.js');
const { connectDB, disconnectDB } = await import('../src/config/db.js');
const { cloudinary } = await import('../src/config/cloudinary.js');
const { Admin } = await import('../src/models/Admin.js');
const { MediaTx } = await import('../src/services/media.service.js');
const mongoose = (await import('mongoose')).default;

/* ---- Cloudinary stub: the sandbox has no network; the SDK's request layer is replaced, everything else is real ---- */
const uploads = [];
const destroyed = [];
let n = 0;
const fakeStream = (options, cb) =>
  new Writable({
    write(_c, _e, next) { next(); },
    final(done) {
      n += 1;
      const ext = options.resource_type === 'video' ? 'mp4' : 'jpg';
      const rec = { public_id: `${options.folder}/asset${n}`, secure_url: `https://res.cloudinary.com/demo/${options.resource_type}/upload/v1/${options.folder}/asset${n}.${ext}`, resource_type: options.resource_type, bytes: 100, format: ext };
      uploads.push({ ...rec, options });
      cb(null, rec);
      done();
    },
  });
cloudinary.uploader.upload_stream = fakeStream;
cloudinary.uploader.upload_chunked_stream = fakeStream;
cloudinary.uploader.destroy = async (id, opts) => { destroyed.push({ id, resource_type: opts.resource_type }); return { result: 'ok' }; };

/* ---- helpers ---- */
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(64)]);
const blob = (buf, type) => new Blob([buf], { type });

let server, base, cookie = '';
const call = async (method, path, { json, form, payload, files, auth = true, headers = {}, xrw = true } = {}) => {
  const h = { ...headers };
  if (xrw) h['X-Requested-With'] = 'agama-web';
  if (auth && cookie) h.Cookie = cookie;
  let body;
  if (json !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (payload !== undefined || files) {
    body = form ?? new FormData();
    if (payload !== undefined) body.append('payload', JSON.stringify(payload));
    for (const [name, [buf, type, filename]] of Object.entries(files || {})) body.append(name, blob(buf, type), filename);
  }
  const res = await fetch(base + path, { method, headers: h, body });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, res };
};

before(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  const a = new Admin({ name: 'Tester', email: 'admin@test.dev' });
  await a.setPassword('Correct-Horse-9');
  await a.save();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { server.close(); await mongoose.connection.dropDatabase(); await disconnectDB(); });

describe('auth & security', () => {
  it('rejects protected routes without a session', async () => {
    assert.equal((await call('GET', '/auth/me')).status, 401);
    assert.equal((await call('GET', '/dashboard')).status, 401);
    assert.equal((await call('GET', '/menu?scope=admin', { auth: false })).status, 401);
    assert.equal((await call('POST', '/menu-categories', { json: { name: 'x' } , auth: false})).status, 401);
  });
  it('rejects wrong credentials with a generic message', async () => {
    const r = await call('POST', '/auth/login', { json: { email: 'admin@test.dev', password: 'nope-nope-1' } });
    assert.equal(r.status, 401);
    const r2 = await call('POST', '/auth/login', { json: { email: 'ghost@test.dev', password: 'nope-nope-1' } });
    assert.equal(r.data.message, r2.data.message);
  });
  it('requires the custom header on unsafe requests (CSRF guard)', async () => {
    const r = await call('POST', '/auth/login', { json: { email: 'admin@test.dev', password: 'Correct-Horse-9' }, xrw: false });
    assert.equal(r.status, 403);
  });
  it('logs in with an HttpOnly cookie and never leaks the hash', async () => {
    const r = await call('POST', '/auth/login', { json: { email: 'ADMIN@test.dev', password: 'Correct-Horse-9' } });
    assert.equal(r.status, 200);
    const set = r.res.headers.get('set-cookie');
    assert.match(set, /agama_token=/);
    assert.match(set, /HttpOnly/i);
    assert.match(set, /SameSite=Lax/i);
    assert.ok(!JSON.stringify(r.data).includes('passwordHash'));
    cookie = set.split(';')[0];
    const me = await call('GET', '/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.data.data.admin.email, 'admin@test.dev');
  });
  it('enforces CORS allow-list with credentials', async () => {
    const ok = await fetch(base + '/health', { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(ok.headers.get('access-control-allow-credentials'), 'true');
    const bad = await fetch(base + '/health', { headers: { Origin: 'https://evil.example' } });
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
  });
  it('sets security headers', async () => {
    const r = await fetch(base + '/health');
    assert.ok(r.headers.get('x-content-type-options'));
    assert.equal(r.headers.get('x-powered-by'), null);
  });
  it('strips Mongo operators from bodies', async () => {
    const r = await call('POST', '/auth/login', { json: { email: { $gt: '' }, password: { $gt: '' } }, auth: false });
    assert.equal(r.status, 422);
  });
});

let category, menu, item;
describe('categories, menus, items + media', () => {
  it('creates a category (auto slug) and a menu document with PDF + cover uploaded from files', async () => {
    category = (await call('POST', '/menu-categories', { json: { name: 'Burgers & Wraps' } })).data.data;
    assert.equal(category.slug, 'burgers-wraps');
    const r = await call('POST', '/menu-documents', {
      payload: { title: 'Gluten Free Menu', type: 'dietary', description: 'd' },
      files: { pdf: [PDF, 'application/pdf', 'menu.pdf'], cover: [PNG, 'image/png', 'cover.png'] },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    menu = r.data.data;
    assert.equal(menu.key, 'gluten-free-menu');
    assert.match(menu.pdf.secureUrl, /^https:\/\/res\.cloudinary\.com/);
    assert.equal(menu.pdf.publicId, undefined, 'publicId must never be sent to the browser');
    const pdfUp = uploads.find((u) => u.options.folder.endsWith('menu-pdfs'));
    assert.equal(pdfUp.options.resource_type, 'image');
    const stored = await mongoose.connection.collection('menudocuments').findOne({ key: 'gluten-free-menu' });
    assert.ok(stored.pdf.publicId, 'publicId is persisted in MongoDB');
    assert.ok(stored.pdf.secureUrl);
  });
  it('rejects non-PDF disguised as a PDF and oversize files', async () => {
    const fake = await call('POST', '/menu-documents', { payload: { title: 'Bad' }, files: { pdf: [Buffer.from('this is plain text, not a pdf at all'), 'application/pdf', 'x.pdf'] } });
    assert.equal(fake.status, 422);
    const wrongMime = await call('POST', '/menu-documents', { payload: { title: 'Bad' }, files: { pdf: [PDF, 'text/plain', 'x.pdf'] } });
    assert.equal(wrongMime.status, 422);
    const big = await call('POST', '/menu-documents', { payload: { title: 'Big' }, files: { pdf: [Buffer.concat([PDF, Buffer.alloc(3 * 1024 * 1024)]), 'application/pdf', 'x.pdf'] } });
    assert.equal(big.status, 413);
  });
  it('rejects an image sent where a PDF is expected', async () => {
    const r = await call('POST', '/menu-documents', { payload: { title: 'Swap' }, files: { pdf: [PNG, 'application/pdf', 'x.pdf'] } });
    assert.equal(r.status, 422);
  });
  it('creates a dish with an uploaded photo, validates fields, and blocks bar-menu dishes', async () => {
    const bad = await call('POST', '/menu', { payload: { name: '', category: category.id, menu: menu.id } });
    assert.equal(bad.status, 422);
    assert.ok(bad.data.details.name);
    const r = await call('POST', '/menu', {
      payload: { name: 'Falafel Wrap', description: 'Crisp', price: 445, category: category.id, menu: menu.id, dietaryTags: ['Gluten free'], featured: true },
      files: { image: [JPG, 'image/jpeg', 'wrap.jpg'] },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    item = r.data.data;
    assert.equal(item.price, 445);
    assert.ok(item.image.secureUrl);
    const bar = (await call('POST', '/menu-documents', { payload: { title: 'Bar', type: 'bar' } })).data.data;
    const blocked = await call('POST', '/menu', { payload: { name: 'Wine', category: category.id, menu: bar.id } });
    assert.equal(blocked.status, 422);
  });
  it('replaces a dish photo: uploads the new one and deletes the old asset from Cloudinary', async () => {
    const before = await mongoose.connection.collection('menuitems').findOne({ name: 'Falafel Wrap' });
    destroyed.length = 0;
    const r = await call('PUT', `/menu/${item.id}`, {
      payload: { name: 'Falafel Wrap', price: 455, category: category.id, menu: menu.id },
      files: { image: [PNG, 'image/png', 'new.png'] },
    });
    assert.equal(r.status, 200);
    const after = await mongoose.connection.collection('menuitems').findOne({ name: 'Falafel Wrap' });
    assert.notEqual(after.image.publicId, before.image.publicId);
    assert.deepEqual(destroyed.map((d) => d.id), [before.image.publicId]);
    assert.equal(r.data.data.price, 455);
  });
  it('supports quick flag patches and public vs admin visibility', async () => {
    await call('PATCH', `/menu/${item.id}`, { json: { available: false } });
    const pub = await call('GET', '/menu?menu=gluten-free-menu', { auth: false });
    assert.equal(pub.data.data.length, 0);
    const adm = await call('GET', '/menu?scope=admin&q=falafel');
    assert.equal(adm.data.data.length, 1);
    await call('PATCH', `/menu/${item.id}`, { json: { available: true } });
    const pub2 = await call('GET', '/menu?menu=gluten-free-menu', { auth: false });
    assert.equal(pub2.data.data.length, 1);
    assert.equal(pub2.data.data[0].image.publicId, undefined);
  });
  it('protects categories that still hold dishes (409), then reassigns them', async () => {
    const other = (await call('POST', '/menu-categories', { json: { name: 'Mains' } })).data.data;
    const blocked = await call('DELETE', `/menu-categories/${category.id}`);
    assert.equal(blocked.status, 409);
    assert.equal(blocked.data.details.itemCount, 1);
    const ok = await call('DELETE', `/menu-categories/${category.id}?reassignTo=${other.id}`);
    assert.equal(ok.status, 200);
    const moved = await call('GET', `/menu?scope=admin&category=${other.id}`);
    assert.equal(moved.data.data.length, 1);
    category = other;
  });
  it('refuses to delete a menu that still has dishes', async () => {
    assert.equal((await call('DELETE', `/menu-documents/${menu.id}`)).status, 409);
  });
  it('deleting a dish removes its Cloudinary asset', async () => {
    destroyed.length = 0;
    assert.equal((await call('DELETE', `/menu/${item.id}`)).status, 200);
    assert.equal(destroyed.length, 1);
  });
  it('deleting a menu removes its PDF and cover from Cloudinary', async () => {
    destroyed.length = 0;
    assert.equal((await call('DELETE', `/menu-documents/${menu.id}`)).status, 200);
    assert.equal(destroyed.length, 2);
    assert.ok(destroyed.every((d) => d.resource_type === 'image'));
  });
  it('reorders categories', async () => {
    const a = (await call('POST', '/menu-categories', { json: { name: 'A' } })).data.data;
    const b = (await call('POST', '/menu-categories', { json: { name: 'B' } })).data.data;
    await call('PATCH', '/menu-categories/reorder', { json: { ids: [b.id, a.id] } });
    const list = (await call('GET', '/menu-categories', { auth: false })).data.data;
    assert.ok(list.findIndex((c) => c.name === 'B') < list.findIndex((c) => c.name === 'A'));
  });
});

describe('MediaTx rollback', () => {
  it('removes freshly uploaded assets when the database write fails', async () => {
    destroyed.length = 0;
    const tx = new MediaTx();
    await tx.put({ kind: 'image', buffer: JPG }, 'gallery');
    await assert.rejects(tx.run(async () => { throw new Error('db down'); }), /db down/);
    assert.equal(destroyed.length, 1);
  });
  it('only deletes replaced assets after a successful save', async () => {
    destroyed.length = 0;
    const tx = new MediaTx();
    tx.discard({ publicId: 'old/asset', resourceType: 'image' });
    await assert.rejects(tx.run(async () => { throw new Error('fail'); }));
    assert.equal(destroyed.length, 0);
  });
});

describe('gallery', () => {
  let img;
  it('requires a file and stores type/alt', async () => {
    assert.equal((await call('POST', '/gallery', { payload: { alt: 'x', type: 'Food' } })).status, 422);
    const r = await call('POST', '/gallery', { payload: { alt: 'Sage soup', type: 'Food', featured: true }, files: { image: [PNG, 'image/png', 'a.png'] } });
    assert.equal(r.status, 201);
    img = r.data.data;
    const up = uploads.at(-1);
    assert.equal(up.options.transformation[0].quality, 'auto:good');
  });
  it('filters publicly by type and hides disabled images', async () => {
    await call('POST', '/gallery', { payload: { alt: 'Cocktail', type: 'Drinks', enabled: false }, files: { image: [JPG, 'image/jpeg', 'b.jpg'] } });
    const food = (await call('GET', '/gallery?type=Food', { auth: false })).data.data;
    assert.equal(food.length, 1);
    assert.equal((await call('GET', '/gallery', { auth: false })).data.data.length, 1);
    assert.equal((await call('GET', '/gallery?scope=admin')).data.data.length, 2);
    assert.deepEqual((await call('GET', '/gallery/types', { auth: false })).data.data.sort(), ['Drinks', 'Food']);
  });
  it('replaces and deletes with Cloudinary cleanup', async () => {
    destroyed.length = 0;
    const r = await call('PUT', `/gallery/${img.id}`, { payload: { alt: 'Sage soup 2', type: 'Food' }, files: { image: [JPG, 'image/jpeg', 'c.jpg'] } });
    assert.equal(r.status, 200);
    assert.equal(destroyed.length, 1);
    destroyed.length = 0;
    assert.equal((await call('DELETE', `/gallery/${img.id}`)).status, 200);
    assert.equal(destroyed.length, 1);
  });
});

describe('enquiries', () => {
  let id;
  it('accepts a valid public enquiry and validates on the server', async () => {
    const bad = await call('POST', '/enquiries', { json: { name: 'A', phone: 'abc', message: 'short' }, auth: false });
    assert.equal(bad.status, 422);
    assert.ok(bad.data.details.phone && bad.data.details.message);
    const ok = await call('POST', '/enquiries', { json: { name: 'Riya Sen', phone: '+91 98765 43210', email: 'riya@example.com', enquiryType: 'Reservation', message: 'Table for 4 on Saturday evening please', preferredDate: '2026-10-03' }, auth: false });
    assert.equal(ok.status, 201);
  });
  it('silently drops honeypot submissions', async () => {
    const before = (await call('GET', '/enquiries')).data.meta.total;
    const r = await call('POST', '/enquiries', { json: { name: 'Bot Bot', phone: '9999999999', message: 'buy cheap things now', website: 'http://spam' }, auth: false });
    assert.equal(r.status, 201);
    assert.equal((await call('GET', '/enquiries')).data.meta.total, before);
  });
  it('lists for admin only, with unread count, and supports read / resolved / search / delete', async () => {
    assert.equal((await call('GET', '/enquiries', { auth: false })).status, 401);
    const list = await call('GET', '/enquiries');
    assert.equal(list.data.meta.unread, 1);
    id = list.data.data[0].id;
    assert.equal(list.data.data[0].isRead, false);
    const patched = await call('PATCH', `/enquiries/${id}`, { json: { isRead: true, status: 'resolved' } });
    assert.equal(patched.data.data.status, 'resolved');
    assert.equal((await call('GET', '/enquiries')).data.meta.unread, 0);
    assert.equal((await call('GET', '/enquiries?status=pending')).data.data.length, 0);
    assert.equal((await call('GET', '/enquiries?q=saturday')).data.data.length, 1);
    assert.equal((await call('DELETE', `/enquiries/${id}`)).status, 200);
    assert.equal((await call('GET', `/enquiries/${id}`)).status, 404);
  });
  it('rate limiter config is wired (headers present)', async () => {
    const r = await call('POST', '/enquiries', { json: { name: 'Ok Name', phone: '9876543210', message: 'Hello there, a general question.' }, auth: false });
    assert.ok(r.res.headers.get('ratelimit') || r.res.headers.get('ratelimit-policy'));
  });
});

describe('business, hours, site settings, home content, video', () => {
  it('updates business info and validates links', async () => {
    const bad = await call('PUT', '/business', { json: { name: 'Agama', links: { maps: 'not a url' } } });
    assert.equal(bad.status, 422);
    const r = await call('PUT', '/business', { json: { name: 'Agama Cafe & Bar', displayPhone: '+91 96540 07980', phone: '+919654007980', rating: 4.5, reviewCount: 153, links: { maps: 'https://maps.example.com/x', instagram: 'https://instagram.com/agama' } } });
    assert.equal(r.status, 200);
    assert.equal((await call('GET', '/business', { auth: false })).data.data.links.instagram, 'https://instagram.com/agama');
  });
  it('updates opening hours (24h times, closed toggle) and rejects bad times', async () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({ day, opensAt: '09:00', closesAt: '23:30', isClosed: day === 'Tuesday' }));
    assert.equal((await call('PUT', '/opening-hours', { json: { days: days.map((d) => ({ ...d, opensAt: '25:99' })) } })).status, 422);
    const r = await call('PUT', '/opening-hours', { json: { days, badgeText: 'Closes at 11:30 PM' } });
    assert.equal(r.status, 200);
    const pub = (await call('GET', '/site', { auth: false })).data.data;
    assert.equal(pub.hours.days.find((d) => d.day === 'Tuesday').isClosed, true);
    assert.equal(pub.business.name, 'Agama Cafe & Bar');
  });
  it('uploads a site logo from a file and can remove it (with Cloudinary delete)', async () => {
    const r = await call('PUT', '/site-settings', { payload: { siteTitle: 'Agama', themeColor: '#0c1611' }, files: { logo: [PNG, 'image/png', 'logo.png'] } });
    assert.equal(r.status, 200);
    assert.ok(r.data.data.logo.secureUrl);
    destroyed.length = 0;
    const rm = await call('PUT', '/site-settings', { payload: { siteTitle: 'Agama', removeLogo: true } });
    assert.equal(rm.data.data.logo, undefined);
    assert.equal(destroyed.length, 1);
  });
  it('manages home sections: text, images, reorder, and a video from a local file', async () => {
    const { HomeSection } = await import('../src/models/HomeSection.js');
    await HomeSection.create([{ key: 'ambience', order: 0, enabled: true }, { key: 'reel', order: 1, enabled: false }, { key: 'cta', order: 2 }]);
    const t = await call('PUT', '/home-sections/ambience', { json: { eyebrow: 'The cafe', title: 'A space', ctas: [{ label: 'Gallery', linkType: 'internal', href: '/gallery', variant: 'link' }] } });
    assert.equal(t.status, 200);
    const add = await call('POST', '/home-sections/ambience/images', { payload: { alt: 'Room', caption: '' }, files: { image: [JPG, 'image/jpeg', 'r.jpg'] } });
    assert.equal(add.status, 201);
    const imgId = add.data.data.images[0].id;
    destroyed.length = 0;
    const del = await call('DELETE', `/home-sections/ambience/images/${imgId}`);
    assert.equal(del.data.data.images.length, 0);
    assert.equal(destroyed.length, 1);

    assert.equal((await call('PUT', '/home-sections/reel/video', { payload: {}, files: { video: [PNG, 'video/mp4', 'x.mp4'] } })).status, 422, 'image bytes are not a video');
    const v = await call('PUT', '/home-sections/reel/video', { payload: {}, files: { video: [MP4, 'video/mp4', 'reel.mp4'] } });
    assert.equal(v.status, 200, JSON.stringify(v.data));
    assert.equal(uploads.at(-1).options.resource_type, 'video');
    assert.match(v.data.data.video.secureUrl, /\/video\/upload\//);
    destroyed.length = 0;
    await call('DELETE', '/home-sections/reel/video');
    assert.deepEqual(destroyed.map((d) => d.resource_type), ['video'], 'video assets are deleted with the video resource type');

    await call('PATCH', '/home-sections/reorder', { json: { keys: ['cta', 'reel', 'ambience'] } });
    await call('PUT', '/home-sections/reel', { json: { enabled: true } });
    const home = (await call('GET', '/home', { auth: false })).data.data;
    assert.deepEqual(home.sections.map((s) => s.key), ['cta', 'reel', 'ambience']);
    assert.equal((await call('PUT', '/home-sections/nope', { json: {} })).status, 404);
  });
  it('attaches a short clip to a dish photo, replaces/removes it, and cleans up every Cloudinary asset', async () => {
    const { HomeSection } = await import('../src/models/HomeSection.js');
    await HomeSection.create({ key: 'featuredDishes', order: 3, enabled: true });
    const add = await call('POST', '/home-sections/featuredDishes/images', { payload: { alt: 'Shakshuka', caption: 'Vegan Shakshuka' }, files: { image: [JPG, 'image/jpeg', 'd.jpg'] } });
    const imgId = add.data.data.images[0].id;
    const path = `/home-sections/featuredDishes/images/${imgId}/video`;

    assert.equal((await call('PUT', path, { payload: {}, files: { video: [PNG, 'video/mp4', 'x.mp4'] } })).status, 422, 'an image is not a video');
    assert.equal((await call('PUT', path, { payload: {} })).status, 422, 'a file is required');
    assert.equal((await call('PUT', `/home-sections/featuredDishes/images/000000000000000000000000/video`, { payload: {}, files: { video: [MP4, 'video/mp4', 'x.mp4'] } })).status, 404);

    const v1 = await call('PUT', path, { payload: {}, files: { video: [MP4, 'video/mp4', 'clip.mp4'] } });
    assert.equal(v1.status, 200, JSON.stringify(v1.data));
    const img = v1.data.data.images[0];
    assert.match(img.video.secureUrl, /\/video\/upload\//);
    assert.ok(img.secureUrl, 'the photo stays as the poster/fallback');
    assert.equal(img.video.publicId, undefined);
    assert.equal(uploads.at(-1).options.resource_type, 'video');

    destroyed.length = 0;
    await call('PUT', path, { payload: {}, files: { video: [MP4, 'video/mp4', 'clip2.mp4'] } });
    assert.deepEqual(destroyed.map((d) => d.resource_type), ['video'], 'replacing deletes the old clip only');

    const blend = await call('PUT', `/home-sections/featuredDishes/images/${imgId}`, { payload: { alt: 'Shakshuka', caption: 'Vegan Shakshuka', blend: true } });
    assert.equal(blend.data.data.images[0].blend, true);
    assert.ok(blend.data.data.images[0].video.secureUrl, 'editing text keeps the clip');

    destroyed.length = 0;
    const rm = await call('DELETE', path);
    assert.equal(rm.data.data.images[0].video, undefined);
    assert.deepEqual(destroyed.map((d) => d.resource_type), ['video']);

    await call('PUT', path, { payload: {}, files: { video: [MP4, 'video/mp4', 'clip3.mp4'] } });
    destroyed.length = 0;
    await call('DELETE', `/home-sections/featuredDishes/images/${imgId}`);
    assert.deepEqual(destroyed.map((d) => d.resource_type).sort(), ['image', 'video'], 'deleting a dish removes its photo AND its clip');
  });
  it('sets a hero video + image on a page banner', async () => {
    const r = await call('PUT', '/heroes/home', { payload: { title: 'From the farm,\nto your table.', ctas: [{ label: 'View Menu', linkType: 'internal', href: '/menu', variant: 'primary' }] }, files: { image: [JPG, 'image/jpeg', 'h.jpg'], video: [MP4, 'video/mp4', 'h.mp4'] } });
    assert.equal(r.status, 200);
    assert.ok(r.data.data.image.secureUrl && r.data.data.video.secureUrl);
    assert.equal((await call('PUT', '/heroes/bogus', { json: { title: 'x' } })).status, 404);
  });
});

describe('profile & sessions', () => {
  it('changes profile and requires the current password to change password', async () => {
    assert.equal((await call('PATCH', '/auth/profile', { json: { name: 'Owner', email: 'owner@test.dev' } })).status, 200);
    const wrong = await call('PATCH', '/auth/password', { json: { currentPassword: 'wrong-password-1', newPassword: 'Another-Pass-77' } });
    assert.equal(wrong.status, 422);
    const weak = await call('PATCH', '/auth/password', { json: { currentPassword: 'Correct-Horse-9', newPassword: 'short' } });
    assert.equal(weak.status, 422);
    const ok = await call('PATCH', '/auth/password', { json: { currentPassword: 'Correct-Horse-9', newPassword: 'Another-Pass-77' } });
    assert.equal(ok.status, 200);
    const old = cookie;
    cookie = ok.res.headers.get('set-cookie').split(';')[0];
    assert.equal((await call('GET', '/auth/me')).status, 200, 'the current session survives');
    cookie = old;
    assert.equal((await call('GET', '/auth/me')).status, 401, 'other sessions are signed out after a password change');
  });
  it('logout clears the cookie and dashboard counts are real', async () => {
    const login = await call('POST', '/auth/login', { json: { email: 'owner@test.dev', password: 'Another-Pass-77' } });
    cookie = login.res.headers.get('set-cookie').split(';')[0];
    const d = (await call('GET', '/dashboard')).data.data;
    assert.equal(typeof d.counts.menuItems, 'number');
    assert.ok(Array.isArray(d.recentEnquiries));
    const out = await call('POST', '/auth/logout');
    assert.match(out.res.headers.get('set-cookie'), /agama_token=;/);
  });
  it('safe error responses: unknown route 404, malformed JSON 400, no stack traces', async () => {
    assert.equal((await call('GET', '/nope', { auth: false })).status, 404);
    const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'agama-web' }, body: '{bad' });
    assert.equal(r.status, 400);
    assert.ok(!JSON.stringify(await r.json()).includes('at '));
  });
});
