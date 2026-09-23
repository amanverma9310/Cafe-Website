import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGO_URI: process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/agama_test_security',
  JWT_SECRET: 'test-secret-test-secret-test-secret',
  CLIENT_URL: 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's',
  MAX_IMAGE_MB: '1', MAX_PDF_MB: '2', MAX_VIDEO_MB: '3',
  // SMTP intentionally left unconfigured: notifyNewEnquiry()/sendEnquiryConfirmation() must no-op safely.
});

const { createApp } = await import('../src/app.js');
const { connectDB, disconnectDB } = await import('../src/config/db.js');
const { Admin } = await import('../src/models/Admin.js');
const { ContactEnquiry } = await import('../src/models/ContactEnquiry.js');
const mongoose = (await import('mongoose')).default;

let server, base;
const call = async (method, path, { json, headers = {} } = {}) => {
  const h = { 'X-Requested-With': 'agama-web', ...headers };
  let body;
  if (json !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  const res = await fetch(base + path, { method, headers: h, body });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, res };
};

const validEnquiry = () => ({
  name: 'Test Visitor',
  phone: '9876543210',
  email: 'real.visitor@gmail.com',
  enquiryType: 'General enquiry',
  message: 'Do you have outdoor seating available this weekend?',
});

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

describe('JWT handling', () => {
  it('rejects a JWT with an invalid signature', async () => {
    const bad = jwt.sign({ sub: '507f1f77bcf86cd799439011', tv: 0 }, 'wrong-secret-wrong-secret-x', { algorithm: 'HS256' });
    const r = await call('GET', '/auth/me', { headers: { Cookie: `agama_token=${bad}` } });
    assert.equal(r.status, 401);
  });

  it('rejects an expired JWT even with the correct secret', async () => {
    const expired = jwt.sign({ sub: '507f1f77bcf86cd799439011', tv: 0 }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: -10 });
    const r = await call('GET', '/auth/me', { headers: { Cookie: `agama_token=${expired}` } });
    assert.equal(r.status, 401);
  });

  it('rejects a well-formed JWT for a deleted/non-existent admin', async () => {
    const ghost = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), tv: 0 }, process.env.JWT_SECRET, { algorithm: 'HS256' });
    const r = await call('GET', '/auth/me', { headers: { Cookie: `agama_token=${ghost}` } });
    assert.equal(r.status, 401);
  });

  it('rejects a token whose tokenVersion no longer matches (e.g. after a password change)', async () => {
    const admin = await Admin.findOne({ email: 'admin@test.dev' });
    const stale = jwt.sign({ sub: String(admin._id), tv: admin.tokenVersion + 1 }, process.env.JWT_SECRET, { algorithm: 'HS256' });
    const r = await call('GET', '/auth/me', { headers: { Cookie: `agama_token=${stale}` } });
    assert.equal(r.status, 401);
  });
});

describe('enquiry form anti-spam', () => {
  it('accepts a valid Indian phone number and normalizes it', async () => {
    const r = await call('POST', '/enquiries', { json: validEnquiry() });
    assert.equal(r.status, 201);
    const saved = await ContactEnquiry.findOne({ email: 'real.visitor@gmail.com' });
    assert.equal(saved.phone, '+919876543210');
  });

  it('rejects an invalid Indian phone number', async () => {
    const r = await call('POST', '/enquiries', { json: { ...validEnquiry(), phone: '12345' } });
    assert.equal(r.status, 422);
  });

  it('rejects a disposable/temporary email address', async () => {
    const r = await call('POST', '/enquiries', { json: { ...validEnquiry(), email: 'spammer@mailinator.com' } });
    assert.equal(r.status, 422);
  });

  it('silently de-duplicates an identical resubmission within the duplicate window', async () => {
    const payload = { ...validEnquiry(), phone: '9123456780', message: 'Checking your vegan brunch menu options please.' };
    const before1 = await ContactEnquiry.countDocuments({ phone: '+919123456780' });
    const r1 = await call('POST', '/enquiries', { json: payload });
    const r2 = await call('POST', '/enquiries', { json: payload });
    const after1 = await ContactEnquiry.countDocuments({ phone: '+919123456780' });
    assert.equal(r1.status, 201);
    assert.equal(r2.status, 201); // visitor still sees success both times — no information is leaked
    assert.equal(after1 - before1, 1); // but only one record was actually saved
  });

  it('still saves the enquiry when SMTP is not configured (email is a no-op, not a failure)', async () => {
    const payload = { ...validEnquiry(), phone: '9988776655', email: '', message: 'No SMTP configured in this test environment at all.' };
    const r = await call('POST', '/enquiries', { json: payload });
    assert.equal(r.status, 201);
    const saved = await ContactEnquiry.findOne({ phone: '+919988776655' });
    assert.ok(saved);
  });
});
