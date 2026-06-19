// src/models/Salesman.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISalesmanDocument extends Document {
  name: string;
  phone?: string;
  email?: string;
  area?: string;
  commissionPercent?: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const SalesmanSchema = new Schema<ISalesmanDocument>({
  name:               { type: String, required: true, trim: true, index: true },
  phone:              { type: String, trim: true },
  email:              { type: String, trim: true, lowercase: true },
  area:               { type: String, trim: true },
  commissionPercent:  { type: Number, default: 0, min: 0, max: 100 },
  isActive:           { type: Boolean, default: true },
  createdBy:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Salesman = mongoose.model<ISalesmanDocument>('Salesman', SalesmanSchema);