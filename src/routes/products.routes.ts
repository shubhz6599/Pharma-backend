// src/routes/products.routes.ts
import { Router } from 'express';
import {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getDashboardStats,
  searchBatches, getBatchesForProduct, createOrUpdateBatch, deleteBatch, updateStock,
} from '../controllers/products.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate, productValidation, batchValidation, stockUpdateValidation } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// Dashboard
router.get('/stats/dashboard', getDashboardStats);

// Batch search (used by Billing's batch-aware product search) — must come before /:id
router.get('/batches/search', searchBatches);

// Product Master CRUD
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('admin', 'pharmacist'), validate(productValidation), createProduct);
router.put('/:id', authorize('admin', 'pharmacist'), validate(productValidation), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

// Batch operations (per product)
router.get('/:productId/batches', getBatchesForProduct);
router.post('/:productId/batches', authorize('admin', 'pharmacist'), validate(batchValidation), createOrUpdateBatch);
router.delete('/batches/:batchId', authorize('admin', 'pharmacist'), deleteBatch);
router.patch('/batches/:batchId/stock', authorize('admin', 'pharmacist'), validate(stockUpdateValidation), updateStock);

export default router;


