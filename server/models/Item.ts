import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  flavorProfile: 'savory' | 'sweet' | 'drinks' | 'mixed';
  isMysteryBag: boolean;
  originalPricePkr: number;
  quantity: number;
  expiryDeadline: Date;
  retailerRef: mongoose.Types.ObjectId;
  imageUrl: string;
  unitType: string;
}

const ItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['grocery', 'bakery', 'restaurant'], required: true },
    flavorProfile: {
      type: String,
      enum: ['savory', 'sweet', 'drinks', 'mixed'],
      default: 'mixed',
    },
    isMysteryBag: { type: Boolean, default: false },
    originalPricePkr: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    expiryDeadline: { type: Date, required: true },
    retailerRef: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true },
    imageUrl: { type: String, required: true },
    unitType: { type: String, default: 'pack' },
  },
  { timestamps: true }
);

export const Item = mongoose.model<IItem>('Item', ItemSchema);
