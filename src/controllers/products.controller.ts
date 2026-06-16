// src/controllers/products.controller.ts
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { ApiResponse } from '../types';

const buildSearchQuery = (query: Record<string, string>) => {
  const filter: Record<string, any> = {};

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { productName: searchRegex },
      { mfgCompany: searchRegex },
      { hsnNo: searchRegex },
      { batch: searchRegex },
      { pack: searchRegex },
      { sch: searchRegex },
    ];
  }

  if (query.productName) filter.productName = new RegExp(query.productName, 'i');
  if (query.mfgCompany) filter.mfgCompany = new RegExp(query.mfgCompany, 'i');
  if (query.hsnNo) filter.hsnNo = new RegExp(query.hsnNo, 'i');
  if (query.batch) filter.batch = new RegExp(query.batch, 'i');
  if (query.pack) filter.pack = new RegExp(query.pack, 'i');
  if (query.sch) filter.sch = query.sch;

  if (query.quantityMin !== undefined || query.quantityMax !== undefined) {
    filter.quantity = {};
    if (query.quantityMin !== undefined) filter.quantity.$gte = Number(query.quantityMin);
    if (query.quantityMax !== undefined) filter.quantity.$lte = Number(query.quantityMax);
  }

  if (query.mrpMin !== undefined || query.mrpMax !== undefined) {
    filter.mrp = {};
    if (query.mrpMin !== undefined) filter.mrp.$gte = Number(query.mrpMin);
    if (query.mrpMax !== undefined) filter.mrp.$lte = Number(query.mrpMax);
  }

  if (query.expDateFrom || query.expDateTo) {
    filter.expDate = {};
    if (query.expDateFrom) filter.expDate.$gte = new Date(query.expDateFrom);
    if (query.expDateTo) filter.expDate.$lte = new Date(query.expDateTo);
  }

  // KPI filters
  if (query.expiringSoon === 'true') {
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    filter.expDate = { $gte: new Date(), $lte: oneMonthLater };
  }

  if (query.lowStock === 'true') {
    filter.quantity = { $lt: 5 };
  }

  return filter;
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'createdAt',
      order = 'desc',
      ...filters
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const sortDir = order === 'asc' ? 1 : -1;

    const query = buildSearchQuery(filters);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sort]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    const response: ApiResponse<typeof products> = {
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    const response: ApiResponse<typeof product> = {
      success: true,
      message: 'Product created successfully.',
      data: product,
    };
    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: error.message || 'Failed to create product.',
      errors: error.errors ? Object.values(error.errors).map((e: any) => e.message) : undefined,
    };
    res.status(400).json(response);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Product updated.', data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const [totalProducts, expiringSoon, lowStock, totalValue] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ expDate: { $gte: now, $lte: oneMonthLater } }),
      Product.countDocuments({ quantity: { $lt: 5 } }),
      Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$mrp', '$quantity'] } } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        expiringSoon,
        lowStock,
        totalInventoryValue: totalValue[0]?.total || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantityChange, type, reference, notes } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const quantityBefore = product.quantity;
    const newQuantity = type === 'purchase'
      ? quantityBefore + Math.abs(quantityChange)
      : quantityBefore - Math.abs(quantityChange);

    if (newQuantity < 0) {
      res.status(400).json({ success: false, message: 'Insufficient stock.' });
      return;
    }

    product.quantity = newQuantity;
    await product.save();

    // Log transaction
    const { Transaction } = await import('../models/Bill');
    await Transaction.create({
      product: product._id,
      productName: product.productName,
      batch: product.batch,
      type,
      quantityBefore,
      quantityChange: type === 'purchase' ? Math.abs(quantityChange) : -Math.abs(quantityChange),
      quantityAfter: newQuantity,
      reference,
      notes,
      createdBy: req.user!.id,
    });

    res.status(200).json({
      success: true,
      message: 'Stock updated.',
      data: { productId: id, quantityBefore, quantityAfter: newQuantity },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};