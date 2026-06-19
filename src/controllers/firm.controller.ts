// src/controllers/firm.controller.ts
import { Request, Response } from 'express';
import { FirmMaster } from '../models/FirmMaster';
import { Salesman }   from '../models/Salesman';
import { Area }       from '../models/Area';
import { TaxMaster }  from '../models/TaxMaster';

// ── FIRM MASTER (singleton) ───────────────────────────────────
export const getFirm = async (_req: Request, res: Response): Promise<void> => {
  try {
    const firm = await FirmMaster.findOne();
    res.status(200).json({ success: true, data: firm || null });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const saveFirm = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await FirmMaster.findOne();
    let firm;
    if (existing) {
      firm = await FirmMaster.findByIdAndUpdate(existing._id, req.body, { new: true, runValidators: true });
    } else {
      firm = await FirmMaster.create(req.body);
    }
    res.status(200).json({ success: true, message: 'Firm details saved.', data: firm });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

// ── SALESMAN CRUD ─────────────────────────────────────────────
export const getSalesmen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page)), lim = Math.min(200, parseInt(limit));
    const filter: any = { isActive: true };
    if (search) filter.name = new RegExp(search, 'i');
    const [data, total] = await Promise.all([
      Salesman.find(filter).sort({ name: 1 }).skip((pg-1)*lim).limit(lim).lean(),
      Salesman.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data, pagination: { page: pg, limit: lim, total, totalPages: Math.ceil(total/lim) } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createSalesman = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Salesman.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, message: 'Salesman added.', data: doc });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const updateSalesman = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Salesman.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) { res.status(404).json({ success: false, message: 'Salesman not found.' }); return; }
    res.status(200).json({ success: true, message: 'Salesman updated.', data: doc });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const deleteSalesman = async (req: Request, res: Response): Promise<void> => {
  try {
    await Salesman.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Salesman deactivated.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── AREA CRUD ─────────────────────────────────────────────────
export const getAreas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query as Record<string, string>;
    const filter: any = { isActive: true };
    if (search) filter.name = new RegExp(search, 'i');
    const data = await Area.find(filter).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Area.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, message: 'Area added.', data: doc });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const updateArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) { res.status(404).json({ success: false, message: 'Area not found.' }); return; }
    res.status(200).json({ success: true, message: 'Area updated.', data: doc });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const deleteArea = async (req: Request, res: Response): Promise<void> => {
  try {
    await Area.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Area removed.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── TAX MASTER CRUD ───────────────────────────────────────────
export const getTaxes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await TaxMaster.find({ isActive: true }).sort({ totalPercent: 1 }).lean();
    res.status(200).json({ success: true, data });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const createTax = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await TaxMaster.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, message: 'Tax rate added.', data: doc });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const updateTax = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await TaxMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) { res.status(404).json({ success: false, message: 'Tax not found.' }); return; }
    res.status(200).json({ success: true, message: 'Tax updated.', data: doc });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const deleteTax = async (req: Request, res: Response): Promise<void> => {
  try {
    await TaxMaster.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Tax rate deactivated.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};