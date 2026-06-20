// src/controllers/reports.controller.ts
import { Request, Response } from 'express';
import { Bill } from '../models/Bill';

// ── Sales Statement: bills within date range, with totals ────
export const getSalesStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, salesman, customerId } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (dateFrom || dateTo) {
      filter.billDate = {};
      if (dateFrom) filter.billDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.billDate.$lte = new Date(dateTo + 'T23:59:59');
    }
    if (salesman)   filter.salesman   = new RegExp(salesman, 'i');
    if (customerId) filter.customerId = customerId;

    const bills = await Bill.find(filter).sort({ billDate: -1 }).lean();

    const summary = bills.reduce((acc, b) => {
      acc.totalBills      += 1;
      acc.totalSubtotal    += b.subtotal      || 0;
      acc.totalDiscount    += b.totalDiscount || 0;
      acc.totalTax         += b.totalTax      || 0;
      acc.totalGrand        += b.grandTotal    || 0;
      acc.totalItemsSold   += (b.items || []).reduce((s, it: any) => s + (it.quantity || 0), 0);
      return acc;
    }, { totalBills: 0, totalSubtotal: 0, totalDiscount: 0, totalTax: 0, totalGrand: 0, totalItemsSold: 0 });

    res.status(200).json({
      success: true,
      data: {
        bills: bills.map(b => ({
          billNo: b.billNo, billDate: b.billDate, customerName: b.customerName,
          salesman: b.salesman, itemCount: (b.items||[]).length,
          subtotal: b.subtotal, discount: b.totalDiscount, tax: b.totalTax, grandTotal: b.grandTotal,
        })),
        summary,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Top-selling products (for analytics) ──────────────────────
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, limit = '10' } = req.query as Record<string, string>;
    const match: Record<string, any> = {};
    if (dateFrom || dateTo) {
      match.billDate = {};
      if (dateFrom) match.billDate.$gte = new Date(dateFrom);
      if (dateTo)   match.billDate.$lte = new Date(dateTo + 'T23:59:59');
    }

    const result = await Bill.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.productName',
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalAmount' },
        } },
      { $sort: { totalQty: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};