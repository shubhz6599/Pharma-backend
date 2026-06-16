// src/utils/seed.ts
// Run: ts-node src/utils/seed.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { User } from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma_db';

const sampleProducts = [
  { productName: 'Paracetamol 500mg', hsnNo: '3004', mfgCompany: 'Cipla Ltd', batch: 'CP2401A', pack: '10x10', sch: 'OTC', expDate: new Date('2026-06-30'), mrp: 25.50, rate: 22.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 500 },
  { productName: 'Amoxicillin 500mg', hsnNo: '3004', mfgCompany: 'Sun Pharma', batch: 'SP2402B', pack: '10x10', sch: 'H', expDate: new Date('2025-12-31'), mrp: 148.00, rate: 130.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 120 },
  { productName: 'Metformin 500mg', hsnNo: '3004', mfgCompany: 'Dr Reddys', batch: 'DR2403C', pack: '10x15', sch: 'H', expDate: new Date('2026-03-31'), mrp: 45.00, rate: 38.00, discPercent: 8, cgstPercent: 6, sgstPercent: 6, quantity: 350 },
  { productName: 'Amlodipine 5mg', hsnNo: '3004', mfgCompany: 'Lupin Ltd', batch: 'LU2404D', pack: '10x10', sch: 'H', expDate: new Date('2025-09-30'), mrp: 68.50, rate: 60.00, discPercent: 10, cgstPercent: 6, sgstPercent: 6, quantity: 3 },
  { productName: 'Cetirizine 10mg', hsnNo: '3004', mfgCompany: 'Mankind Pharma', batch: 'MK2405E', pack: '10x10', sch: 'OTC', expDate: new Date('2026-08-31'), mrp: 32.00, rate: 28.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 200 },
  { productName: 'Omeprazole 20mg', hsnNo: '3004', mfgCompany: 'Zydus Cadila', batch: 'ZC2406F', pack: '10x10', sch: 'H', expDate: new Date('2026-01-31'), mrp: 95.00, rate: 82.00, discPercent: 12, cgstPercent: 6, sgstPercent: 6, quantity: 4 },
  { productName: 'Atorvastatin 10mg', hsnNo: '3004', mfgCompany: 'Cipla Ltd', batch: 'CP2407G', pack: '10x10', sch: 'H', expDate: new Date('2026-11-30'), mrp: 112.00, rate: 98.00, discPercent: 10, cgstPercent: 6, sgstPercent: 6, quantity: 180 },
  { productName: 'Azithromycin 500mg', hsnNo: '3004', mfgCompany: 'Abbott India', batch: 'AB2408H', pack: '3', sch: 'H', expDate: new Date('2025-07-31'), mrp: 185.00, rate: 162.00, discPercent: 8, cgstPercent: 6, sgstPercent: 6, quantity: 2 },
  { productName: 'Pantoprazole 40mg', hsnNo: '3004', mfgCompany: 'Sun Pharma', batch: 'SP2409I', pack: '10x10', sch: 'H', expDate: new Date('2026-05-31'), mrp: 78.00, rate: 68.00, discPercent: 6, cgstPercent: 6, sgstPercent: 6, quantity: 275 },
  { productName: 'Vitamin D3 60000IU', hsnNo: '2936', mfgCompany: 'Merck Ltd', batch: 'ML2410J', pack: '4', sch: 'OTC', expDate: new Date('2026-09-30'), mrp: 42.00, rate: 36.00, discPercent: 5, cgstPercent: 12, sgstPercent: 12, quantity: 150 },
  { productName: 'Insulin Glargine 100IU', hsnNo: '2941', mfgCompany: 'Sanofi India', batch: 'SI2411K', pack: '3ml', sch: 'H1', expDate: new Date('2025-10-31'), mrp: 850.00, rate: 740.00, discPercent: 0, cgstPercent: 6, sgstPercent: 6, quantity: 30 },
  { productName: 'Dolo 650mg', hsnNo: '3004', mfgCompany: 'Micro Labs', batch: 'ML2412L', pack: '10x15', sch: 'OTC', expDate: new Date('2026-12-31'), mrp: 38.00, rate: 33.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 600 },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('🗑  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@pharmatrack.com',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log(`👤 Admin created: ${admin.email} / Admin@123`);

    // Create sample pharmacist
    const pharmacist = await User.create({
      name: 'Dr. Anjali Sharma',
      email: 'pharmacist@pharmatrack.com',
      password: 'Pharma@123',
      role: 'pharmacist',
    });
    console.log(`👤 Pharmacist created: ${pharmacist.email} / Pharma@123`);

    // Seed products
    const products = await Product.insertMany(sampleProducts);
    console.log(`💊 Seeded ${products.length} products`);

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login credentials:');
    console.log('  Admin:       admin@pharmatrack.com / Admin@123');
    console.log('  Pharmacist:  pharmacist@pharmatrack.com / Pharma@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();