import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import billingRoutes from './routes/billing.routes';
import mastersRoutes from './routes/masters.routes';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT;
const MONGO = process.env.MONGODB_URI;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: { success: false, message: 'Too many requests.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth attempts.' } });

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Health
app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/masters', mastersRoutes);

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});
console.log('RUNNING FROM SRC');

const start = async () => {
  try {
    if (!MONGO) {
      throw new Error('MONGODB_URI is not defined in .env');
    }
    await mongoose.connect(MONGO);
    logger.info('✅ MongoDB connected');
    app.listen(PORT, () => logger.info(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    logger.error('❌ Failed to start:', err);
    process.exit(1);
  }
};

start();
export default app;