import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 24 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    enquiryType: { type: String, enum: ['Reservation', 'General enquiry'], default: 'General enquiry' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    preferredDate: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending', index: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });

export const ContactEnquiry = model('ContactEnquiry', schema);
