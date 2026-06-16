// src/routes/products.routes.ts
import { Router } from 'express';
import {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getDashboardStats, updateStock,
} from '../controllers/products.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate, productValidation, stockUpdateValidation } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.get('/stats/dashboard', getDashboardStats);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('admin', 'pharmacist'), validate(productValidation), createProduct);
router.put('/:id', authorize('admin', 'pharmacist'), validate(productValidation), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);
router.patch('/:id/stock', authorize('admin', 'pharmacist'), validate(stockUpdateValidation), updateStock);

export default router;