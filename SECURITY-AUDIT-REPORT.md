# Security audit — report

## Context: what this codebase actually is

Before listing fixes: this is a **single-admin content site** (a cafe's menu/gallery/reviews/hours/enquiries),
not a multi-user app. There is no public signup, no user accounts, and **no Razorpay/payments and no
SMTP/OTP infrastructure existed** anywhere in the code. Several items in a generic MERN audit checklist
therefore don't apply here and I have not invented fake integrations for them:

- **Razorpay / payments** — not present in this project at all. Nothing to secure.
- **"User accessing another user's data by changing IDs"** — there is only one admin account (seeded via
  `npm run seed`, no public registration endpoint exists), so there's no multi-tenant IDOR surface. Every
  admin-only route already requires a valid session (`requireAdmin`) — verified file-by-file, see below.
- **Full OTP-based phone/email verification** — this would require you to pick and pay for an SMS provider
  and add a genuine two-step verify flow to the contact form UI. That's a real feature addition, not a
  security patch, and I didn't want to silently change your working contact form's UX. I *did* add strong,
  zero-dependency anti-spam instead (below), and documented what a full OTP build would need if you want it
  as a follow-up.

## What I found already in place (verified, not changed)

These were already solid and I left them alone:
- Passwords: bcrypt (cost 12), timing-safe login (dummy-hash comparison so response time can't reveal
  whether an email exists), `passwordHash` has `select: false` and is stripped from every JSON response.
- Sessions: JWT in an **httpOnly, secure (in prod), SameSite** cookie — never in localStorage/frontend JS.
  `tokenVersion` invalidates all other sessions on password change.
- CSRF: all unsafe methods require a custom `X-Requested-With` header, which browsers can only attach
  cross-origin after a CORS preflight — and the CORS allow-list rejects other origins.
- Every admin-mutating route (create/update/delete across menu, gallery, reviews, content, settings) is
  gated with `requireAdmin`. Checked every route file individually.
- Every request body is parsed through a Zod schema that **replaces** `req.body` — this whitelists fields
  by construction, so mass assignment (e.g. sneaking in `role` or `isAdmin`) isn't possible anywhere.
- Every `:id` route param is validated with `assertObjectId` before hitting Mongoose.
- NoSQL operator injection: `$`-prefixed and dotted keys are stripped from every request body globally.
- File uploads: **magic-byte sniffing** (not the client-declared MIME type) plus size limits; a PDF/image/
  video field can't be swapped for another file type even if renamed.
- CORS: explicit origin allow-list (never `*`) with credentials; Helmet security headers on.
- Error handling: 5xx responses show a generic message in production; stack traces/DB details never leak.
- `.env` is git-ignored; only `.env.example` (placeholders, no real secrets) is committed.

## Issues found and fixed

**SECURITY ISSUE:** Enquiry/contact submissions were never emailed anywhere — they only sat in MongoDB
until an admin logged in and checked.
**RISK:** Medium (operational — a real enquiry could go unseen for days)
**FILE:** `backend/src/controllers/enquiry.controller.js` (new: `backend/src/services/email.service.js`)
**FIX:** Added an SMTP-based email service. Every valid enquiry now emails the full details to
`ADMIN_NOTIFY_EMAIL`, with an optional confirmation email back to the submitter. It's **off by default**
(no-op) until you set SMTP env vars, so nothing breaks if you don't configure it. Failures are caught and
logged by message only — SMTP credentials and raw error objects are never logged.

**SECURITY ISSUE:** No protection against a visitor (or bot) resubmitting the same enquiry repeatedly.
**RISK:** Low/Medium (spam, inbox flooding, duplicate emails once notifications were added)
**FILE:** `backend/src/controllers/enquiry.controller.js`, `backend/src/models/ContactEnquiry.js`
**FIX:** Identical phone+message submissions within a 5-minute window are now silently deduplicated — the
form still shows success (so nothing is revealed to a bot), but only one record is saved and one email sent.

**SECURITY ISSUE:** Email field accepted disposable/temporary-email addresses.
**RISK:** Low (fake/low-quality leads, throwaway spam)
**FILE:** `backend/src/validators/index.js`, new `backend/src/utils/disposableEmailDomains.js`
**FIX:** A curated blocklist of common disposable-email domains is now rejected at validation time with a
plain message ("Please use a permanent email address...").

**SECURITY ISSUE:** Phone validation was a loose international pattern with no India-specific check, even
though the business (₹ currency, Indian address fields) targets India.
**RISK:** Low (data quality / spam, not an exploit)
**FILE:** `backend/src/validators/index.js`, `backend/.env.example`
**FIX:** Default validation now requires a real 10-digit Indian mobile number (optional `+91`/`91`/`0`
prefix), normalized to `+91XXXXXXXXXX` for consistent storage. Set `PHONE_REGION=INTL` in `.env` if you
need to accept international numbers instead — it's a one-line config change, not a code change.

**SECURITY ISSUE (test coverage gap):** No tests for a tampered/expired JWT, or a JWT for a deleted admin
/ stale session-version — only "no cookie at all" was tested.
**RISK:** Low (coverage gap, not a live vulnerability — `requireAdmin` already handles all of these)
**FILE:** new `backend/tests/security-extra.test.js`
**FIX:** Added tests for: invalid signature, expired token, token for a non-existent admin, stale
`tokenVersion`, plus tests for the new duplicate-submission guard, disposable-email rejection, and phone
normalization.

## Files changed

- `backend/src/config/env.js` — added SMTP + `PHONE_REGION` config (all optional, safe defaults)
- `backend/src/validators/index.js` — India-aware phone validation, disposable-email check
- `backend/src/controllers/enquiry.controller.js` — email notifications + duplicate-submission guard
- `backend/src/models/ContactEnquiry.js` — added an index to support the duplicate check
- `backend/package.json` — added `nodemailer` dependency
- `backend/.env.example` — documented the new SMTP / `PHONE_REGION` variables

## Files added

- `backend/src/services/email.service.js` — SMTP notification/confirmation emails (fail-safe, no-op if unconfigured)
- `backend/src/utils/disposableEmailDomains.js` — disposable-email domain blocklist
- `backend/tests/security-extra.test.js` — JWT tampering/expiry + enquiry anti-spam tests

## Environment variables needed (all optional — nothing breaks if left blank)

```
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Agama Cafe <no-reply@yourdomain.com>"
ADMIN_NOTIFY_EMAIL=
SEND_ENQUIRY_CONFIRMATION=true
PHONE_REGION=IN
```

## Secrets that should be rotated

None found committed anywhere — `.env` is git-ignored and only placeholder `.env.example` files are in the
repo/zip. If this project has ever been pushed to a public GitHub repo with a real `.env` committed at any
point in its history, treat `MONGO_URI`, `JWT_SECRET`, and the `CLOUDINARY_*` keys as compromised and rotate
them regardless of what the current working tree shows (git history retains old commits).

## Manual deployment steps still required

1. `npm install` in `backend/` to pull in `nodemailer`.
2. If you want enquiry email notifications, set the `SMTP_*` and `ADMIN_NOTIFY_EMAIL` vars above in your
   production environment (Render/host dashboard, not committed to git).
3. Run `npm test` in `backend/` against a real (or local) MongoDB to confirm the new tests pass in your
   environment — I verified all files parse correctly but couldn't run Mongo in this sandbox.
4. If your business also serves customers outside India, set `PHONE_REGION=INTL`.
5. Not built here, and worth a dedicated follow-up if you want it: full OTP/link-based email or SMS
   verification before an enquiry is accepted. That needs an SMS provider (Twilio/MSG91/etc.), a
   verification-token model, two new endpoints, and a two-step contact form on the frontend.
