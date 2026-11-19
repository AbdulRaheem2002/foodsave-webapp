import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
  userRef: mongoose.Types.ObjectId;
  dealRef: mongoose.Types.ObjectId;
  retailerRef: mongoose.Types.ObjectId;
  pickupCode: string;
  status: 'pending' | 'collected' | 'no-show' | 'cancelled';
  pickupWindowEnd: Date;
  quantity: number;
  totalAmountPkr: number;
  paymentMethod: 'JazzCash' | 'EasyPaisa' | 'Cash on Pickup';
  paymentStatus: 'paid' | 'pending';
  paymentReference?: string;
  dismissedByUser?: boolean;
}

const ReservationSchema: Schema = new Schema(
  {
    userRef: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dealRef: { type: Schema.Types.ObjectId, ref: 'Deal', required: true },
    retailerRef: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true },
    pickupCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'collected', 'no-show', 'cancelled'], default: 'pending' },
    pickupWindowEnd: { type: Date, required: true },
    quantity: { type: Number, default: 1 },
    totalAmountPkr: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['JazzCash', 'EasyPaisa', 'Cash on Pickup'], default: 'Cash on Pickup' },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentReference: { type: String, default: '' },
    dismissedByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);
