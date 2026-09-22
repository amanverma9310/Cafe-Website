import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, boolQuery, escapeRegex, pageMeta, pageParams, send } from '../utils/helpers.js';

export async function submitEnquiry(req, res) {
  const { website, ...data } = req.body;
  // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
  if (website) return send(res, { message: 'Thank you. Your enquiry has been sent.' }, { status: 201 });
  await ContactEnquiry.create(data);
  send(res, { message: 'Thank you. Your enquiry has been sent.' }, { status: 201 });
}

export async function listEnquiries(req, res) {
  const q = req.query;
  const filter = {};
  if (['pending', 'resolved'].includes(q.status)) filter.status = q.status;
  const isRead = boolQuery(q.isRead);
  if (isRead !== undefined) filter.isRead = isRead;
  if (['Reservation', 'General enquiry'].includes(q.enquiryType)) filter.enquiryType = q.enquiryType;
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { message: rx }];
  }
  const { page, limit, skip } = pageParams(q, { defaultLimit: 15, maxLimit: 100 });
  const [total, unread, items] = await Promise.all([
    ContactEnquiry.countDocuments(filter),
    ContactEnquiry.countDocuments({ isRead: false }),
    ContactEnquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  send(res, items, { meta: { ...pageMeta(page, limit, total), unread } });
}

export async function getEnquiry(req, res) {
  const doc = await ContactEnquiry.findById(assertObjectId(req.params.id));
  if (!doc) throw ApiError.notFound('That enquiry could not be found.');
  send(res, doc);
}

export async function patchEnquiry(req, res) {
  const doc = await ContactEnquiry.findByIdAndUpdate(assertObjectId(req.params.id), { $set: req.body }, { new: true });
  if (!doc) throw ApiError.notFound('That enquiry could not be found.');
  send(res, doc);
}

export async function deleteEnquiry(req, res) {
  const doc = await ContactEnquiry.findByIdAndDelete(assertObjectId(req.params.id));
  if (!doc) throw ApiError.notFound('That enquiry could not be found.');
  send(res, { message: 'Enquiry deleted.' });
}
