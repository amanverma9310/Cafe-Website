import { hashVisitor, Visit } from '../models/Visit.js';
import { send } from '../utils/helpers.js';

/** Public: records one page view. Best-effort — the frontend never surfaces failures from this. */
export async function recordVisit(req, res) {
  const path = typeof req.body?.path === 'string' && req.body.path ? req.body.path.slice(0, 200) : '/';
  await Visit.create({ path, visitorHash: hashVisitor(req) });
  send(res, { message: 'ok' }, { status: 201 });
}
