// src/models/Purchase.ts — Purchase Bill: buying from supplier, increases stock
import mongoose, { Document, Schema } from 'mongoose';

interface IPurchaseItemSchema {
  productId: mongoose.Types.ObjectId;
  productName: string;
  batchNo: string;
  expDate: Date;
  quantity: number;       // paid quantity
  freeQuantity: number;   // bonus/scheme quantity (e.g. "10+1" → freeQuantity = 1)
  schemeNote?: string;    // e.g. "10+1"
  mrp: number;
  ptr: number;             // purchase rate per unit
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface IPurchaseDocument extends Document {
  purchaseNo: string;       // internal sequential reference
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  invoiceNo: string;        // supplier's own invoice number
  invoiceDate: Date;
  items: IPurchaseItemSchema[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  grandTotal: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItemSchema>({
  productId:     { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:   { type: String, required: true },
  batchNo:       { type: String, required: true },
  expDate:       { type: Date, required: true },
  quantity:      { type: Number, required: true, min: 1 },
  freeQuantity:  { type: Number, default: 0, min: 0 },
  schemeNote:    { type: String, trim: true },
  mrp:           { type: Number, required: true },
  ptr:           { type: Number, required: true },
  discPercent:   { type: Number, default: 0 },
  cgstPercent:   { type: Number, default: 0 },
  sgstPercent:   { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  cgstAmount:    { type: Number, default: 0 },
  sgstAmount:    { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
}, { _id: false });

const PurchaseSchema = new Schema<IPurchaseDocument>({
  purchaseNo:    { type: String, required: true, unique: true, index: true },
  supplierId:    { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName:  { type: String, required: true },
  invoiceNo:     { type: String, required: true, trim: true },
  invoiceDate:   { type: Date, required: true },
  items:         [PurchaseItemSchema],
  subtotal:      { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalCgst:     { type: Number, default: 0 },
  totalSgst:     { type: Number, default: 0 },
  totalTax:      { type: Number, default: 0 },
  grandTotal:    { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
  amountPaid:    { type: Number, default: 0 },
  createdBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

PurchaseSchema.index({ invoiceDate: -1 });
PurchaseSchema.index({ supplierId: 1, invoiceDate: -1 });

export const Purchase = mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema);
