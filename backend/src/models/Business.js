import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    name: { type: String, trim: true, required: [true, 'Cafe name is required'], maxlength: 100 },
    hindiName: { type: String, trim: true, maxlength: 100, default: '' },
    strapline: { type: String, trim: true, maxlength: 160, default: '' },
    category: { type: String, trim: true, maxlength: 120, default: '' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    spend: { type: String, trim: true, maxlength: 80, default: '' },
    phone: { type: String, trim: true, default: '' },
    displayPhone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    shortAddress: { type: String, trim: true, maxlength: 120, default: '' },
    plusCode: { type: String, trim: true, maxlength: 80, default: '' },
    currencySymbol: { type: String, trim: true, maxlength: 4, default: '₹' },
    priceRange: { type: String, trim: true, maxlength: 10, default: '₹₹' },
    whatsappEnabled: { type: Boolean, default: false },
    reservationInfo: { type: String, trim: true, maxlength: 600, default: '' },
    addressParts: {
      streetAddress: { type: String, trim: true, default: '' },
      locality: { type: String, trim: true, default: '' },
      region: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'IN' },
    },
    links: {
      maps: { type: String, trim: true, default: '' },
      reservation: { type: String, trim: true, default: '/contact#enquiry' },
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      orderOnline: { type: String, trim: true, default: '' },
      other: [{ _id: false, label: { type: String, trim: true, maxlength: 40 }, url: { type: String, trim: true } }],
    },
  },
  { timestamps: true },
);

export const Business = model('Business', schema);
