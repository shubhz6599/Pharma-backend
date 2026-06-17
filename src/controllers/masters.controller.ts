import { Request, Response } from 'express';
import { Supplier } from '../models/Supplier';
import { Customer } from '../models/Customer';

// ── SUPPLIER CRUD ─────────────────────────────────────────────

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20', isActive } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    else filter.isActive = true; // default: only active
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { contactPerson: re }, { phone: re }, { gstNo: re }];
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      Supplier.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) { res.status(404).json({ success: false, message: 'Supplier not found.' }); return; }
    res.status(200).json({ success: true, data: supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, message: 'Supplier created successfully.', data: supplier });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, errors: err.errors ? Object.values(err.errors).map((e: any) => e.message) : undefined });
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) { res.status(404).json({ success: false, message: 'Supplier not found.' }); return; }
    res.status(200).json({ success: true, message: 'Supplier updated.', data: supplier });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!supplier) { res.status(404).json({ success: false, message: 'Supplier not found.' }); return; }
    res.status(200).json({ success: true, message: 'Supplier deactivated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CUSTOMER CRUD ─────────────────────────────────────────────

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20', isActive } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    else filter.isActive = true;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { phone: re }, { email: re }];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      Customer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found.' }); return; }
    res.status(200).json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, message: 'Customer created successfully.', data: customer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found.' }); return; }
    res.status(200).json({ success: true, message: 'Customer updated.', data: customer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found.' }); return; }
    res.status(200).json({ success: true, message: 'Customer deactivated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};