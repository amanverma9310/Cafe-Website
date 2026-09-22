import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';

const adminSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

adminSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};
adminSchema.methods.checkPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
adminSchema.set('toJSON', {
  transform: (_d, r) => ({ id: String(r._id), name: r.name, email: r.email, lastLoginAt: r.lastLoginAt, createdAt: r.createdAt }),
});

export const Admin = model('Admin', adminSchema);
