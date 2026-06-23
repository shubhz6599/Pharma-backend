// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes     from './routes/auth.routes';
import productRoutes  from './routes/products.routes';
import billingRoutes  from './routes/billing.routes';
import purchaseRoutes from './routes/purchase.routes';
import mastersRoutes  from './routes/masters.routes';
import firmRoutes     from './routes/firm.routes';
import reportsRoutes  from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';
import { logger } from './utils/logger';


const app   = express();
const PORT  = process.env.PORT    || 5000;
const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma_db';

app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 300, message: { success: false, message: 'Too many requests.' } });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 20,  message: { success: false, message: 'Too many auth attempts.' } });
app.use('/api/', globalLimiter);
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Larger limit for backup JSON uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing',  billingRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/masters',  mastersRoutes);
app.use('/api/config',   firmRoutes);
app.use('/api/reports',  reportsRoutes);
app.use('/api/settings', settingsRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

const start = async () => {
  try {
    await mongoose.connect(MONGO);
    logger.info('✅ MongoDB connected');
    app.listen(PORT, () => logger.info(`🚀 Server at http://localhost:${PORT}`));
  } catch (err) {
    logger.error('❌ Startup failed:', err);
    process.exit(1);
  }
};
start();
export default app;