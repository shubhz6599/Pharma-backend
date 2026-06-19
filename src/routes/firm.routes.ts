// src/routes/firm.routes.ts
import { Router } from 'express';
import {
  getFirm, saveFirm,
  getSalesmen, createSalesman, updateSalesman, deleteSalesman,
  getAreas, createArea, updateArea, deleteArea,
  getTaxes, createTax, updateTax, deleteTax,
} from '../controllers/firm.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Firm master (admin only)
router.get('/firm',      getFirm);
router.post('/firm',     authorize('admin'), saveFirm);

// Salesman
router.get('/salesmen',           getSalesmen);
router.post('/salesmen',          authorize('admin','pharmacist'), createSalesman);
router.put('/salesmen/:id',       authorize('admin','pharmacist'), updateSalesman);
router.delete('/salesmen/:id',    authorize('admin'), deleteSalesman);

// Area
router.get('/areas',              getAreas);
router.post('/areas',             authorize('admin','pharmacist'), createArea);
router.put('/areas/:id',          authorize('admin','pharmacist'), updateArea);
router.delete('/areas/:id',       authorize('admin'), deleteArea);

// Tax Master
router.get('/taxes',              getTaxes);
router.post('/taxes',             authorize('admin'), createTax);
router.put('/taxes/:id',          authorize('admin'), updateTax);
router.delete('/taxes/:id',       authorize('admin'), deleteTax);

export default router;