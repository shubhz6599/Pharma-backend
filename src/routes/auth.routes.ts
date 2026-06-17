import { Router } from 'express';
import {
  register, verifyOtp, resendOtp, login,
  forgotPassword, verifyResetOtp, resetPassword,
  logout, getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { body } from 'express-validator';

const router = Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }),
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'pharmacist', 'billing']),
];

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Email, username or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotRules = [
  body('identifier').trim().notEmpty().withMessage('Email, username or phone is required'),
];

const resetRules = [
  body('userId').notEmpty(),
  body('resetToken').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

router.post('/register',            validate(registerRules),   register);
router.post('/verify-otp',          verifyOtp);
router.post('/resend-otp',          resendOtp);
router.post('/login',               validate(loginRules),      login);
router.post('/forgot-password',     validate(forgotRules),     forgotPassword);
router.post('/verify-reset-otp',    verifyResetOtp);
router.post('/reset-password',      validate(resetRules),      resetPassword);
router.post('/logout',              authenticate,              logout);
router.get('/me',                   authenticate,              getMe);

export default router;

