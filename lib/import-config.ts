export const IMPORT_TYPES = {
  MASTER_ITEM: {
    label: 'Master Barang',
    description: 'Kode barang, nama, satuan, kategori dan data kepabeanan.',
    required: ['Kode Barang', 'Nama Barang'],
    optional: ['Satuan', 'Kategori', 'HS Code', 'Satuan Kepabeanan', 'Negara Asal'],
  },
  INVENTORY_MOVEMENT: {
    label: 'Mutasi Persediaan / Kartu Stok',
    description: 'Pergerakan persediaan untuk membentuk mutasi dan posisi stok.',
    required: ['Tanggal', 'Kode Barang', 'Gudang'],
    optional: ['Qty Masuk', 'Qty Keluar', 'Qty', 'Jenis', 'No Referensi', 'No Dokumen Bea', 'HS Code', 'Satuan'],
  },
  PURCHASE_RECEIPT: {
    label: 'Pembelian / Penerimaan Barang',
    description: 'Pemasukan fisik barang dari supplier.',
    required: ['Tanggal', 'Kode Barang', 'Qty'],
    optional: ['Supplier', 'No Faktur', 'No Penerimaan', 'Gudang', 'No Dokumen Bea', 'Jenis Dokumen Bea'],
  },
  SALES_DELIVERY: {
    label: 'Penjualan / Pengiriman Barang',
    description: 'Pengeluaran fisik barang ke customer.',
    required: ['Tanggal', 'Kode Barang', 'Qty'],
    optional: ['Customer', 'No Faktur', 'No Pengiriman', 'Gudang', 'No Dokumen Bea', 'Jenis Dokumen Bea'],
  },
  WAREHOUSE_TRANSFER: {
    label: 'Transfer Antar Gudang',
    description: 'Perpindahan internal dari gudang asal ke gudang tujuan.',
    required: ['Tanggal', 'Kode Barang', 'Qty', 'Gudang Asal', 'Gudang Tujuan'],
    optional: ['No Referensi', 'Catatan'],
  },
  ADJUSTMENT: {
    label: 'Penyesuaian Persediaan',
    description: 'Koreksi stok, barang rusak, selisih dan penyesuaian lainnya.',
    required: ['Tanggal', 'Kode Barang', 'Qty'],
    optional: ['Gudang', 'No Referensi', 'Alasan', 'Catatan'],
  },
  STOCK_OPNAME: {
    label: 'Stock Opname',
    description: 'Perbandingan stok sistem dengan stok fisik.',
    required: ['Tanggal', 'Kode Barang', 'Stok Sistem', 'Stok Fisik'],
    optional: ['Gudang', 'No Referensi', 'Catatan'],
  },
  PRODUCTION: {
    label: 'Produksi / WIP',
    description: 'Pemakaian bahan baku dan hasil produksi.',
    required: ['Tanggal', 'Kode Barang', 'Qty'],
    optional: ['Jenis', 'Gudang', 'No WO', 'No Referensi', 'Catatan'],
  },
} as const;

export type ImportTypeKey = keyof typeof IMPORT_TYPES;
