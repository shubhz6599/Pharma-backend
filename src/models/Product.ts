// src/models/Product.ts — PRODUCT MASTER (catalog entry, no stock/batch data here)
import mongoose, { Document, Schema } from 'mongoose';

export interface IProductDocument extends Document {
  productName: string;
  genericName?: string;
  mfgCompany: string;
  category?: string;
  unit?: string;            // e.g. Strip, Bottle, Box, Vial
  hsnNo: string;
  sch?: string;             // schedule: H, H1, X, G, C, C1, OTC
  minStockLevel: number;    // per-product reorder threshold
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  supplierAddress?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    productName: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 200, index: true },
    genericName: { type: String, trim: true, maxlength: 200, index: true },
    mfgCompany: { type: String, required: [true, 'Manufacturing company is required'], trim: true, index: true },
    category: { type: String, trim: true, index: true },
    unit: { type: String, trim: true, default: 'Strip' },
    hsnNo: { type: String, required: [true, 'HSN number is required'], trim: true, index: true },
    sch: {
      type: String,
      trim: true,
      enum: ['H', 'H1', 'X', 'G', 'C', 'C1', 'OTC', null],
      default: null,
    },
    minStockLevel: { type: Number, default: 10, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplierName: { type: String, trim: true },
    supplierAddress: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ productName: 'text', genericName: 'text', mfgCompany: 'text', hsnNo: 'text', category: 'text' });

export const Product = mongoose.model<IProductDocument>('Product', ProductSchema);