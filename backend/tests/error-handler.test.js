import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

Object.assign(process.env, { NODE_ENV: 'test', MONGO_URI: 'mongodb://127.0.0.1:27017/x', JWT_SECRET: 'test-secret-test-secret-test-secret' });
const { errorHandler } = await import('../src/middleware/error.middleware.js');
const { ApiError } = await import('../src/utils/ApiError.js');

const run = (err) => {
  let out;
  const res = { status(c) { out = { code: c }; return this; }, json(b) { out.body = b; } };
  errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, () => {});
  return out;
};

describe('error handler', () => {
  it('shows deliberate 5xx ApiErrors (e.g. media storage not configured) to the admin', () => {
    const r = run(new ApiError(503, 'Media storage is not configured yet. Add your Cloudinary credentials.'));
    assert.equal(r.code, 503);
    assert.match(r.body.message, /Media storage is not configured/);
  });
  it('masks unexpected crashes and never leaks internals', () => {
    const r = run(new Error('connect ECONNREFUSED 10.0.0.5:27017 secret-detail'));
    assert.equal(r.code, 500);
    assert.equal(r.body.message, 'Something went wrong on our side. Please try again.');
    assert.ok(!JSON.stringify(r.body).includes('secret-detail'));
  });
});
