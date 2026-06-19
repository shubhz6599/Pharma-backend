// src/models/TaxMaster.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITaxDocument extends Document {
  name: string;         // e.g. "GST 12%", "GST 5%", "Exempt"
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  totalPercent: number;
  hsnCodes?: string;   // comma-separated HSN codes this applies to
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const TaxSchema = new Schema<ITaxDocument>({
  name:         { type: String, required: true, trim: true },
  cgstPercent:  { type: Number, required: true, min: 0, default: 0 },
  sgstPercent:  { type: Number, required: true, min: 0, default: 0 },
  igstPercent:  { type: Number, required: true, min: 0, default: 0 },
  totalPercent: { type: Number, min: 0, default: 0 },
  hsnCodes:     { type: String, trim: true },
  isActive:     { type: Boolean, default: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

TaxSchema.pre('save', function(next) {
  this.totalPercent = this.cgstPercent + this.sgstPercent;
  next();
});

export const TaxMaster = mongoose.model<ITaxDocument>('TaxMaster', TaxSchema);