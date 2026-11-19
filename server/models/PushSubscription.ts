import mongoose, { Schema, Document } from 'mongoose';

export type DropPreferenceType = 'all' | 'sweet' | 'savory' | 'drinks';
export type PushDeviceType = 'desktop' | 'android' | 'ios' | 'other';

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  city: string;
  sectors: string[];
  preferences: DropPreferenceType[];
  deviceType: PushDeviceType;
  userRef?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema(
  {
    endpoint: { type: String, required: true, unique: true, trim: true },
    keys: {
      p256dh: { type: String, required: true, trim: true },
      auth: { type: String, required: true, trim: true },
    },
    city: { type: String, default: 'Islamabad', trim: true },
    sectors: { type: [String], default: ['All Islamabad'] },
    preferences: {
      type: [String],
      enum: ['all', 'sweet', 'savory', 'drinks'],
      default: ['all'],
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'android', 'ios', 'other'],
      default: 'other',
    },
    userRef: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  PushSubscriptionSchema
);
