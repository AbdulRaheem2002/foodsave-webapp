import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerLead extends Document {
  ownerName: string;
  businessName: string;
  businessType: 'bakery' | 'cafe' | 'restaurant' | 'hotel' | 'grocery' | 'dessert';
  city: string;
  sector: string;
  phone: string;
  email?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'onboarded';
  createdAt: Date;
}

const PartnerLeadSchema: Schema = new Schema(
  {
    ownerName: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      enum: ['bakery', 'cafe', 'restaurant', 'hotel', 'grocery', 'dessert'],
      default: 'bakery',
    },
    city: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['new', 'contacted', 'onboarded'], default: 'new' },
  },
  { timestamps: true }
);

export const PartnerLead = mongoose.model<IPartnerLead>('PartnerLead', PartnerLeadSchema);
