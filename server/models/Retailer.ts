import mongoose, { Schema, Document } from 'mongoose';

export interface IRetailer extends Document {
  name: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    sector?: string;
  };
  isVerified: boolean;
  rating: number;
  contactPhone: string;
  userRef?: mongoose.Types.ObjectId;
  totalRecoveredPkr: number;
  totalWastedValueAvoidedPkr: number;
}

const RetailerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['grocery', 'bakery', 'restaurant'], required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
      city: { type: String, default: 'Islamabad' },
      sector: { type: String, default: '' },
    },
    isVerified: { type: Boolean, default: true },
    rating: { type: Number, default: 4.8 },
    contactPhone: { type: String, default: '+92 300 1234567' },
    userRef: { type: Schema.Types.ObjectId, ref: 'User' },
    totalRecoveredPkr: { type: Number, default: 0 },
    totalWastedValueAvoidedPkr: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Retailer = mongoose.model<IRetailer>('Retailer', RetailerSchema);
