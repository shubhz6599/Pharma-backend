// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User';
import { ApiResponse } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'pharma_secret_key_change_in_prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const generateToken = (id: string, email: string, role: string): string => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const response: ApiResponse<null> = { success: false, message: 'Email already registered.' };
      res.status(409).json(response);
      return;
    }

    const user = await User.create({ name, email, password, role: role || 'pharmacist' });
    const token = generateToken(user._id.toString(), user.email, user.role);

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const response: ApiResponse<{ token: string; user: object }> = {
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    };
    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: error.message || 'Registration failed.',
    };
    res.status(500).json(response);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Invalid email or password.',
      };
      res.status(401).json(response);
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const response: ApiResponse<{ token: string; user: object }> = {
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: error.message || 'Login failed.',
    };
    res.status(500).json(response);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
  const response: ApiResponse<null> = { success: true, message: 'Logged out successfully.' };
  res.status(200).json(response);
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      const response: ApiResponse<null> = { success: false, message: 'User not found.' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<object> = {
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = { success: false, message: error.message };
    res.status(500).json(response);
  }
};