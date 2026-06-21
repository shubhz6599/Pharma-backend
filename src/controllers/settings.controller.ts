// src/controllers/settings.controller.ts
import { Request, Response } from 'express';
import { User }       from '../models/User';
import { Product }    from '../models/Product';
import { Bill, Transaction } from '../models/Bill';
import { Supplier }   from '../models/Supplier';
import { Customer }   from '../models/Customer';
import { FirmMaster } from '../models/FirmMaster';
import { Salesman }   from '../models/Salesman';
import { Area }       from '../models/Area';
import { TaxMaster }  from '../models/TaxMaster';

// ── BACKUP: export entire DB as JSON ──────────────────────────
export const createBackup = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [products, bills, transactions, suppliers, customers, firm, salesmen, areas, taxes] = await Promise.all([
      Product.find().lean(),
      Bill.find().lean(),
      Transaction.find().lean(),
      Supplier.find().lean(),
      Customer.find().lean(),
      FirmMaster.find().lean(),
      Salesman.find().lean(),
      Area.find().lean(),
      TaxMaster.find().lean(),
    ]);

    const backup = {
      meta: { exportedAt: new Date().toISOString(), version: '1.0.0', app: 'PharmaTrack Pro' },
      data: { products, bills, transactions, suppliers, customers, firm, salesmen, areas, taxes },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pharmatrack-backup-${Date.now()}.json"`);
    res.status(200).json(backup);
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── RESTORE: import DB from uploaded JSON ─────────────────────
// WARNING: destructive — clears collections before re-inserting.
export const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = req.body;
    if (!data) { res.status(400).json({ success: false, message: 'Invalid backup file.' }); return; }

    const counts: Record<string, number> = {};

    if (Array.isArray(data.products)) {
      await Product.deleteMany({});
      if (data.products.length) await Product.insertMany(data.products);
      counts.products = data.products.length;
    }
    if (Array.isArray(data.suppliers)) {
      await Supplier.deleteMany({});
      if (data.suppliers.length) await Supplier.insertMany(data.suppliers);
      counts.suppliers = data.suppliers.length;
    }
    if (Array.isArray(data.customers)) {
      await Customer.deleteMany({});
      if (data.customers.length) await Customer.insertMany(data.customers);
      counts.customers = data.customers.length;
    }
    if (Array.isArray(data.bills)) {
      await Bill.deleteMany({});
      if (data.bills.length) await Bill.insertMany(data.bills);
      counts.bills = data.bills.length;
    }
    if (Array.isArray(data.transactions)) {
      await Transaction.deleteMany({});
      if (data.transactions.length) await Transaction.insertMany(data.transactions);
      counts.transactions = data.transactions.length;
    }
    if (Array.isArray(data.salesmen)) {
      await Salesman.deleteMany({});
      if (data.salesmen.length) await Salesman.insertMany(data.salesmen);
      counts.salesmen = data.salesmen.length;
    }
    if (Array.isArray(data.areas)) {
      await Area.deleteMany({});
      if (data.areas.length) await Area.insertMany(data.areas);
      counts.areas = data.areas.length;
    }
    if (Array.isArray(data.taxes)) {
      await TaxMaster.deleteMany({});
      if (data.taxes.length) await TaxMaster.insertMany(data.taxes);
      counts.taxes = data.taxes.length;
    }
    if (Array.isArray(data.firm) && data.firm.length) {
      await FirmMaster.deleteMany({});
      await FirmMaster.insertMany(data.firm);
      counts.firm = data.firm.length;
    }

    res.status(200).json({ success: true, message: 'Backup restored successfully.', data: counts });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message || 'Restore failed.' }); }
};

// ── USER ADMIN: list / manage app users ───────────────────────
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password -otp -otpExpiry').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: users });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['admin', 'pharmacist', 'billing'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role.' }); return;
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -otp -otpExpiry');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.status(200).json({ success: true, message: 'User role updated.', data: user });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
};

export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.id) {
      res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' }); return;
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User removed.' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ── APP VERSION INFO (Update app placeholder) ─────────────────
export const getAppInfo = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      currentVersion: '1.0.0',
      latestVersion:  '1.0.0',
      updateAvailable: false,
      releaseNotes: 'You are running the latest version of PharmaTrack Pro.',
    },
  });
};