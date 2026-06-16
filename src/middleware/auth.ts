// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Access denied. No token provided.',
      };
      res.status(401).json(response);
      return;
    }

    const secret = process.env.JWT_SECRET || 'pharma_secret_key_change_in_prod';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      message: 'Invalid or expired token.',
    };
    res.status(401).json(response);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions.',
      };
      res.status(403).json(response);
      return;
    }
    next();
  };
};