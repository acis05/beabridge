'use client';
import { useMemo, useState } from 'react';

const TYPES = [
  ['MASTER_ITEM','Master Barang','Kode barang, nama, satuan, kategori, HS Code.'],
  ['INVENTORY_MOVEMENT','Mutasi Persediaan / Kartu Stok','Pergerakan masuk-keluar dan saldo persediaan.'],
  ['PURCHASE_RECEIPT','Pembelian / Penerimaan Barang','Pemasukan fisik barang dari supplier.'],
  ['SALES_DELIVERY','Penjualan / Pengiriman Barang','Pengeluaran fisik barang ke customer.'],
  ['WAREHOUSE_TRANSFER','Transfer Antar Gudang','Mutasi internal gudang asal ke gudang tujuan.'],
  ['ADJUSTMENT','Penyesuaian Persediaan','Koreksi stok, selisih, rusak, atau adjustment lain.'],
  ['STOCK_OPNAME','Stock Opname','Perbandingan stok sistem dengan stok fisik.'],
  ['PRODUCTION','Produksi / WIP','Pemakaian bahan dan hasil produksi.'],
] as const;

export default function ImportForm(){
  const [msg,setMsg]=useState('');
  const [details,setDetails]=useState<{row:number,error:string}[]>([]);
  const [loading,setLoading]=useState(false);
  const [type,setType]=useState('INVENTORY_MOVEMENT');
  const selected=useMemo(()=>TYPES.find(x=>x[0]===type),[type]);

  async function submit(e:any){
    e.preventDefault();setLoading(true);setMsg('');setDetails([]);
    const fd=new FormData(e.currentTarget);
    const r=await fetch('/api/imports',{method:'POST',body:fd});
    const d=await r.json();setLoading(false);
    if(r.ok){
      setMsg(`Selesai: ${d.imported} diproses, ${d.skipped} duplikat/dilewati, ${d.errors} error.`);
      setDetails(d.detail||[]);
      setTimeout(()=>location.reload(),1800);
    } else setMsg(d.error||'Import gagal');
  }

  return <form className="form" onSubmit={submit}>
    <h3 style={{margin:0}}>Import dari Accurate Desktop</h3>
    <label><div className="field-label">Jenis data</div>
      <select className="input" name="importType" value={type} onChange={e=>setType(e.target.value)}>
        {TYPES.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}
      </select>
    </label>
    <div className="notice"><strong>{selected?.[1]}</strong><br/>{selected?.[2]}</div>
    <label><div className="field-label">File export Accurate</div>
      <input className="input" type="file" name="file" accept=".xlsx,.xls,.csv" required/>
    </label>
    <div className="row">
      <button className="btn" disabled={loading}>{loading?'Mengimpor...':'Import File'}</button>
      <a className="btn secondary" href={`/api/imports/template?type=${type}`}>Download Template CSV</a>
    </div>
    <div className="muted">BeaBridge mengenali beberapa variasi nama header Accurate/Excel dan melakukan pencegahan duplikasi otomatis.</div>
    {msg&&<div className="notice">{msg}</div>}
    {details.length>0&&<div className="notice error"><strong>Contoh error:</strong>{details.slice(0,5).map(x=><div key={x.row}>Baris {x.row}: {x.error}</div>)}</div>}
  </form>
}
