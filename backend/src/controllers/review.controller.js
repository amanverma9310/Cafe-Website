import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, boolQuery, reorder, send } from '../utils/helpers.js';

export async function listReviews(req, res) {
  const filter = req.isAdminScope ? {} : { enabled: true };
  const featured = boolQuery(req.query.featured);
  if (featured !== undefined) filter.featured = featured;
  send(res, await Review.find(filter).sort({ displayOrder: 1, createdAt: -1 }).limit(200));
}

export async function createReview(req, res) {
  const last = await Review.findOne().sort({ displayOrder: -1 });
  send(res, await Review.create({ ...req.body, displayOrder: req.body.displayOrder ?? (last ? last.displayOrder + 1 : 0) }), { status: 201 });
}

export async function updateReview(req, res) {
  const doc = await Review.findByIdAndUpdate(assertObjectId(req.params.id), { $set: req.body }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('That review could not be found.');
  send(res, doc);
}

export async function reorderReviews(req, res) {
  await reorder(Review, req.body.ids);
  send(res, { message: 'Order saved.' });
}

export async function deleteReview(req, res) {
  const doc = await Review.findByIdAndDelete(assertObjectId(req.params.id));
  if (!doc) throw ApiError.notFound('That review could not be found.');
  send(res, { message: 'Review deleted.' });
}
