# BeaBridge

**Jembatan Data untuk Pelaporan Kepabeanan**

BeaBridge adalah web app pendamping Accurate Desktop untuk mengolah data inventory/transaksi menjadi data yang lebih mudah ditelusuri, direkonsiliasi, dan disiapkan untuk kebutuhan pelaporan/review kepabeanan.

## Fitur utama

- Login + role: ADMIN, OPERATOR, SUPERVISOR, CUSTOMS, AUDITOR
- Input transaksi manual
- Import Excel/CSV hasil export Accurate Desktop
- 8 jenis import: Master Barang, Mutasi Persediaan, Penerimaan/Pembelian, Pengiriman/Penjualan, Transfer Gudang, Adjustment, Stock Opname, Produksi/WIP
- Auto mapping berdasarkan variasi header umum Accurate/Excel
- Anti-duplikasi import
- Master barang dan gudang otomatis
- Penyimpanan HS Code, satuan kepabeanan, negara asal, invoice, partner, dokumen kepabeanan, lot/batch
- Transfer gudang dibuat sebagai pasangan OUTBOUND + INBOUND agar saldo per gudang tetap benar
- Stock opname disimpan terpisah beserta selisih fisik vs sistem
- Dashboard transaksi
- Laporan mutasi / posisi stok
- Export CSV
- Audit trail
- Workflow periode DRAFT → VALIDATED → RECONCILED → FINAL → PUBLISHED
- Manajemen user dan reviewer read-only
- PostgreSQL + Prisma
- Siap deploy ke Railway

## 1. Jalankan lokal

```bash
cp .env.example .env
npm install
npx prisma db push
node scripts/bootstrap.mjs
npm run dev
```

Buka `http://localhost:3000`.

Login awal mengikuti `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `.env`.

## 2. Deploy ke GitHub + Railway

1. Buat repository GitHub baru.
2. Upload seluruh isi folder ini ke repo (bukan folder induknya).
3. Railway: **New Project → Deploy from GitHub Repo**.
4. Tambahkan service **PostgreSQL**.
5. Pastikan `DATABASE_URL` tersedia pada service BeaBridge.
6. Tambahkan variable:
   - `SESSION_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `COMPANY_NAME`
7. Railway membaca `railway.json`.
8. Generate domain melalui Settings → Networking.

## 3. Pola data Accurate → BeaBridge

Di menu **Import Accurate**, user memilih jenis data lalu upload `.xlsx`, `.xls`, atau `.csv` hasil export Accurate Desktop.

Jenis import yang tersedia:

1. **Master Barang** — master kode/nama/satuan/kategori + atribut kepabeanan.
2. **Mutasi Persediaan / Kartu Stok** — qty masuk/keluar per item dan gudang.
3. **Pembelian / Penerimaan Barang** — otomatis menjadi INBOUND.
4. **Penjualan / Pengiriman Barang** — otomatis menjadi OUTBOUND.
5. **Transfer Antar Gudang** — otomatis menjadi OUTBOUND gudang asal + INBOUND gudang tujuan.
6. **Adjustment** — menyimpan koreksi persediaan dengan qty bertanda positif/negatif.
7. **Stock Opname** — menyimpan stok sistem, stok fisik, dan selisih.
8. **Produksi / WIP** — `Pemakaian Bahan` menjadi OUTBOUND, `Hasil Produksi` menjadi INBOUND.

BeaBridge menyediakan tombol **Download Template CSV** untuk tiap jenis import. Contoh file juga tersedia pada folder `examples/`.

## 4. Header yang dikenali

Importer menerima beberapa alias, contoh:

- Kode Barang / Item No / No Barang / Item Code
- Nama Barang / Item Name / Description
- Tanggal / Date / Transaction Date
- Qty / Kuantitas / Quantity
- Qty Masuk / Masuk / In Qty
- Qty Keluar / Keluar / Out Qty
- Gudang / Warehouse / Kode Gudang
- Gudang Asal / From Warehouse
- Gudang Tujuan / To Warehouse
- No Faktur / Invoice No
- Supplier / Vendor / Pemasok
- Customer / Pelanggan
- No Dokumen Bea / Customs Document No
- Jenis Dokumen Bea / Customs Doc Type
- Stok Sistem / Book Qty
- Stok Fisik / Physical Qty

## 5. Prinsip pemakaian

Accurate tetap menjadi sistem accounting/transaksi perusahaan. BeaBridge menjadi lapisan khusus untuk:

`Accurate Desktop → Export Excel/CSV → BeaBridge → Validasi/Traceability → Laporan & Review Kepabeanan`

Data yang tidak tersedia di Accurate dapat dilengkapi di BeaBridge, misalnya HS Code, nomor/jenis dokumen kepabeanan, alasan adjustment, dan catatan audit.

## 6. Catatan sebelum production

BeaBridge ini adalah fondasi/MVP dan bukan sistem resmi DJBC. Sebelum dipakai produksi, lakukan validasi proses terhadap fasilitas/perizinan perusahaan dan ketentuan kepabeanan yang berlaku. Tambahkan hardening keamanan, backup, 2FA/SSO bila dibutuhkan, attachment dokumen, penguncian periode/revisi, dan pengujian format laporan final.

## Logo

Logo tersedia di `public/beabridge-logo.png`.
