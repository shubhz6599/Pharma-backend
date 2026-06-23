// src/routes/billing.routes.ts
import { Router } from 'express';
import { generateBill, getBills, getBillById, getTransactions, createSaleReturn } from '../controllers/billing.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate, billValidation } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.get('/', getBills);
router.get('/transactions', getTransactions);
router.get('/:id', getBillById);
router.post('/generate', authorize('admin', 'pharmacist', 'billing'), validate(billValidation), generateBill);
router.post('/return', authorize('admin', 'pharmacist', 'billing'), createSaleReturn);

export default router;