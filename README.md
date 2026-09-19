# BeaBridge v0.3

**Jembatan Data untuk Pelaporan Kepabeanan**

BeaBridge adalah web app pendamping Accurate Desktop untuk mengolah data inventory/transaksi menjadi data yang lebih mudah ditelusuri, direkonsiliasi, dan disiapkan untuk kebutuhan pelaporan/review kepabeanan.

## Update v0.3

- **Daftar Transaksi**: pencarian, tambah manual, edit dan hapus transaksi. Hapus transaksi transfer ikut menghapus pasangan transfer agar saldo tidak timpang.
- **Master Data**: daftar Barang, Pelanggan dan Pemasok; tambah, edit dan hapus. Pemasok/pelanggan dari import pembelian/penjualan Accurate otomatis dibuat sebagai master.
- **Periode Laporan**: buat, edit tahun/bulan, lanjut status, dan hapus. Penghapusan periode PUBLISHED dibatasi ke ADMIN.
- **7 Laporan Bea Cukai**: menu laporan terpisah, filter periode, tampilan tabel dan export CSV.
- Semua create/update/delete dicatat dalam **Audit Trail**.

## 7 report view BeaBridge

1. Pemasukan Barang per Dokumen Pabean
2. Pengeluaran Barang per Dokumen Pabean
3. Mutasi Bahan Baku & Bahan Penolong
4. Posisi Barang Dalam Proses (WIP)
5. Mutasi Hasil Produksi / Barang Jadi
6. Mutasi Barang Modal
7. Mutasi Sisa / Scrap Produksi

> Agar laporan mutasi tampil benar, isi **Kategori** pada Master Barang. BeaBridge v0.3 menyediakan kategori `BAHAN_BAKU`, `BAHAN_PENOLONG`, `WIP`, `HASIL_PRODUKSI`, `BARANG_MODAL`, `SCRAP`, dan `LAINNYA`.

## Fitur dasar

- Login + role: ADMIN, OPERATOR, SUPERVISOR, CUSTOMS, AUDITOR
- Import Excel/CSV hasil export Accurate Desktop
- 8 jenis import: Master Barang, Mutasi Persediaan, Penerimaan/Pembelian, Pengiriman/Penjualan, Transfer Gudang, Adjustment, Stock Opname, Produksi/WIP
- Anti-duplikasi import
- Penyimpanan HS Code, satuan kepabeanan, negara asal, invoice, partner, dokumen kepabeanan, lot/batch
- Transfer gudang sebagai pasangan OUTBOUND + INBOUND
- Stock opname beserta selisih fisik vs sistem
- Workflow periode DRAFT → VALIDATED → RECONCILED → FINAL → PUBLISHED
- PostgreSQL + Prisma
- Konfigurasi Railway sudah tersedia

## Jalankan lokal

```bash
cp .env.example .env
npm install
npx prisma db push
node scripts/bootstrap.mjs
npm run dev
```

## Deploy Railway

1. Push seluruh isi folder ini ke root repository GitHub.
2. Railway → **New Project → Deploy from GitHub Repo**.
3. Tambahkan **PostgreSQL**.
4. Pada service BeaBridge, isi variable:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=ganti-dengan-random-string-panjang
ADMIN_EMAIL=admin@beabridge.id
ADMIN_PASSWORD=PasswordTest123!
COMPANY_NAME=PT Demo BeaBridge
```

5. `railway.json` menjalankan `npm install && npm run build` saat build dan `npm run start:railway` saat start.
6. `start:railway` akan menjalankan `prisma db push`, bootstrap admin, lalu `next start`.
7. Generate public domain di Railway → Settings → Networking.

## Import Accurate Desktop

Pola utama:

`Accurate Desktop → Export Excel/CSV → BeaBridge → Mapping/Validasi → Master & Transaksi → 7 Laporan → Customs Review`

Jenis import:

1. Master Barang
2. Mutasi Persediaan / Kartu Stok
3. Pembelian / Penerimaan Barang
4. Penjualan / Pengiriman Barang
5. Transfer Antar Gudang
6. Adjustment
7. Stock Opname
8. Produksi / WIP

Contoh file tersedia di folder `examples/`.

## Catatan production

BeaBridge adalah MVP dan bukan sistem resmi DJBC. Sebelum production, validasi struktur laporan sesuai fasilitas/perizinan perusahaan dan ketentuan terbaru yang berlaku. Disarankan menambahkan backup, attachment dokumen, 2FA/SSO, approval revisi, serta penguncian transaksi per periode final/published sesuai SOP perusahaan.
