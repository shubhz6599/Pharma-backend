// src/models/Bill.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IBillItemSchema {
  product: mongoose.Types.ObjectId;
  productName: string;
  hsnNo: string;
  mfgCode?: string;
  pack?: string;
  sch?: string;
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
  salesman?: string;
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerDlNo?: string;
  customerGstNo?: string;
  customerState?: string;
  customerStateCode?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierDlNo?: string;
  supplierGstNo?: string;
  items: IBillItemSchema[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  grandTotal: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BillItemSchema = new Schema<IBillItemSchema>({
  product:      { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:  { type: String, required: true },
  hsnNo:        { type: String },
  mfgCode:      { type: String },
  pack:         { type: String },
  sch:          { type: String },
  batch:        { type: String, required: true },
  expDate:      { type: Date,   required: true },
  mrp:          { type: Number, required: true },
  rate:         { type: Number, required: true },
  quantity:     { type: Number, required: true, min: 1 },
  discPercent:  { type: Number, default: 0 },
  taxableAmount:{ type: Number, required: true },
  cgstPercent:  { type: Number, default: 0 },
  cgstAmount:   { type: Number, default: 0 },
  sgstPercent:  { type: Number, default: 0 },
  sgstAmount:   { type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },
}, { _id: false });

const BillSchema = new Schema<IBillDocument>({
  billNo:            { type: String, required: true, unique: true, index: true },
  billDate:          { type: Date, default: Date.now },
  salesman:          { type: String },
  customerId:        { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName:      { type: String },
  customerPhone:     { type: String },
  customerAddress:   { type: String },
  customerDlNo:      { type: String },
  customerGstNo:     { type: String },
  customerState:     { type: String },
  customerStateCode: { type: String },
  supplierName:      { type: String },
  supplierAddress:   { type: String },
  supplierPhone:     { type: String },
  supplierDlNo:      { type: String },
  supplierGstNo:     { type: String },
  items:             [BillItemSchema],
  subtotal:          { type: Number, required: true },
  totalDiscount:     { type: Number, default: 0 },
  totalCgst:         { type: Number, default: 0 },
  totalSgst:         { type: Number, default: 0 },
  totalTax:          { type: Number, default: 0 },
  grandTotal:        { type: Number, required: true },
  createdBy:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Bill = mongoose.model<IBillDocument>('Bill', BillSchema);

// ── Transaction model ─────────────────────────────────────────
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

const TransactionSchema = new Schema<ITransactionDocument>({
  product:        { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName:    { type: String, required: true },
  batch:          { type: String, required: true },
  type:           { type: String, enum: ['purchase','sale','adjustment'], required: true, index: true },
  quantityBefore: { type: Number, required: true },
  quantityChange: { type: Number, required: true },
  quantityAfter:  { type: Number, required: true },
  reference:      { type: String },
  notes:          { type: String },
  createdBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);