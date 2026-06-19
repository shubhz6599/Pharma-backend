// src/models/Area.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAreaDocument extends Document {
  name: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const AreaSchema = new Schema<IAreaDocument>({
  name:     { type: String, required: true, trim: true, index: true },
  city:     { type: String, trim: true },
  state:    { type: String, trim: true },
  pincode:  { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy:{ type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Area = mongoose.model<IAreaDocument>('Area', AreaSchema);