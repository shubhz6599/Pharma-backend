// src/models/Bill.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IBillItemSchema {
  product: mongoose.Types.ObjectId;
  productName: string;
  batch: string;
  expDate: Date;
  mrp: number;
  rate: number;
  quantity: number;
  discPercent: number;
  taxableAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface IBillDocument extends Document {
  billNo: string;
  billDate: Date;
  customerName?: string;
  customerPhone?: string;
  items: IBillItemSchema[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BillItemSchema = new Schema<IBillItemSchema>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  batch: { type: String, required: true },
  expDate: { type: Date, required: true },
  mrp: { type: Number, required: true },
  rate: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  discPercent: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  cgstPercent: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
});

const BillSchema = new Schema<IBillDocument>(
  {
    billNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    billDate: { type: Date, default: Date.now },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    items: [BillItemSchema],
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Bill = mongoose.model<IBillDocument>('Bill', BillSchema);


// src/models/Transaction.ts
export interface ITransactionDocument extends Document {
  product: mongoose.Types.ObjectId;
  productName: string;
  batch: string;
  type: 'purchase' | 'sale' | 'adjustment';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reference?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    batch: { type: String, required: true },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'adjustment'],
      required: true,
      index: true,
    },
    quantityBefore: { type: Number, required: true },
    quantityChange: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reference: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);