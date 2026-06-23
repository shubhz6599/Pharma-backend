// src/types/index.ts

export interface IUser {
  _id?: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'billing';
  isVerified: boolean;
  createdAt?: Date;
}

export interface IProduct {
  _id?: string;
  productName: string;
  genericName?: string;
  mfgCompany: string;
  category?: string;
  unit?: string;
  hsnNo: string;
  sch?: string;
  minStockLevel: number;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductBatch {
  _id?: string;
  productId: string;
  batchNo: string;
  expDate: Date;
  quantity: number;
  mrp: number;
  ptr: number;
  saleRate: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  schemeNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPurchaseItem {
  productId: string;
  productName: string;
  batchNo: string;
  expDate: Date;
  quantity: number;
  freeQuantity: number;
  schemeNote?: string;
  mrp: number;
  ptr: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface IPurchase {
  _id?: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: Date;
  items: IPurchaseItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  grandTotal: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  createdBy: string;
  createdAt?: Date;
}

export interface IBillItem {
  productId: string;
  productName: string;
  hsnNo: string;
  mfgCode?: string;
  unit?: string;
  sch?: string;
  batchId?: string;
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

export interface IBill {
  _id?: string;
  billNo: string;
  billDate: Date;
  salesman?: string;
  customerId?: string;
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
  items: IBillItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partial' | 'credit';
  isReturned: boolean;
  createdBy: string;
  createdAt?: Date;
}

export interface ITransaction {
  _id?: string;
  productId: string;
  productName: string;
  batchNo: string;
  type: 'purchase' | 'sale' | 'purchase_return' | 'sale_return' | 'adjustment';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt?: Date;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}