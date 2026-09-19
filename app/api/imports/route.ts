import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import type { ImportType } from '@prisma/client';

const clean = (v: unknown) => String(v ?? '').trim();
const keyNorm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
const value = (row: Record<string, any>, aliases: string[]) => {
  for (const alias of aliases) {
    const found = Object.keys(row).find((k) => keyNorm(k) === keyNorm(alias));
    if (found && row[found] !== undefined && row[found] !== null && clean(row[found]) !== '') return row[found];
  }
  return null;
};

const aliases = {
  date: ['Tanggal', 'Date', 'Transaction Date', 'Tgl'],
  itemCode: ['Kode Barang', 'Kode', 'Item No', 'No Barang', 'Item Code', 'Kode Item'],
  itemName: ['Nama Barang', 'Nama', 'Item Name', 'Description', 'Nama Item'],
  unit: ['Satuan', 'Unit', 'UOM'],
  category: ['Kategori', 'Category', 'Item Category'],
  hsCode: ['HS Code', 'HSCode', 'HS'],
  customsUnit: ['Satuan Kepabeanan', 'Customs Unit'],
  country: ['Negara Asal', 'Country of Origin', 'Origin'],
  qty: ['Qty', 'Kuantitas', 'Quantity', 'Jumlah'],
  qtyIn: ['Qty Masuk', 'Masuk', 'In Qty', 'Quantity In', 'Debit Qty'],
  qtyOut: ['Qty Keluar', 'Keluar', 'Out Qty', 'Quantity Out', 'Credit Qty'],
  warehouse: ['Gudang', 'Warehouse', 'Kode Gudang', 'Warehouse Code'],
  warehouseFrom: ['Gudang Asal', 'From Warehouse', 'Warehouse From'],
  warehouseTo: ['Gudang Tujuan', 'To Warehouse', 'Warehouse To'],
  reference: ['No Referensi', 'Reference', 'Reference No', 'No Bukti', 'Nomor Bukti'],
  invoice: ['No Faktur', 'Nomor Faktur', 'Invoice No', 'Invoice'],
  receipt: ['No Penerimaan', 'Receipt No', 'Receive No'],
  delivery: ['No Pengiriman', 'Delivery No', 'Shipment No'],
  supplier: ['Supplier', 'Pemasok', 'Vendor'],
  customer: ['Customer', 'Pelanggan'],
  customsDocNo: ['No Dokumen Bea', 'Dokumen Bea', 'Customs Doc', 'Customs Document No'],
  customsDocType: ['Jenis Dokumen Bea', 'Customs Doc Type', 'Jenis Dokumen'],
  customsDocDate: ['Tanggal Dokumen Bea', 'Customs Doc Date'],
  type: ['Jenis', 'Type', 'Tipe Transaksi', 'Transaction Type'],
  reason: ['Alasan', 'Reason', 'Adjustment Reason'],
  notes: ['Catatan', 'Notes', 'Keterangan'],
  systemQty: ['Stok Sistem', 'System Qty', 'Book Qty'],
  physicalQty: ['Stok Fisik', 'Physical Qty', 'Actual Qty'],
  workOrder: ['No WO', 'WO', 'Work Order', 'Production No'],
  lotNo: ['Lot No', 'Batch No', 'Nomor Lot', 'Nomor Batch'],
};

function parseDate(raw: any): Date | null {
  if (!raw && raw !== 0) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  if (typeof raw === 'number') {
    const p = XLSX.SSF.parse_date_code(raw);
    if (p) return new Date(Date.UTC(p.y, p.m - 1, p.d, p.H || 0, p.M || 0, Math.floor(p.S || 0)));
  }
  const text = clean(raw);
  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime())) return iso;
  const m = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}

function num(raw: any): number {
  if (typeof raw === 'number') return raw;
  const s = clean(raw).replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function sha(parts: any[]) {
  return crypto.createHash('sha1').update(parts.map((x) => clean(x)).join('|')).digest('hex');
}

async function ensureItem(companyId: string, row: Record<string, any>) {
  const code = clean(value(row, aliases.itemCode));
  if (!code) throw new Error('Kode Barang wajib');
  return prisma.item.upsert({
    where: { companyId_code: { companyId, code } },
    update: {
      name: clean(value(row, aliases.itemName)) || undefined,
      hsCode: clean(value(row, aliases.hsCode)) || undefined,
      unit: clean(value(row, aliases.unit)) || undefined,
      category: clean(value(row, aliases.category)) || undefined,
      customsUnit: clean(value(row, aliases.customsUnit)) || undefined,
      countryOfOrigin: clean(value(row, aliases.country)) || undefined,
    },
    create: {
      companyId,
      code,
      name: clean(value(row, aliases.itemName)) || code,
      hsCode: clean(value(row, aliases.hsCode)) || null,
      unit: clean(value(row, aliases.unit)) || 'PCS',
      category: clean(value(row, aliases.category)) || null,
      customsUnit: clean(value(row, aliases.customsUnit)) || null,
      countryOfOrigin: clean(value(row, aliases.country)) || null,
    },
  });
}

async function ensureWarehouse(companyId: string, codeRaw: any) {
  const code = clean(codeRaw) || 'MAIN';
  return prisma.warehouse.upsert({
    where: { companyId_code: { companyId, code } },
    update: {},
    create: { companyId, code, name: code === 'MAIN' ? 'Gudang Utama' : code },
  });
}

function baseData(row: Record<string, any>) {
  return {
    referenceNo: clean(value(row, aliases.reference)) || clean(value(row, aliases.receipt)) || clean(value(row, aliases.delivery)) || null,
    invoiceNo: clean(value(row, aliases.invoice)) || null,
    customsDocNo: clean(value(row, aliases.customsDocNo)) || null,
    customsDocType: clean(value(row, aliases.customsDocType)) || null,
    customsDocDate: parseDate(value(row, aliases.customsDocDate)),
    lotNo: clean(value(row, aliases.lotNo)) || null,
    notes: clean(value(row, aliases.notes)) || clean(value(row, aliases.reason)) || null,
  };
}

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (u.role === 'CUSTOMS' || u.role === 'AUDITOR') return Response.json({ error: 'read_only' }, { status: 403 });

  const fd = await req.formData();
  const f = fd.get('file') as File;
  const importType = clean(fd.get('importType')) as ImportType;
  const allowed: ImportType[] = ['MASTER_ITEM','INVENTORY_MOVEMENT','PURCHASE_RECEIPT','SALES_DELIVERY','WAREHOUSE_TRANSFER','ADJUSTMENT','STOCK_OPNAME','PRODUCTION'];
  if (!f) return Response.json({ error: 'File wajib diisi' }, { status: 400 });
  if (!allowed.includes(importType)) return Response.json({ error: 'Jenis import tidak valid' }, { status: 400 });

  const wb = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true }) as Record<string, any>[];
  let imported = 0, skipped = 0, errors = 0;
  const detail: any[] = [];

  for (const [idx, row] of rows.entries()) {
    const excelRow = idx + 2;
    try {
      if (importType === 'MASTER_ITEM') {
        await ensureItem(u.companyId, row);
        imported++;
        continue;
      }

      const dt = parseDate(value(row, aliases.date));
      if (!dt) throw new Error('Tanggal tidak valid');
      const item = await ensureItem(u.companyId, row);
      const code = item.code;
      const base = baseData(row);

      if (importType === 'STOCK_OPNAME') {
        const wh = await ensureWarehouse(u.companyId, value(row, aliases.warehouse));
        const systemQty = num(value(row, aliases.systemQty));
        const physicalQty = num(value(row, aliases.physicalQty));
        const ref = base.referenceNo || '';
        const sourceKey = sha(['STOCK_OPNAME', dt.toISOString().slice(0,10), code, wh.code, systemQty, physicalQty, ref]);
        if (await prisma.stockOpname.findFirst({ where: { companyId: u.companyId, sourceKey } })) { skipped++; continue; }
        await prisma.stockOpname.create({ data: {
          companyId: u.companyId, itemId: item.id, warehouseId: wh.id, opnameAt: dt,
          systemQty, physicalQty, differenceQty: physicalQty - systemQty,
          referenceNo: base.referenceNo, notes: base.notes, source: 'ACCURATE_IMPORT', sourceKey,
        }});
        imported++;
        continue;
      }

      if (importType === 'WAREHOUSE_TRANSFER') {
        const qty = Math.abs(num(value(row, aliases.qty)));
        if (!qty) throw new Error('Qty wajib dan tidak boleh 0');
        const from = await ensureWarehouse(u.companyId, value(row, aliases.warehouseFrom));
        const to = await ensureWarehouse(u.companyId, value(row, aliases.warehouseTo));
        if (from.id === to.id) throw new Error('Gudang asal dan tujuan tidak boleh sama');
        const group = sha(['TRANSFER', dt.toISOString(), code, from.code, to.code, qty, base.referenceNo || '']);
        const existing = await prisma.transaction.findFirst({ where: { companyId: u.companyId, transferGroupId: group } });
        if (existing) { skipped++; continue; }
        await prisma.$transaction([
          prisma.transaction.create({ data: { companyId:u.companyId,itemId:item.id,warehouseId:from.id,type:'OUTBOUND',qty,transactionAt:dt,source:'ACCURATE_TRANSFER',sourceKey:sha([group,'OUT']),transferGroupId:group,createdById:u.id,...base,notes:base.notes || `Transfer ke ${to.code}` }}),
          prisma.transaction.create({ data: { companyId:u.companyId,itemId:item.id,warehouseId:to.id,type:'INBOUND',qty,transactionAt:dt,source:'ACCURATE_TRANSFER',sourceKey:sha([group,'IN']),transferGroupId:group,createdById:u.id,...base,notes:base.notes || `Transfer dari ${from.code}` }}),
        ]);
        imported++;
        continue;
      }

      const wh = await ensureWarehouse(u.companyId, value(row, aliases.warehouse));
      let txType: 'INBOUND'|'OUTBOUND'|'ADJUSTMENT'|'PRODUCTION' = 'ADJUSTMENT';
      let qty = num(value(row, aliases.qty));
      let partnerName: string | null = null;
      let source = 'ACCURATE_IMPORT';

      if (importType === 'PURCHASE_RECEIPT') {
        txType = 'INBOUND'; qty = Math.abs(qty); partnerName = clean(value(row, aliases.supplier)) || null; source = 'ACCURATE_PURCHASE';
      } else if (importType === 'SALES_DELIVERY') {
        txType = 'OUTBOUND'; qty = Math.abs(qty); partnerName = clean(value(row, aliases.customer)) || null; source = 'ACCURATE_SALES';
      } else if (importType === 'ADJUSTMENT') {
        txType = 'ADJUSTMENT'; source = 'ACCURATE_ADJUSTMENT';
      } else if (importType === 'PRODUCTION') {
        const kind = clean(value(row, aliases.type)).toUpperCase();
        if (kind.includes('HASIL') || kind.includes('OUTPUT') || kind.includes('FINISHED')) txType = 'INBOUND';
        else if (kind.includes('BAHAN') || kind.includes('PEMAKAIAN') || kind.includes('INPUT') || kind.includes('MATERIAL')) txType = 'OUTBOUND';
        else txType = 'PRODUCTION';
        qty = Math.abs(qty);
        source = 'ACCURATE_PRODUCTION';
        base.referenceNo = base.referenceNo || clean(value(row, aliases.workOrder)) || null;
      } else if (importType === 'INVENTORY_MOVEMENT') {
        const qIn = num(value(row, aliases.qtyIn));
        const qOut = num(value(row, aliases.qtyOut));
        const kind = clean(value(row, aliases.type)).toUpperCase();
        if (qIn) { txType = 'INBOUND'; qty = Math.abs(qIn); }
        else if (qOut) { txType = 'OUTBOUND'; qty = Math.abs(qOut); }
        else if (kind.includes('MASUK') || kind.includes('INBOUND') || kind.includes('RECEIPT')) { txType = 'INBOUND'; qty = Math.abs(qty); }
        else if (kind.includes('KELUAR') || kind.includes('OUTBOUND') || kind.includes('DELIVERY')) { txType = 'OUTBOUND'; qty = Math.abs(qty); }
        else if (kind.includes('ADJUST')) { txType = 'ADJUSTMENT'; }
        else if (qty < 0) { txType = 'OUTBOUND'; qty = Math.abs(qty); }
        else { txType = 'INBOUND'; qty = Math.abs(qty); }
        source = 'ACCURATE_INVENTORY';
      }

      if (!qty) throw new Error('Qty wajib dan tidak boleh 0');
      const sourceKey = sha([importType, dt.toISOString(), code, wh.code, txType, qty, base.referenceNo || '', base.invoiceNo || '']);
      if (await prisma.transaction.findFirst({ where: { companyId: u.companyId, sourceKey } })) { skipped++; continue; }

      await prisma.transaction.create({ data: {
        companyId: u.companyId, itemId: item.id, warehouseId: wh.id, type: txType,
        qty, transactionAt: dt, partnerName, source, sourceKey, createdById: u.id, ...base,
      }});
      imported++;
    } catch (e: any) {
      errors++;
      detail.push({ row: excelRow, error: e?.message || 'Unknown error' });
    }
  }

  await prisma.importJob.create({ data: {
    companyId: u.companyId, fileName: f.name, source: 'ACCURATE_DESKTOP_EXPORT', importType,
    rowCount: rows.length, importedCount: imported, skippedCount: skipped, errorCount: errors,
    details: detail.slice(0, 200),
  }});
  await prisma.auditLog.create({ data: {
    companyId: u.companyId, userId: u.id, action: 'IMPORT', entity: importType,
    metadata: { file: f.name, importType, imported, skipped, errors },
  }});
  return Response.json({ ok: true, imported, skipped, errors, detail: detail.slice(0, 20) });
}
