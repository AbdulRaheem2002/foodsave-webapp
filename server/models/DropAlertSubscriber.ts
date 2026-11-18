import mongoose, { Schema, Document } from 'mongoose';

export interface IDropAlertSubscriber extends Document {
  name?: string;
  phone: string;
  email?: string;
  city: string;
  sector: string;
  preference: 'all' | 'sweet' | 'savory' | 'drinks';
  isActive: boolean;
  createdAt: Date;
}

const DropAlertSubscriberSchema: Schema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    city: { type: String, default: 'Islamabad', trim: true },
    sector: { type: String, default: 'All Islamabad', trim: true },
    preference: {
      type: String,
      enum: ['all', 'sweet', 'savory', 'drinks'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DropAlertSubscriber = mongoose.model<IDropAlertSubscriber>(
  'DropAlertSubscriber',
  DropAlertSubscriberSchema
);
