// src/routes/reports.routes.ts
import { Router } from 'express';
import { getSalesStatement, getTopProducts } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/sales-statement', getSalesStatement);
router.get('/top-products',    getTopProducts);

export default router;