// src/routes/settings.routes.ts
import { Router } from 'express';
import {
  createBackup, restoreBackup,
  getUsers, updateUserRole, deactivateUser,
  getAppInfo,
} from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('admin')); // entire settings module is admin-only

router.get('/backup',           createBackup);
router.post('/restore',         restoreBackup);
router.get('/users',            getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id',     deactivateUser);
router.get('/app-info',         getAppInfo);

export default router;