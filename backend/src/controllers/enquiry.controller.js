import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId, boolQuery, escapeRegex, pageMeta, pageParams, send } from '../utils/helpers.js';
import { notifyNewEnquiry, sendEnquiryConfirmation } from '../services/email.service.js';

const THANKS = { message: 'Thank you. Your enquiry has been sent.' };
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // same phone + message within 5 minutes is treated as a repeat/double-submit

export async function submitEnquiry(req, res) {
  const { website, ...data } = req.body;
  // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
  if (website) return send(res, THANKS, { status: 201 });

  // Duplicate-submission guard: a resubmit (double-click, retry, or basic bot loop) is accepted
  // but not re-saved or re-emailed — the visitor still sees the same success response either way.
  const dup = await ContactEnquiry.findOne({
    phone: data.phone,
    message: data.message,
    createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
  });
  if (dup) return send(res, THANKS, { status: 201 });

  const doc = await ContactEnquiry.create(data);
  send(res, THANKS, { status: 201 });
  // Fire-and-forget: email delivery must never delay or fail the visitor's response. Both helpers
  // already catch and log their own errors, so nothing here can produce an unhandled rejection.
  notifyNewEnquiry(doc);
  sendEnquiryConfirmation(doc);
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
