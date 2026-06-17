import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerDocument extends Document {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  doctorName?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  fullAddress: string;
  totalBills: number;
  totalSpend: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [150, 'Name too long'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    alternatePhone: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    age:    { type: Number, min: 0, max: 150 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    doctorName: { type: String, trim: true },
    address: {
      line1:   { type: String, trim: true },
      city:    { type: String, trim: true },
      state:   { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    totalBills: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    isActive:   { type: Boolean, default: true },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CustomerSchema.virtual('fullAddress').get(function () {
  const a = this.address;
  if (!a) return '';
  return [a.line1, a.city, a.state, a.pincode].filter(Boolean).join(', ');
});

CustomerSchema.index({ name: 'text', phone: 'text' });

export const Customer = mongoose.model<ICustomerDocument>('Customer', CustomerSchema);