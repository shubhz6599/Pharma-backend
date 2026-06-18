// src/controllers/billing.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bill } from '../models/Bill';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';

// ── Bill number generator: CR + YYMMDD + 3-digit seq ─────────
const generateBillNo = async (): Promise<string> => {
  const now    = new Date();
  const prefix = `CR${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const count  = await Bill.countDocuments({ billNo: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

// ── Number to words (Indian) ──────────────────────────────────
const ones  = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens  = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function numToWords(n: number): string {
  const num = Math.round(n);
  if (num === 0) return 'Zero';
  if (num < 20)  return ones[num];
  if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' '+ones[num%10] : '');
  if (num < 1000) return ones[Math.floor(num/100)]+' Hundred'+(num%100 ? ' '+numToWords(num%100) : '');
  if (num < 100000) return numToWords(Math.floor(num/1000))+' Thousand'+(num%1000 ? ' '+numToWords(num%1000) : '');
  if (num < 10000000) return numToWords(Math.floor(num/100000))+' Lakh'+(num%100000 ? ' '+numToWords(num%100000) : '');
  return numToWords(Math.floor(num/10000000))+' Crore'+(num%10000000 ? ' '+numToWords(num%10000000) : '');
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let words    = numToWords(rupees) + ' Rupee' + (rupees !== 1 ? 's' : '');
  if (paise > 0) words += ' and ' + numToWords(paise) + ' Paise';
  return words.toUpperCase() + ' ONLY';
}

// ── Structure bill for print / receipt ────────────────────────
const structureBill = (bill: any) => ({
  billNo:        bill.billNo,
  billDate:      bill.billDate,
  dueDate:       bill.billDate,
  salesman:      bill.salesman || '',
  supplier: {
    name:        bill.supplierName    || '',
    address:     bill.supplierAddress || '',
    phone:       bill.supplierPhone   || '',
    dlNo:        bill.supplierDlNo    || '',
    gstNo:       bill.supplierGstNo   || '',
  },
  customer: {
    name:        bill.customerName    || 'Walk-in Customer',
    address:     bill.customerAddress || '',
    phone:       bill.customerPhone   || '',
    dlNo:        bill.customerDlNo    || '',
    gstNo:       bill.customerGstNo   || '',
    state:       bill.customerState   || 'MAHARASHTRA',
    stateCode:   bill.customerStateCode || '27',
  },
  items: (bill.items || []).map((item: any, i: number) => ({
    srNo:         i + 1,
    mfg:          item.mfgCode     || '',
    hsnNo:        item.hsnNo       || '',
    productName:  item.productName,
    pack:         item.pack        || '',
    qty:          item.quantity,
    sch:          item.sch         || '',
    batch:        item.batch,
    expDate:      item.expDate,
    mrp:          item.mrp,
    rate:         item.rate,
    disc:         item.discPercent || 0,
    taxable:      item.taxableAmount,
    cgstPct:      item.cgstPercent  || 0,
    cgstAmt:      item.cgstAmount   || 0,
    sgstPct:      item.sgstPercent  || 0,
    sgstAmt:      item.sgstAmount   || 0,
    totalAmount:  item.totalAmount,
  })),
  totals: {
    taxable:        bill.subtotal       || 0,
    totalCgst:      bill.totalCgst      || 0,
    totalSgst:      bill.totalSgst      || 0,
    totalTax:       bill.totalTax       || 0,
    grossAmount:    bill.grandTotal     || 0,
    totalDiscount:  bill.totalDiscount  || 0,
    schDisc:        0,
    cdDisc:         0,
    crNote:         0,
    netAmount:      bill.grandTotal     || 0,
    amountInWords:  amountInWords(bill.grandTotal || 0),
  },
});

// ── GENERATE BILL ─────────────────────────────────────────────
export const generateBill = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      customerId, customerName, customerPhone, customerAddress,
      customerDlNo, customerGstNo, customerState, customerStateCode,
      supplierName, supplierAddress, supplierPhone, supplierDlNo, supplierGstNo,
      salesman, items,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Bill must have at least one item.' });
      return;
    }

    // Resolve customer from master if ID provided
    let resolvedCustomerName    = customerName;
    let resolvedCustomerPhone   = customerPhone;
    let resolvedCustomerAddress = customerAddress;
    if (customerId) {
      const cust = await Customer.findById(customerId).session(session);
      if (cust) {
        resolvedCustomerName    = cust.name;
        resolvedCustomerPhone   = cust.phone;
        resolvedCustomerAddress = cust.fullAddress;
      }
    }

    let subtotal = 0, totalDiscount = 0, totalCgst = 0, totalSgst = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (product.quantity < item.quantity) throw new Error(`Insufficient stock for "${product.productName}". Available: ${product.quantity}`);

      const discPct    = item.discPercent !== undefined ? item.discPercent : product.discPercent;
      const raw        = product.rate * item.quantity;
      const discAmt    = raw * (discPct / 100);
      const taxable    = parseFloat((raw - discAmt).toFixed(2));
      const cgstAmt    = parseFloat(((taxable * product.cgstPercent) / 100).toFixed(2));
      const sgstAmt    = parseFloat(((taxable * product.sgstPercent) / 100).toFixed(2));
      const totalAmt   = parseFloat((taxable + cgstAmt + sgstAmt).toFixed(2));

      subtotal      += raw;
      totalDiscount += discAmt;
      totalCgst     += cgstAmt;
      totalSgst     += sgstAmt;

      product.quantity -= item.quantity;
      await product.save({ session });

      processedItems.push({
        product:      product._id,
        productName:  product.productName,
        hsnNo:        product.hsnNo,
        mfgCode:      product.mfgCompany?.substring(0,2).toUpperCase(),
        pack:         product.pack,
        sch:          product.sch,
        batch:        product.batch,
        expDate:      product.expDate,
        mrp:          product.mrp,
        rate:         product.rate,
        quantity:     item.quantity,
        discPercent:  discPct,
        taxableAmount: taxable,
        cgstPercent:  product.cgstPercent,
        cgstAmount:   cgstAmt,
        sgstPercent:  product.sgstPercent,
        sgstAmount:   sgstAmt,
        totalAmount:  totalAmt,
      });
    }

    const grandTotal = parseFloat((subtotal - totalDiscount + totalCgst + totalSgst).toFixed(2));
    const billNo     = await generateBillNo();

    const [bill] = await Bill.create([{
      billNo,
      billDate: new Date(),
      salesman,
      customerId:          customerId || undefined,
      customerName:        resolvedCustomerName,
      customerPhone:       resolvedCustomerPhone,
      customerAddress:     resolvedCustomerAddress,
      customerDlNo, customerGstNo, customerState, customerStateCode,
      supplierName, supplierAddress, supplierPhone, supplierDlNo, supplierGstNo,
      items:         processedItems,
      subtotal:      parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalCgst:     parseFloat(totalCgst.toFixed(2)),
      totalSgst:     parseFloat(totalSgst.toFixed(2)),
      totalTax:      parseFloat((totalCgst + totalSgst).toFixed(2)),
      grandTotal,
      createdBy:     req.user!.id,
    }], { session });

    // Update customer stats
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalBills: 1, totalSpend: grandTotal },
      }).session(session);
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Bill generated.', data: structureBill(bill) });
  } catch (err: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

export const getBills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page='1', limit='20', billNo, dateFrom, dateTo } = req.query as Record<string,string>;
    const pg  = Math.max(1, parseInt(page));
    const lim = Math.min(100, parseInt(limit));
    const filter: Record<string,any> = {};
    if (billNo)   filter.billNo   = new RegExp(billNo, 'i');
    if (dateFrom || dateTo) {
      filter.billDate = {};
      if (dateFrom) filter.billDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.billDate.$lte = new Date(dateTo);
    }
    const [bills, total] = await Promise.all([
      Bill.find(filter).sort({ createdAt: -1 }).skip((pg-1)*lim).limit(lim).populate('createdBy','name').lean(),
      Bill.countDocuments(filter),
    ]);
    res.status(200).json({ success:true, data: bills, pagination:{ page:pg, limit:lim, total, totalPages: Math.ceil(total/lim) } });
  } catch (err: any) { res.status(500).json({ success:false, message: err.message }); }
};

export const getBillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id).populate('createdBy','name');
    if (!bill) { res.status(404).json({ success:false, message:'Bill not found.' }); return; }
    res.status(200).json({ success:true, data: structureBill(bill) });
  } catch (err: any) { res.status(500).json({ success:false, message: err.message }); }
};

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { Transaction } = await import('../models/Bill');
    const { page='1', limit='100', productId, type } = req.query as Record<string,string>;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(500, parseInt(limit));
    const filter: Record<string,any> = {};
    if (productId) filter.product = productId;
    if (type)      filter.type    = type;
    const [txs, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt:-1 }).skip((pg-1)*lim).limit(lim).populate('createdBy','name').lean(),
      Transaction.countDocuments(filter),
    ]);
    res.status(200).json({ success:true, data:txs, pagination:{ page:pg, limit:lim, total, totalPages:Math.ceil(total/lim) } });
  } catch (err: any) { res.status(500).json({ success:false, message: err.message }); }
};