import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

/** True once SMTP host/user/pass and an admin recipient are all configured. Email is a no-op until then. */
export function isEmailConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && env.smtp.adminEmail);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure, // true for port 465, false for 587/STARTTLS
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function enquiryRows(enquiry) {
  return [
    ['Type', enquiry.enquiryType],
    ['Name', enquiry.name],
    ['Phone', enquiry.phone],
    ['Email', enquiry.email || '—'],
    ['Preferred date', enquiry.preferredDate ? new Date(enquiry.preferredDate).toLocaleDateString('en-IN') : '—'],
    ['Message', enquiry.message],
  ];
}

/**
 * Emails the cafe admin the full details of a new enquiry.
 * Best-effort: any SMTP failure is logged (message only, never credentials/raw error) and swallowed —
 * a broken mail server must never break the public contact form.
 */
export async function notifyNewEnquiry(enquiry) {
  if (!isEmailConfigured()) return;
  try {
    const html = `<h2>New ${escapeHtml(enquiry.enquiryType)}</h2><table cellpadding="6">${enquiryRows(enquiry)
      .map(([k, v]) => `<tr><td><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v)}</td></tr>`)
      .join('')}</table>`;
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: env.smtp.adminEmail,
      replyTo: enquiry.email || undefined,
      subject: `New ${enquiry.enquiryType} — ${enquiry.name}`,
      html,
    });
  } catch (err) {
    console.error('[email] failed to notify admin of new enquiry:', err.message);
  }
}

/** Optional: a short confirmation to the person who submitted the form. Best-effort, never throws. */
export async function sendEnquiryConfirmation(enquiry) {
  if (!isEmailConfigured() || !enquiry.email || !env.smtp.sendConfirmation) return;
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: enquiry.email,
      subject: 'We received your message',
      html: `<p>Hi ${escapeHtml(enquiry.name)},</p><p>Thanks for reaching out — we've received your ${escapeHtml(enquiry.enquiryType.toLowerCase())} and will get back to you shortly.</p>`,
    });
  } catch (err) {
    console.error('[email] failed to send enquiry confirmation:', err.message);
  }
}
