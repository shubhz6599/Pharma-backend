// src/models/ProductBatch.ts — a specific stock lot of a Product, identified by batch number
import mongoose, { Document, Schema } from 'mongoose';

export interface IProductBatchDocument extends Document {
  productId: mongoose.Types.ObjectId;
  batchNo: string;
  expDate: Date;
  quantity: number;        // current saleable stock in this batch
  mrp: number;
  ptr: number;              // purchase rate (cost from supplier)
  saleRate: number;         // selling rate (defaults to MRP, can be discounted)
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  schemeNote?: string;      // e.g. "10+1" free-quantity scheme description, informational
  createdAt: Date;
  updatedAt: Date;
}

const ProductBatchSchema = new Schema<IProductBatchDocument>(
  {
    productId:  { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    batchNo:    { type: String, required: [true, 'Batch number is required'], trim: true, index: true },
    expDate:    { type: Date, required: [true, 'Expiry date is required'], index: true },
    quantity:   {
      type: Number, required: true, min: 0, default: 0,
      validate: { validator: Number.isInteger, message: 'Quantity must be an integer' },
      index: true,
    },
    mrp:          { type: Number, required: [true, 'MRP is required'], min: 0 },
    ptr:          { type: Number, required: [true, 'PTR (purchase rate) is required'], min: 0 },
    saleRate:     { type: Number, required: [true, 'Sale rate is required'], min: 0 },
    discPercent:  { type: Number, default: 0, min: 0, max: 100 },
    cgstPercent:  { type: Number, default: 0, min: 0 },
    sgstPercent:  { type: Number, default: 0, min: 0 },
    schemeNote:   { type: String, trim: true },
  },
  { timestamps: true }
);

// A product can have multiple batches, but one batch number per product must be unique
ProductBatchSchema.index({ productId: 1, batchNo: 1 }, { unique: true });
ProductBatchSchema.index({ expDate: 1, quantity: 1 });

export const ProductBatch = mongoose.model<IProductBatchDocument>('ProductBatch', ProductBatchSchema);