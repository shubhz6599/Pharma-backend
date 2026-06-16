// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../types';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => e.msg),
      };
      res.status(422).json(response);
      return;
    }
    next();
  };
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name too short'),
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'pharmacist', 'billing']).withMessage('Invalid role'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const productValidation = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('hsnNo').trim().notEmpty().withMessage('HSN number is required'),
  body('mfgCompany').trim().notEmpty().withMessage('Manufacturing company is required'),
  body('batch').trim().notEmpty().withMessage('Batch number is required'),
  body('expDate').isISO8601().withMessage('Valid expiry date is required'),
  body('mrp').isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('discPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0–100%'),
  body('cgstPercent').optional().isFloat({ min: 0 }).withMessage('CGST must be non-negative'),
  body('sgstPercent').optional().isFloat({ min: 0 }).withMessage('SGST must be non-negative'),
];

export const billValidation = [
  body('items').isArray({ min: 1 }).withMessage('Bill must have at least one item'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const stockUpdateValidation = [
  body('quantityChange').isInt({ min: 1 }).withMessage('Quantity change must be at least 1'),
  body('type').isIn(['purchase', 'sale', 'adjustment']).withMessage('Invalid transaction type'),
];