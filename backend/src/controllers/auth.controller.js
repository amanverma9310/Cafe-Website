import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { send } from '../utils/helpers.js';
import { clearSession, issueSession } from '../middleware/auth.middleware.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export async function login(req, res) {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  // Always run a bcrypt comparison so response time does not reveal whether the email exists.
  const ok = admin ? await admin.checkPassword(password) : (await bcrypt.compare(password, DUMMY_HASH), false);
  if (!ok) throw ApiError.unauthorized('Incorrect email or password.');
  admin.lastLoginAt = new Date();
  await admin.save();
  issueSession(res, admin);
  send(res, { admin });
}

export async function logout(_req, res) {
  clearSession(res);
  send(res, { message: 'Signed out.' });
}

export async function me(req, res) {
  send(res, { admin: req.admin });
}

export async function updateProfile(req, res) {
  const { name, email } = req.body;
  const taken = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: req.admin._id } });
  if (taken) throw ApiError.conflict('That email is already in use.', { email: 'That email is already in use.' });
  req.admin.name = name;
  req.admin.email = email;
  await req.admin.save();
  send(res, { admin: req.admin });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id).select('+passwordHash');
  if (!(await admin.checkPassword(currentPassword))) {
    throw ApiError.invalid('Your current password is incorrect.', { currentPassword: 'Your current password is incorrect.' });
  }
  if (currentPassword === newPassword) throw ApiError.invalid('Choose a password you have not used before.', { newPassword: 'Choose a different password.' });
  await admin.setPassword(newPassword);
  admin.tokenVersion += 1; // signs out every other session
  await admin.save();
  issueSession(res, admin);
  send(res, { message: 'Password updated.' });
}
