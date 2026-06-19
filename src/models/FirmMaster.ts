// src/models/FirmMaster.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFirmDocument extends Document {
  firmName: string;
  ownerName?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNo?: string;
  drugLicenseNo1?: string;
  drugLicenseNo2?: string;
  panNo?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  logoUrl?: string;
  updatedAt: Date;
}

const FirmSchema = new Schema<IFirmDocument>({
  firmName:       { type: String, required: true, trim: true },
  ownerName:      { type: String, trim: true },
  address:        { type: String, required: true, trim: true },
  city:           { type: String, required: true, trim: true },
  state:          { type: String, required: true, trim: true },
  pincode:        { type: String, required: true, trim: true },
  phone:          { type: String, required: true, trim: true },
  alternatePhone: { type: String, trim: true },
  email:          { type: String, trim: true, lowercase: true },
  gstNo:          { type: String, trim: true, uppercase: true },
  drugLicenseNo1: { type: String, trim: true },
  drugLicenseNo2: { type: String, trim: true },
  panNo:          { type: String, trim: true, uppercase: true },
  bankName:       { type: String, trim: true },
  accountNo:      { type: String, trim: true },
  ifscCode:       { type: String, trim: true, uppercase: true },
  logoUrl:        { type: String, trim: true },
}, { timestamps: true });

export const FirmMaster = mongoose.model<IFirmDocument>('FirmMaster', FirmSchema);