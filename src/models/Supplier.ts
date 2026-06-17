import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplierDocument extends Document {
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  gstNo?: string;
  drugLicenseNo?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  fullAddress: string; // virtual / computed
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: [150, 'Name too long'],
      index: true,
    },
    contactPerson: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: { type: String, trim: true },
    gstNo: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number'],
    },
    drugLicenseNo: { type: String, trim: true },
    address: {
      line1:   { type: String, required: [true, 'Address line 1 is required'], trim: true },
      line2:   { type: String, trim: true },
      city:    { type: String, required: [true, 'City is required'], trim: true },
      state:   { type: String, required: [true, 'State is required'], trim: true },
      pincode: { type: String, required: [true, 'Pincode is required'], trim: true, match: [/^\d{6}$/, 'Invalid pincode'] },
    },
    isActive:  { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full address string for auto-populate
SupplierSchema.virtual('fullAddress').get(function () {
  const a = this.address;
  if (!a) return '';
  const parts = [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean);
  return parts.join(', ');
});

// Text index for search
SupplierSchema.index({ name: 'text', contactPerson: 'text', gstNo: 'text' });
SupplierSchema.index({ phone: 1 });

export const Supplier = mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);