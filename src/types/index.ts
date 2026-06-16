// src/types/index.ts

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'billing';
  createdAt?: Date;
}

export interface IProduct {
  _id?: string;
  productName: string;
  hsnNo: string;
  mfgCompany: string;
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
  product: string; // ObjectId ref
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

export interface IBill {
  _id?: string;
  billNo: string;
  billDate: Date;
  customerName?: string;
  customerPhone?: string;
  items: IBillItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  createdBy: string; // ObjectId ref
  createdAt?: Date;
}

export interface ITransaction {
  _id?: string;
  product: string; // ObjectId ref
  productName: string;
  batch: string;
  type: 'purchase' | 'sale' | 'adjustment';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reference?: string; // Bill No or PO No
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
  filter?: string;
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