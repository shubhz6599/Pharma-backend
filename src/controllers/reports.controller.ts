// src/controllers/reports.controller.ts
import { Request, Response } from 'express';
import { Bill }         from '../models/Bill';
import { Purchase }     from '../models/Purchase';
import { Product }      from '../models/Product';
import { ProductBatch } from '../models/ProductBatch';

// ── 1. SALES STATEMENT ────────────────────────────────────────
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
      acc.totalBills     += 1;
      acc.totalSubtotal  += b.subtotal      || 0;
      acc.totalDiscount  += b.totalDiscount || 0;
      acc.totalTax       += b.totalTax      || 0;
      acc.totalGrand     += b.grandTotal    || 0;
      acc.totalItemsSold += (b.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      return acc;
    }, { totalBills: 0, totalSubtotal: 0, totalDiscount: 0, totalTax: 0, totalGrand: 0, totalItemsSold: 0 });

    res.status(200).json({
      success: true,
      data: {
        bills: bills.map(b => ({
          billNo: b.billNo, billDate: b.billDate, customerName: b.customerName,
          salesman: b.salesman, itemCount: (b.items || []).length,
          subtotal: b.subtotal, discount: b.totalDiscount,
          tax: b.totalTax, grandTotal: b.grandTotal,
          paymentStatus: b.paymentStatus,
        })),
        summary,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── 2. PURCHASE REPORT ────────────────────────────────────────
export const getPurchaseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, supplierId } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (dateFrom || dateTo) {
      filter.invoiceDate = {};
      if (dateFrom) filter.invoiceDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.invoiceDate.$lte = new Date(dateTo + 'T23:59:59');
    }
    if (supplierId) filter.supplierId = supplierId;

    const purchases = await Purchase.find(filter).sort({ invoiceDate: -1 }).lean();
    const summary = purchases.reduce((acc, p) => {
      acc.totalPurchases  += 1;
      acc.totalAmount     += p.grandTotal    || 0;
      acc.totalDiscount   += p.totalDiscount || 0;
      acc.totalTax        += p.totalTax      || 0;
      acc.totalItemsBought += (p.items || []).reduce((s: number, it: any) => s + (it.quantity || 0) + (it.freeQuantity || 0), 0);
      return acc;
    }, { totalPurchases: 0, totalAmount: 0, totalDiscount: 0, totalTax: 0, totalItemsBought: 0 });

    res.status(200).json({
      success: true,
      data: {
        purchases: purchases.map(p => ({
          purchaseNo: p.purchaseNo, invoiceNo: p.invoiceNo, invoiceDate: p.invoiceDate,
          supplierName: p.supplierName, itemCount: (p.items || []).length,
          subtotal: p.subtotal, discount: p.totalDiscount,
          tax: p.totalTax, grandTotal: p.grandTotal, paymentStatus: p.paymentStatus,
        })),
        summary,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── 3. GST REPORT ─────────────────────────────────────────────
export const getGstReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, type = 'sales' } = req.query as Record<string, string>;

    if (type === 'purchase') {
      const filter: Record<string, any> = {};
      if (dateFrom || dateTo) {
        filter.invoiceDate = {};
        if (dateFrom) filter.invoiceDate.$gte = new Date(dateFrom);
        if (dateTo)   filter.invoiceDate.$lte = new Date(dateTo + 'T23:59:59');
      }
      const purchases = await Purchase.find(filter).lean();
      const rows = purchases.flatMap((p: any) =>
        (p.items || []).map((item: any) => ({
          date: p.invoiceDate, refNo: p.invoiceNo, party: p.supplierName,
          productName: item.productName, hsnNo: item.hsnNo || '',
          taxable: item.taxableAmount, cgstPct: item.cgstPercent, cgstAmt: item.cgstAmount,
          sgstPct: item.sgstPercent, sgstAmt: item.sgstAmount,
          total: item.totalAmount,
        }))
      );
      const totals = rows.reduce((a: any, r: any) => ({
        taxable: a.taxable + r.taxable, cgst: a.cgst + r.cgstAmt, sgst: a.sgst + r.sgstAmt, total: a.total + r.total,
      }), { taxable: 0, cgst: 0, sgst: 0, total: 0 });
      res.status(200).json({ success: true, data: { rows, totals, type: 'purchase' } });
    } else {
      const filter: Record<string, any> = {};
      if (dateFrom || dateTo) {
        filter.billDate = {};
        if (dateFrom) filter.billDate.$gte = new Date(dateFrom);
        if (dateTo)   filter.billDate.$lte = new Date(dateTo + 'T23:59:59');
      }
      const bills = await Bill.find(filter).lean();
      const rows = bills.flatMap((b: any) =>
        (b.items || []).map((item: any) => ({
          date: b.billDate, refNo: b.billNo, party: b.customerName || 'Walk-in',
          productName: item.productName, hsnNo: item.hsnNo || '',
          taxable: item.taxableAmount, cgstPct: item.cgstPercent, cgstAmt: item.cgstAmount,
          sgstPct: item.sgstPercent, sgstAmt: item.sgstAmount,
          total: item.totalAmount,
        }))
      );
      const totals = rows.reduce((a: any, r: any) => ({
        taxable: a.taxable + r.taxable, cgst: a.cgst + r.cgstAmt, sgst: a.sgst + r.sgstAmt, total: a.total + r.total,
      }), { taxable: 0, cgst: 0, sgst: 0, total: 0 });
      res.status(200).json({ success: true, data: { rows, totals, type: 'sales' } });
    }
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── 4. STOCK REPORT (batch-wise current stock) ────────────────
export const getStockReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, supplierId, lowStockOnly } = req.query as Record<string, string>;

    const productFilter: Record<string, any> = { isActive: true };
    if (category)   productFilter.category   = category;
    if (supplierId) productFilter.supplierId = supplierId;

    const products = await Product.find(productFilter).lean();
    const productIds = products.map(p => p._id);

    const batchFilter: Record<string, any> = { productId: { $in: productIds } };
    if (lowStockOnly !== 'true') batchFilter.quantity = { $gte: 0 };

    const batches = await ProductBatch.find(batchFilter).sort({ expDate: 1 }).lean();
    const productMap = new Map(products.map(p => [(p._id as any).toString(), p]));

    // Group by product, attach batches
    const stockMap = new Map<string, any>();
    for (const b of batches) {
      const pid = b.productId.toString();
      const p   = productMap.get(pid);
      if (!stockMap.has(pid)) {
        stockMap.set(pid, {
          productId: pid, productName: p?.productName, genericName: p?.genericName,
          mfgCompany: p?.mfgCompany, category: p?.category, unit: p?.unit, hsnNo: p?.hsnNo,
          minStockLevel: p?.minStockLevel ?? 10, totalStock: 0, batches: [],
        });
      }
      const entry = stockMap.get(pid);
      entry.totalStock += b.quantity;
      entry.batches.push({ batchNo: b.batchNo, expDate: b.expDate, quantity: b.quantity, mrp: b.mrp, ptr: b.ptr });
    }

    let rows = Array.from(stockMap.values());
    if (lowStockOnly === 'true') rows = rows.filter(r => r.totalStock < r.minStockLevel);

    const summary = {
      totalProducts:   rows.length,
      totalBatches:    batches.length,
      lowStockCount:   rows.filter(r => r.totalStock < r.minStockLevel).length,
      totalStockValue: batches.reduce((s, b) => s + b.mrp * b.quantity, 0),
    };

    res.status(200).json({ success: true, data: { rows, summary } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── 5. EXPIRY REPORT ──────────────────────────────────────────
export const getExpiryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'expiring' } = req.query as Record<string, string>;
    const now           = new Date();
    const threeMonths   = new Date(); threeMonths.setMonth(threeMonths.getMonth() + 3);

    const batchFilter: Record<string, any> = type === 'expired'
      ? { expDate: { $lt: now }, quantity: { $gt: 0 } }
      : { expDate: { $gte: now, $lte: threeMonths }, quantity: { $gt: 0 } };

    const batches = await ProductBatch.find(batchFilter).sort({ expDate: 1 }).lean();
    const productIds = [...new Set(batches.map(b => b.productId.toString()))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [(p._id as any).toString(), p]));

    const rows = batches.map(b => {
      const p = productMap.get(b.productId.toString());
      const daysLeft = Math.ceil((new Date(b.expDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        productId: b.productId, productName: p?.productName, genericName: p?.genericName,
        mfgCompany: p?.mfgCompany, category: p?.category,
        batchNo: b.batchNo, expDate: b.expDate, quantity: b.quantity,
        mrp: b.mrp, stockValue: b.mrp * b.quantity, daysLeft,
      };
    });

    const summary = {
      totalBatches: rows.length,
      totalQuantity: rows.reduce((s, r) => s + r.quantity, 0),
      totalValue:    rows.reduce((s, r) => s + r.stockValue, 0),
    };

    res.status(200).json({ success: true, data: { rows, summary, type } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── 6. TOP PRODUCTS ───────────────────────────────────────────
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
      { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalAmount' } } },
      { $sort: { totalQty: -1 } },
      { $limit: parseInt(limit) },
    ]);
    res.status(200).json({ success: true, data: result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};