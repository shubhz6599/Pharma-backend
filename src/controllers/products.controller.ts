// src/controllers/products.controller.ts — Product MASTER + Batch operations
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product }      from '../models/Product';
import { ProductBatch } from '../models/ProductBatch';
import { Transaction }  from '../models/Bill';
import { ApiResponse }  from '../types';

// ════════════════════════════════════════════════════════════
// PRODUCT MASTER CRUD
// ════════════════════════════════════════════════════════════

const buildProductSearchQuery = (query: Record<string, string>) => {
  const filter: Record<string, any> = { isActive: true };
  if (query.search) {
    const re = new RegExp(query.search, 'i');
    filter.$or = [{ productName: re }, { genericName: re }, { mfgCompany: re }, { hsnNo: re }, { category: re }];
  }
  if (query.category)   filter.category   = query.category;
  if (query.mfgCompany) filter.mfgCompany = new RegExp(query.mfgCompany, 'i');
  return filter;
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', sort = 'createdAt', order = 'desc', includeBatches, ...filters } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;
    const query    = buildProductSearchQuery(filters);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ [sort]: order === 'asc' ? 1 : -1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    let result: any[] = products;

    // Optionally attach live batch summary (total stock, nearest expiry, batch count)
    if (includeBatches === 'true' && products.length) {
      const ids = products.map(p => p._id);
      const batches = await ProductBatch.find({ productId: { $in: ids } }).lean();
      const batchMap = new Map<string, any[]>();
      for (const b of batches) {
        const key = b.productId.toString();
        if (!batchMap.has(key)) batchMap.set(key, []);
        batchMap.get(key)!.push(b);
      }
      result = products.map(p => {
        const pb = batchMap.get((p._id as any).toString()) || [];
        const totalStock = pb.reduce((s, b) => s + b.quantity, 0);
        const nearestExp = pb.length ? pb.reduce((min, b) => (new Date(b.expDate) < new Date(min)) ? b.expDate : min, pb[0].expDate) : null;
        return { ...p, totalStock, batchCount: pb.length, nearestExpiry: nearestExp };
      });
    }

    res.status(200).json({
      success: true, data: result,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404).json({ success: false, message: 'Product not found.' }); return; }
    const batches = await ProductBatch.find({ productId: product._id }).sort({ expDate: 1 }).lean();
    res.status(200).json({ success: true, data: { ...product.toObject(), batches } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created successfully.', data: product });
  } catch (e: any) {
    res.status(400).json({
      success: false, message: e.message || 'Failed to create product.',
      errors: e.errors ? Object.values(e.errors).map((x: any) => x.message) : undefined,
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found.' }); return; }
    res.status(200).json({ success: true, message: 'Product updated.', data: product });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeBatches = await ProductBatch.countDocuments({ productId: req.params.id, quantity: { $gt: 0 } });
    if (activeBatches > 0) {
      res.status(400).json({ success: false, message: `Cannot delete: ${activeBatches} batch(es) still have stock. Clear stock first.` });
      return;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) { res.status(404).json({ success: false, message: 'Product not found.' }); return; }
    res.status(200).json({ success: true, message: 'Product deactivated.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ════════════════════════════════════════════════════════════
// BATCH OPERATIONS (per product)
// ════════════════════════════════════════════════════════════

// Search batches across all products — used during billing for batch-aware product search
export const searchBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = '', limit = '10' } = req.query as Record<string, string>;
    const lim = Math.min(30, parseInt(limit));

    if (!search || search.length < 2) { res.status(200).json({ success: true, data: [] }); return; }

    const re = new RegExp(search, 'i');
    const products = await Product.find({
      isActive: true,
      $or: [{ productName: re }, { genericName: re }, { mfgCompany: re }, { hsnNo: re }],
    }).limit(20).lean();

    if (!products.length) { res.status(200).json({ success: true, data: [] }); return; }

    const productIds = products.map(p => p._id);
    const batches = await ProductBatch.find({ productId: { $in: productIds }, quantity: { $gt: 0 } })
      .sort({ expDate: 1 })
      .limit(lim)
      .lean();

    const productMap = new Map(products.map(p => [(p._id as any).toString(), p]));

    const result = batches.map(b => {
      const p = productMap.get(b.productId.toString());
      return {
        batchId:      b._id,
        productId:    b.productId,
        productName:  p?.productName,
        genericName:  p?.genericName,
        mfgCompany:   p?.mfgCompany,
        hsnNo:        p?.hsnNo,
        unit:         p?.unit,
        sch:          p?.sch,
        batchNo:      b.batchNo,
        expDate:      b.expDate,
        quantity:     b.quantity,
        mrp:          b.mrp,
        ptr:          b.ptr,
        saleRate:     b.saleRate,
        discPercent:  b.discPercent,
        cgstPercent:  b.cgstPercent,
        sgstPercent:  b.sgstPercent,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBatchesForProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const batches = await ProductBatch.find({ productId: req.params.productId }).sort({ expDate: 1 }).lean();
    res.status(200).json({ success: true, data: batches });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createOrUpdateBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { batchNo, expDate, quantity, mrp, ptr, saleRate, discPercent, cgstPercent, sgstPercent, schemeNote } = req.body;

    const product = await Product.findById(productId);
    if (!product) { res.status(404).json({ success: false, message: 'Product not found.' }); return; }

    let batch = await ProductBatch.findOne({ productId, batchNo });
    if (batch) {
      batch.set({ expDate, mrp, ptr, saleRate, discPercent, cgstPercent, sgstPercent, schemeNote });
      await batch.save();
      res.status(200).json({ success: true, message: 'Batch updated.', data: batch });
    } else {
      batch = await ProductBatch.create({ productId, batchNo, expDate, quantity: quantity || 0, mrp, ptr, saleRate, discPercent, cgstPercent, sgstPercent, schemeNote });
      res.status(201).json({ success: true, message: 'Batch created.', data: batch });
    }
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = await ProductBatch.findById(req.params.batchId);
    if (!batch) { res.status(404).json({ success: false, message: 'Batch not found.' }); return; }
    if (batch.quantity > 0) {
      res.status(400).json({ success: false, message: 'Cannot delete a batch that still has stock.' }); return;
    }
    await ProductBatch.findByIdAndDelete(req.params.batchId);
    res.status(200).json({ success: true, message: 'Batch removed.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Manual stock adjustment (Atlas production — with session) ────────
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { batchId } = req.params;
    const { quantityChange, type, reference, notes } = req.body;

    const batch = await ProductBatch.findById(batchId).session(session);
    if (!batch) { res.status(404).json({ success: false, message: 'Batch not found.' }); return; }
    const product = await Product.findById(batch.productId).session(session);

    const quantityBefore = batch.quantity;
    const isIncrease      = type === 'purchase' || type === 'purchase_return' === false && type === 'adjustment' && quantityChange > 0;
    const delta           = (type === 'purchase') ? Math.abs(quantityChange) : -Math.abs(quantityChange);
    const newQuantity     = quantityBefore + delta;

    if (newQuantity < 0) {
      res.status(400).json({ success: false, message: 'Insufficient stock.' }); return;
    }

    batch.quantity = newQuantity;
    await batch.save({ session });

    await Transaction.create([{
      productId:      batch.productId,
      productName:    product?.productName || '',
      batchNo:        batch.batchNo,
      type,
      quantityBefore,
      quantityChange: delta,
      quantityAfter:  newQuantity,
      reference,
      notes,
      createdBy:      req.user!.id,
    }], { session });

    await session.commitTransaction();
    res.status(200).json({
      success: true, message: 'Stock updated.',
      data: { batchId, quantityBefore, quantityAfter: newQuantity },
    });
  } catch (e: any) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: e.message });
  } finally {
    session.endSession();
  }
};

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now           = new Date();
    const oneMonthLater = new Date(); oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const todayStart     = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd       = new Date(now); todayEnd.setHours(23,59,59,999);

    const [totalProducts, expiringSoonBatches, allBatches, totalValueAgg] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      ProductBatch.countDocuments({ expDate: { $gte: now, $lte: oneMonthLater }, quantity: { $gt: 0 } }),
      ProductBatch.find({ quantity: { $gt: 0 } }).populate('productId', 'minStockLevel').lean(),
      ProductBatch.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$mrp', '$quantity'] } } } }]),
    ]);

    // Low stock = sum of batch quantities per product below that product's minStockLevel
    const stockByProduct = new Map<string, number>();
    for (const b of allBatches) {
      const pid = (b.productId as any)?._id?.toString() || b.productId?.toString();
      stockByProduct.set(pid, (stockByProduct.get(pid) || 0) + b.quantity);
    }
    let lowStockCount = 0;
    for (const b of allBatches) {
      const pid = (b.productId as any)?._id?.toString() || b.productId?.toString();
      const minLevel = (b.productId as any)?.minStockLevel ?? 10;
      const total = stockByProduct.get(pid) || 0;
      if (total < minLevel) { lowStockCount++; stockByProduct.delete(pid); } // count product once
    }

    const { Bill }     = await import('../models/Bill');
    const { Purchase } = await import('../models/Purchase');

    const [todaySalesAgg, todayPurchasesAgg, recentBills] = await Promise.all([
      Bill.aggregate([{ $match: { billDate: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
      Purchase.aggregate([{ $match: { invoiceDate: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
      Bill.find().sort({ createdAt: -1 }).limit(5).select('billNo billDate customerName grandTotal').lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        expiringSoon: expiringSoonBatches,
        lowStock: lowStockCount,
        totalInventoryValue: totalValueAgg[0]?.total || 0,
        todaySales:     todaySalesAgg[0]?.total || 0,
        todaySalesCount: todaySalesAgg[0]?.count || 0,
        todayPurchases:  todayPurchasesAgg[0]?.total || 0,
        todayPurchasesCount: todayPurchasesAgg[0]?.count || 0,
        recentBills,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};