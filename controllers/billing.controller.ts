// src/controllers/billing.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bill } from '../src/models/Bill';
import { Product } from '../src/models/Product';
import { ApiResponse } from '../src/types';

// Auto-generate bill number
const generateBillNo = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `RX${year}${month}${random}`;
};

// Core bill generation engine — structured output awaiting print/visual layout
const structureBillData = (billDoc: any) => {
  return {
    billNo: billDoc.billNo,
    billDate: billDoc.billDate,
    customer: {
      name: billDoc.customerName || 'Walk-in Customer',
      phone: billDoc.customerPhone || '',
    },
    lineItems: billDoc.items.map((item: any, idx: number) => ({
      srNo: idx + 1,
      productName: item.productName,
      batch: item.batch,
      expDate: item.expDate,
      mrp: item.mrp,
      rate: item.rate,
      quantity: item.quantity,
      discPercent: item.discPercent,
      taxableAmount: item.taxableAmount,
      cgst: { percent: item.cgstPercent, amount: item.cgstAmount },
      sgst: { percent: item.sgstPercent, amount: item.sgstAmount },
      totalAmount: item.totalAmount,
    })),
    totals: {
      subtotal: billDoc.subtotal,
      totalDiscount: billDoc.totalDiscount,
      totalTax: billDoc.totalTax,
      grandTotal: billDoc.grandTotal,
    },
    meta: {
      createdBy: billDoc.createdBy,
      createdAt: billDoc.createdAt,
    },
  };
};

export const generateBill = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerName, customerPhone, items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Bill must contain at least one item.' });
      return;
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product ${item.productId} not found.`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.productName}. Available: ${product.quantity}`);
      }

      const discPercent = item.discPercent ?? product.discPercent;
      const taxableAmount = parseFloat((product.rate * item.quantity * (1 - discPercent / 100)).toFixed(2));
      const cgstAmount = parseFloat(((taxableAmount * product.cgstPercent) / 100).toFixed(2));
      const sgstAmount = parseFloat(((taxableAmount * product.sgstPercent) / 100).toFixed(2));
      const totalAmount = parseFloat((taxableAmount + cgstAmount + sgstAmount).toFixed(2));
      const originalAmount = product.rate * item.quantity;
      const discountAmount = parseFloat((originalAmount - taxableAmount).toFixed(2));

      subtotal += originalAmount;
      totalDiscount += discountAmount;
      totalTax += cgstAmount + sgstAmount;

      // Decrement stock
      product.quantity -= item.quantity;
      await product.save({ session });

      processedItems.push({
        product: product._id,
        productName: product.productName,
        batch: product.batch,
        expDate: product.expDate,
        mrp: product.mrp,
        rate: product.rate,
        quantity: item.quantity,
        discPercent,
        taxableAmount,
        cgstPercent: product.cgstPercent,
        cgstAmount,
        sgstPercent: product.sgstPercent,
        sgstAmount,
        totalAmount,
      });
    }

    const grandTotal = parseFloat((subtotal - totalDiscount + totalTax).toFixed(2));

    const [bill] = await Bill.create(
      [
        {
          billNo: generateBillNo(),
          customerName,
          customerPhone,
          items: processedItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalDiscount: parseFloat(totalDiscount.toFixed(2)),
          totalTax: parseFloat(totalTax.toFixed(2)),
          grandTotal,
          createdBy: req.user!.id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const structured = structureBillData(bill);

    const response: ApiResponse<typeof structured> = {
      success: true,
      message: 'Bill generated successfully.',
      data: structured,
    };
    res.status(201).json(response);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

export const getBills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', billNo, dateFrom, dateTo } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (billNo) filter.billNo = new RegExp(billNo, 'i');
    if (dateFrom || dateTo) {
      filter.billDate = {};
      if (dateFrom) filter.billDate.$gte = new Date(dateFrom);
      if (dateTo) filter.billDate.$lte = new Date(dateTo);
    }

    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email')
        .lean(),
      Bill.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: bills,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id).populate('createdBy', 'name email');
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found.' });
      return;
    }
    res.status(200).json({ success: true, data: structureBillData(bill) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { Transaction } = await import('../src/models/Bill');
    const { page = '1', limit = '20', productId, type } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (productId) filter.product = productId;
    if (type) filter.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name')
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};