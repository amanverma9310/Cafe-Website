import { Schema, model } from 'mongoose';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const daySchema = new Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    isClosed: { type: Boolean, default: false },
    opensAt: { type: String, default: '', match: [/^(\d{2}:\d{2})?$/, 'Use HH:MM (24-hour) format'] },
    closesAt: { type: String, default: '', match: [/^(\d{2}:\d{2})?$/, 'Use HH:MM (24-hour) format'] },
    note: { type: String, trim: true, maxlength: 80, default: '' },
  },
  { _id: false },
);

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    days: { type: [daySchema], default: () => DAYS.map((day) => ({ day })) },
    badgeText: { type: String, trim: true, maxlength: 60, default: '' },
    disclaimer: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true },
);

export const OpeningHours = model('OpeningHours', schema);
