// src/models/Product.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProductDocument extends Document {
  productName: string;
  hsnNo: string;
  mfgCompany: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  supplierAddress?: string;
  batch: string;
  pack?: string;
  sch?: string;
  expDate: Date;
  mrp: number;
  rate: number;
  discPercent: number;
  taxableAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name must be less than 200 characters'],
      index: true,
    },
    hsnNo: {
      type: String,
      required: [true, 'HSN number is required'],
      trim: true,
      index: true,
    },
    mfgCompany: {
      type: String,
      required: [true, 'Manufacturing company is required'],
      trim: true,
      index: true,
    },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplierName: { type: String, trim: true },
    supplierAddress: { type: String, trim: true },
    batch: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      index: true,
    },
    pack: {
      type: String,
      trim: true,
    },
    sch: {
      type: String,
      trim: true,
      enum: ['H', 'H1', 'X', 'G', 'C', 'C1', 'OTC', null],
      default: null,
    },
    expDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative'],
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    discPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    taxableAmount: {
      type: Number,
      default: 0,
      min: [0, 'Taxable amount cannot be negative'],
    },
    cgstPercent: {
      type: Number,
      default: 0,
      min: [0, 'CGST cannot be negative'],
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: [0, 'CGST amount cannot be negative'],
    },
    sgstPercent: {
      type: Number,
      default: 0,
      min: [0, 'SGST cannot be negative'],
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: [0, 'SGST amount cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
ProductSchema.index({ productName: 'text', mfgCompany: 'text', hsnNo: 'text' });
ProductSchema.index({ expDate: 1, quantity: 1 });

// Auto-calculate taxable and tax amounts before save
ProductSchema.pre('save', function (next) {
  const discounted = this.rate * (1 - this.discPercent / 100);
  this.taxableAmount = parseFloat(discounted.toFixed(2));
  this.cgstAmount = parseFloat(((this.taxableAmount * this.cgstPercent) / 100).toFixed(2));
  this.sgstAmount = parseFloat(((this.taxableAmount * this.sgstPercent) / 100).toFixed(2));
  next();
});

export const Product = mongoose.model<IProductDocument>('Product', ProductSchema);