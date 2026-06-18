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
  hsnNo: string;
  mfgCompany: string;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
  batch: string;
  pack?: string;
  sch?: string;
  expDate: Date;
  mrp: number;
  rate: number;
  discPercent?: number;
  taxableAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBillItem {
  product: string;
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
  createdBy: string;
  createdAt?: Date;
}

export interface ITransaction {
  _id?: string;
  product: string;
  productName: string;
  batch: string;
  type: 'purchase' | 'sale' | 'adjustment';
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