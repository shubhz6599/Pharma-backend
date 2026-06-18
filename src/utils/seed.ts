// src/utils/seed.ts  —  Run: npx ts-node src/utils/seed.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product }  from '../models/Product';
import { User }     from '../models/User';
import { Supplier } from '../models/Supplier';
import { Customer } from '../models/Customer';

dotenv.config();

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma_db';

async function seed() {
  try {
    await mongoose.connect(MONGO);
    console.log('✅ MongoDB connected');

    // Clear all
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // ── Users ─────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User', username: 'admin',
      email: 'admin@pharmatrack.com', phone: '9000000001',
      password: 'Admin@123', role: 'admin', isVerified: true,
    });
    await User.create({
      name: 'Dr. Anjali Sharma', username: 'anjali_pharma',
      email: 'pharmacist@pharmatrack.com', phone: '9000000002',
      password: 'Pharma@123', role: 'pharmacist', isVerified: true,
    });
    await User.create({
      name: 'Billing Staff', username: 'billing_staff',
      email: 'billing@pharmatrack.com', phone: '9000000003',
      password: 'Billing@123', role: 'billing', isVerified: true,
    });
    console.log('👤 Users created (3)');

    // ── Suppliers ──────────────────────────────────────────────
    const [sup1, sup2] = await Supplier.insertMany([
      {
        name: 'Rahul Agencies', contactPerson: 'Rahul Shah',
        phone: '9325681800', alternatePhone: '0241-2345678',
        email: 'rahul@rahulагентства.com',
        gstNo: '27ALLPG3700B1Z8', drugLicenseNo: '208-362455, 21B-362456',
        address: { line1: "'Ashirwad' Near T.V. Center & Krupal Ashram", line2: 'Miskin Nagar', city: 'Ahilyanagar', state: 'Maharashtra', pincode: '414001' },
        isActive: true, createdBy: admin._id,
      },
      {
        name: 'Sun Pharma Distributors', contactPerson: 'Priya Mehta',
        phone: '9876543210',
        gstNo: '27AABCS1429B1Z0', drugLicenseNo: '108-452300',
        address: { line1: 'Plot 45, MIDC Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411028' },
        isActive: true, createdBy: admin._id,
      },
    ]);
    console.log('🏭 Suppliers created (2)');

    // ── Products with supplier link ────────────────────────────
    await Product.insertMany([
      { productName: 'Paracetamol 500mg', hsnNo: '3004', mfgCompany: 'Cipla Ltd', supplierId: sup1._id, supplierName: sup1.name, supplierAddress: "'Ashirwad' Near T.V. Center, Ahilyanagar - 414001", batch: 'CP2401A', pack: '10x10', sch: 'OTC', expDate: new Date('2027-06-30'), mrp: 25.50, rate: 22.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 500 },
      { productName: 'Amoxicillin 500mg', hsnNo: '3004', mfgCompany: 'Sun Pharma', supplierId: sup2._id, supplierName: sup2.name, supplierAddress: 'Plot 45, MIDC, Pune - 411028', batch: 'SP2402B', pack: '10x10', sch: 'H', expDate: new Date('2026-12-31'), mrp: 148.00, rate: 130.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 120 },
      { productName: 'Metformin 500mg', hsnNo: '3004', mfgCompany: 'Dr Reddys', supplierId: sup1._id, supplierName: sup1.name, supplierAddress: "'Ashirwad' Near T.V. Center, Ahilyanagar - 414001", batch: 'DR2403C', pack: '10x15', sch: 'H', expDate: new Date('2027-03-31'), mrp: 45.00, rate: 38.00, discPercent: 8, cgstPercent: 6, sgstPercent: 6, quantity: 350 },
      { productName: 'Amlodipine 5mg', hsnNo: '3004', mfgCompany: 'Lupin Ltd', supplierId: sup1._id, supplierName: sup1.name, batch: 'LU2404D', pack: '10x10', sch: 'H', expDate: new Date('2025-09-30'), mrp: 68.50, rate: 60.00, discPercent: 10, cgstPercent: 6, sgstPercent: 6, quantity: 3 },
      { productName: 'Cetirizine 10mg', hsnNo: '3004', mfgCompany: 'Mankind Pharma', supplierId: sup2._id, supplierName: sup2.name, batch: 'MK2405E', pack: '10x10', sch: 'OTC', expDate: new Date('2027-08-31'), mrp: 32.00, rate: 28.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 200 },
      { productName: 'Omeprazole 20mg', hsnNo: '3004', mfgCompany: 'Zydus Cadila', supplierId: sup1._id, supplierName: sup1.name, batch: 'ZC2406F', pack: '10x10', sch: 'H', expDate: new Date('2026-01-31'), mrp: 95.00, rate: 82.00, discPercent: 12, cgstPercent: 6, sgstPercent: 6, quantity: 4 },
      { productName: 'Atorvastatin 10mg', hsnNo: '3004', mfgCompany: 'Cipla Ltd', supplierId: sup2._id, supplierName: sup2.name, batch: 'CP2407G', pack: '10x10', sch: 'H', expDate: new Date('2027-11-30'), mrp: 112.00, rate: 98.00, discPercent: 10, cgstPercent: 6, sgstPercent: 6, quantity: 180 },
      { productName: 'Dolo 650mg', hsnNo: '3004', mfgCompany: 'Micro Labs', supplierId: sup1._id, supplierName: sup1.name, batch: 'ML2412L', pack: '10x15', sch: 'OTC', expDate: new Date('2027-12-31'), mrp: 38.00, rate: 33.00, discPercent: 5, cgstPercent: 6, sgstPercent: 6, quantity: 600 },
      { productName: 'Pantoprazole 40mg', hsnNo: '3004', mfgCompany: 'Sun Pharma', supplierId: sup2._id, supplierName: sup2.name, batch: 'SP2409I', pack: '10x10', sch: 'H', expDate: new Date('2027-05-31'), mrp: 78.00, rate: 68.00, discPercent: 6, cgstPercent: 6, sgstPercent: 6, quantity: 275 },
      { productName: 'Vitamin D3 60000IU', hsnNo: '2936', mfgCompany: 'Merck Ltd', supplierId: sup1._id, supplierName: sup1.name, batch: 'ML2410J', pack: '4 Caps', sch: 'OTC', expDate: new Date('2027-09-30'), mrp: 42.00, rate: 36.00, discPercent: 5, cgstPercent: 12, sgstPercent: 12, quantity: 150 },
      { productName: 'Azithromycin 500mg', hsnNo: '3004', mfgCompany: 'Abbott India', supplierId: sup2._id, supplierName: sup2.name, batch: 'AB2408H', pack: '3 Tabs', sch: 'H', expDate: new Date('2026-07-31'), mrp: 185.00, rate: 162.00, discPercent: 8, cgstPercent: 6, sgstPercent: 6, quantity: 2 },
      { productName: 'Insulin Glargine 100IU', hsnNo: '2941', mfgCompany: 'Sanofi India', supplierId: sup2._id, supplierName: sup2.name, batch: 'SI2411K', pack: '3ml Pen', sch: 'H1', expDate: new Date('2026-10-31'), mrp: 850.00, rate: 740.00, discPercent: 0, cgstPercent: 6, sgstPercent: 6, quantity: 30 },
    ]);
    console.log('💊 Products seeded (12)');

    // ── Customers ──────────────────────────────────────────────
    await Customer.insertMany([
      { name: 'Dr. Shirish Joshi', phone: '9876000001', doctorName: 'Self', address: { line1: 'Behind Central Bank, Saint Vaman Bhau Nagar', city: 'Pathardi', state: 'Maharashtra', pincode: '414102' }, createdBy: admin._id },
      { name: 'Ramesh Patil', phone: '9876000002', age: 55, gender: 'male', doctorName: 'Dr. A. Kulkarni', address: { city: 'Ahilyanagar', state: 'Maharashtra' }, createdBy: admin._id },
      { name: 'Sunita Desai', phone: '9876000003', age: 42, gender: 'female', address: { city: 'Pune', state: 'Maharashtra' }, createdBy: admin._id },
    ]);
    console.log('👥 Customers seeded (3)');

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login credentials:');
    console.log('  Admin:       admin@pharmatrack.com  /  Admin@123');
    console.log('  Pharmacist:  pharmacist@pharmatrack.com  /  Pharma@123');
    console.log('  Billing:     billing@pharmatrack.com  /  Billing@123');
    console.log('  (username login also works: admin / anjali_pharma / billing_staff)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();