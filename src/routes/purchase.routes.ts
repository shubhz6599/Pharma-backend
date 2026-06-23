// src/routes/purchase.routes.ts
import { Router } from 'express';
import { createPurchase, getPurchases, getPurchaseById, createPurchaseReturn } from '../controllers/purchase.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate, purchaseValidation } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.get('/',          getPurchases);
router.get('/:id',       getPurchaseById);
router.post('/',         authorize('admin', 'pharmacist'), validate(purchaseValidation), createPurchase);
router.post('/return',   authorize('admin', 'pharmacist'), createPurchaseReturn);

export default router;