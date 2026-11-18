import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  authProvider?: 'local' | 'google';
  googleId?: string;
  role: 'consumer' | 'retailer' | 'admin';
  contactPhone?: string;
  savedFavorites: string[];
  totalSavedPkr: number;
  itemsRescuedCount: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String },
    role: { type: String, enum: ['consumer', 'retailer', 'admin'], default: 'consumer' },
    contactPhone: { type: String },
    savedFavorites: [{ type: String }],
    totalSavedPkr: { type: Number, default: 0 },
    itemsRescuedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
