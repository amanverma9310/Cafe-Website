import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    reviewerName: { type: String, required: [true, 'Reviewer name is required'], trim: true, maxlength: 80 },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    text: { type: String, required: [true, 'Review text is required'], trim: true, maxlength: 800 },
    source: { type: String, trim: true, maxlength: 40, default: '' },
    enabled: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Review = model('Review', schema);
