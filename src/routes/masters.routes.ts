// src/routes/masters.routes.ts
import { Router } from 'express';
import {
  getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier,
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
} from '../controllers/masters.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Supplier routes
router.get('/suppliers',           getSuppliers);
router.get('/suppliers/:id',       getSupplierById);
router.post('/suppliers',          authorize('admin', 'pharmacist'), createSupplier);
router.put('/suppliers/:id',       authorize('admin', 'pharmacist'), updateSupplier);
router.delete('/suppliers/:id',    authorize('admin'),               deleteSupplier);

// Customer routes
router.get('/customers',           getCustomers);
router.get('/customers/:id',       getCustomerById);
router.post('/customers',          authorize('admin', 'pharmacist', 'billing'), createCustomer);
router.put('/customers/:id',       authorize('admin', 'pharmacist', 'billing'), updateCustomer);
router.delete('/customers/:id',    authorize('admin'),               deleteCustomer);

export default router;