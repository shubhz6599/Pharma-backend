// src/routes/reports.routes.ts
import { Router } from 'express';
import {
  getSalesStatement, getPurchaseReport,
  getGstReport, getStockReport, getExpiryReport, getTopProducts,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/sales-statement', getSalesStatement);
router.get('/purchase-report', getPurchaseReport);
router.get('/gst-report',      getGstReport);
router.get('/stock-report',    getStockReport);
router.get('/expiry-report',   getExpiryReport);
router.get('/top-products',    getTopProducts);

export default router;