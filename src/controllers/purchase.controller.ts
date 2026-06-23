// src/controllers/purchase.controller.ts — Purchase Bill: stock IN from supplier
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Purchase }     from '../models/Purchase';
import { Product }      from '../models/Product';
import { ProductBatch } from '../models/ProductBatch';
import { Supplier }     from '../models/Supplier';
import { Transaction }  from '../models/Bill';

const generatePurchaseNo = async (): Promise<string> => {
  const now    = new Date();
  const prefix = `PB${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count  = await Purchase.countDocuments({ purchaseNo: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

// ── CREATE PURCHASE (Atlas production — with session) ─────────
// For each item: finds-or-creates the ProductBatch, increases its quantity
// by (paidQty + freeQty), logs a Transaction, and updates the running totals.
export const createPurchase = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { supplierId, invoiceNo, invoiceDate, items, paymentStatus, amountPaid } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Purchase must have at least one item.' });
      return;
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) throw new Error('Supplier not found.');

    let subtotal = 0, totalDiscount = 0, totalCgst = 0, totalSgst = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const qty       = Number(item.quantity);
      const freeQty    = Number(item.freeQuantity || 0);
      const ptr        = Number(item.ptr);
      const discPct    = Number(item.discPercent || 0);
      const cgstPct    = Number(item.cgstPercent || 0);
      const sgstPct    = Number(item.sgstPercent || 0);

      const raw      = ptr * qty;  // free units don't add to cost
      const discAmt  = raw * (discPct / 100);
      const taxable  = parseFloat((raw - discAmt).toFixed(2));
      const cgstAmt  = parseFloat(((taxable * cgstPct) / 100).toFixed(2));
      const sgstAmt  = parseFloat(((taxable * sgstPct) / 100).toFixed(2));
      const totalAmt = parseFloat((taxable + cgstAmt + sgstAmt).toFixed(2));

      subtotal      += raw;
      totalDiscount += discAmt;
      totalCgst     += cgstAmt;
      totalSgst     += sgstAmt;

      // Find or create the batch for this product+batchNo
      let batch = await ProductBatch.findOne({ productId: product._id, batchNo: item.batchNo }).session(session);
      const quantityBefore = batch ? batch.quantity : 0;
      const stockIn         = qty + freeQty;

      if (batch) {
        batch.quantity += stockIn;
        // Keep latest purchase pricing as the batch's reference pricing
        batch.mrp = item.mrp; batch.ptr = ptr;
        if (item.saleRate) batch.saleRate = item.saleRate;
        batch.cgstPercent = cgstPct; batch.sgstPercent = sgstPct;
        await batch.save({ session });
      } else {
        const [newBatch] = await ProductBatch.create([{
          productId: product._id, batchNo: item.batchNo, expDate: item.expDate,
          quantity: stockIn, mrp: item.mrp, ptr, saleRate: item.saleRate || item.mrp,
          discPercent: 0, cgstPercent: cgstPct, sgstPercent: sgstPct,
          schemeNote: item.schemeNote,
        }], { session });
        batch = newBatch;
      }

      await Transaction.create([{
        productId: product._id, productName: product.productName, batchNo: item.batchNo,
        type: 'purchase', quantityBefore, quantityChange: stockIn, quantityAfter: batch.quantity,
        reference: invoiceNo, notes: item.schemeNote ? `Scheme: ${item.schemeNote}` : undefined,
        createdBy: req.user!.id,
      }], { session });

      processedItems.push({
        productId: product._id, productName: product.productName,
        batchNo: item.batchNo, expDate: item.expDate,
        quantity: qty, freeQuantity: freeQty, schemeNote: item.schemeNote,
        mrp: item.mrp, ptr, discPercent: discPct, cgstPercent: cgstPct, sgstPercent: sgstPct,
        taxableAmount: taxable, cgstAmount: cgstAmt, sgstAmount: sgstAmt, totalAmount: totalAmt,
      });
    }

    const grandTotal = parseFloat((subtotal - totalDiscount + totalCgst + totalSgst).toFixed(2));
    const purchaseNo  = await generatePurchaseNo();
    const paid         = Number(amountPaid || 0);
    const status        = paymentStatus || (paid >= grandTotal ? 'paid' : paid > 0 ? 'partial' : 'unpaid');

    const [purchase] = await Purchase.create([{
      purchaseNo, supplierId, supplierName: supplier.name, invoiceNo, invoiceDate,
      items: processedItems,
      subtotal: parseFloat(subtotal.toFixed(2)), totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalCgst: parseFloat(totalCgst.toFixed(2)), totalSgst: parseFloat(totalSgst.toFixed(2)),
      totalTax: parseFloat((totalCgst + totalSgst).toFixed(2)), grandTotal,
      paymentStatus: status, amountPaid: paid,
      createdBy: req.user!.id,
    }], { session });

    // Update supplier ledger
    await Supplier.findByIdAndUpdate(supplierId, {
      $inc: { totalPurchases: grandTotal, outstandingDue: grandTotal - paid },
    }).session(session);

    await session.commitTransaction();
    res.status(201).json({ success: true, message: `Purchase ${purchaseNo} recorded — stock updated.`, data: purchase });
  } catch (err: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

export const getPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', supplierId, dateFrom, dateTo, search } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page)), lim = Math.min(100, parseInt(limit));
    const filter: Record<string, any> = {};
    if (supplierId) filter.supplierId = supplierId;
    if (search)     filter.$or = [{ purchaseNo: new RegExp(search, 'i') }, { invoiceNo: new RegExp(search, 'i') }];
    if (dateFrom || dateTo) {
      filter.invoiceDate = {};
      if (dateFrom) filter.invoiceDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.invoiceDate.$lte = new Date(dateTo + 'T23:59:59');
    }
    const [purchases, total] = await Promise.all([
      Purchase.find(filter).sort({ createdAt: -1 }).skip((pg-1)*lim).limit(lim).populate('createdBy', 'name').lean(),
      Purchase.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: purchases, pagination: { page: pg, limit: lim, total, totalPages: Math.ceil(total/lim) } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('createdBy', 'name');
    if (!purchase) { res.status(404).json({ success: false, message: 'Purchase not found.' }); return; }
    res.status(200).json({ success: true, data: purchase });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── PURCHASE RETURN (returning damaged/excess stock to supplier) ──
export const createPurchaseReturn = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { purchaseId, items, reason } = req.body; // items: [{ productId, batchNo, quantity }]
    const purchase = await Purchase.findById(purchaseId).session(session);
    if (!purchase) throw new Error('Original purchase not found.');

    let returnTotal = 0;

    for (const item of items) {
      const batch = await ProductBatch.findOne({ productId: item.productId, batchNo: item.batchNo }).session(session);
      if (!batch) throw new Error(`Batch ${item.batchNo} not found.`);
      if (batch.quantity < item.quantity) throw new Error(`Cannot return more than current stock for batch ${item.batchNo}.`);

      const quantityBefore = batch.quantity;
      batch.quantity -= item.quantity;
      await batch.save({ session });

      const product = await Product.findById(item.productId).session(session);
      const lineValue = batch.ptr * item.quantity;
      returnTotal += lineValue;

      await Transaction.create([{
        productId: item.productId, productName: product?.productName || '', batchNo: item.batchNo,
        type: 'purchase_return', quantityBefore, quantityChange: -item.quantity, quantityAfter: batch.quantity,
        reference: purchase.purchaseNo, notes: reason,
        createdBy: req.user!.id,
      }], { session });
    }

    await Supplier.findByIdAndUpdate(purchase.supplierId, { $inc: { outstandingDue: -returnTotal } }).session(session);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Purchase return recorded. Stock decreased.', data: { returnTotal } });
  } catch (err: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};