// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(v => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => e.msg),
      });
      return;
    }
    next();
  };
};

export const productValidation = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('hsnNo').trim().notEmpty().withMessage('HSN number is required'),
  body('mfgCompany').trim().notEmpty().withMessage('Manufacturing company is required'),
  body('minStockLevel').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
];

export const batchValidation = [
  body('batchNo').trim().notEmpty().withMessage('Batch number is required'),
  body('expDate').notEmpty().withMessage('Expiry date is required'),
  body('mrp').isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('ptr').isFloat({ min: 0 }).withMessage('PTR must be a positive number'),
  body('saleRate').isFloat({ min: 0 }).withMessage('Sale rate must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('discPercent').optional().isFloat({ min: 0, max: 100 }),
  body('cgstPercent').optional().isFloat({ min: 0 }),
  body('sgstPercent').optional().isFloat({ min: 0 }),
];

export const purchaseValidation = [
  body('supplierId').notEmpty().withMessage('Supplier is required'),
  body('invoiceNo').trim().notEmpty().withMessage('Invoice number is required'),
  body('invoiceDate').notEmpty().withMessage('Invoice date is required'),
  body('items').isArray({ min: 1 }).withMessage('Purchase must have at least one item'),
  body('items.*.productId').notEmpty().withMessage('Product is required for each item'),
  body('items.*.batchNo').trim().notEmpty().withMessage('Batch number is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.ptr').isFloat({ min: 0 }).withMessage('PTR is required for each item'),
];

export const billValidation = [
  body('items').isArray({ min: 1 }).withMessage('Bill must have at least one item'),
  body('items.*.productId').notEmpty().withMessage('Product ID required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const stockUpdateValidation = [
  body('quantityChange').isInt({ min: 1 }).withMessage('Quantity change must be at least 1'),
  body('type').isIn(['purchase', 'sale', 'adjustment']).withMessage('Invalid transaction type'),
];