'use client';
import {useMemo,useState} from 'react';

const types=['INBOUND','OUTBOUND','TRANSFER','PRODUCTION','ADJUSTMENT'];
export default function TransactionManager({txs,items,warehouses,readOnly}:{txs:any[],items:any[],warehouses:any[],readOnly:boolean}){
  const [editing,setEditing]=useState<any|null>(null);const [msg,setMsg]=useState('');const [q,setQ]=useState('');
  const rows=useMemo(()=>txs.filter(t=>JSON.stringify([t.item.code,t.item.name,t.referenceNo,t.invoiceNo,t.partnerName,t.customsDocNo,t.source]).toLowerCase().includes(q.toLowerCase())),[txs,q]);
  async function save(e:any){e.preventDefault();const body=Object.fromEntries(new FormData(e.currentTarget).entries());body.id=editing.id;const r=await fetch('/api/transactions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});setMsg(r.ok?'Transaksi diperbarui.':'Gagal memperbarui transaksi.');if(r.ok)setTimeout(()=>location.reload(),450)}
  async function del(t:any){if(!confirm(`Hapus transaksi ${t.referenceNo||t.id}?${t.transferGroupId?' Pasangan transfer juga akan dihapus.':''}`))return;const r=await fetch('/api/transactions',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:t.id})});setMsg(r.ok?'Transaksi dihapus.':'Gagal menghapus transaksi.');if(r.ok)setTimeout(()=>location.reload(),450)}
  return <>
    <div className="row" style={{justifyContent:'space-between',marginBottom:12}}><input className="input" style={{maxWidth:420}} value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari barang, referensi, partner, dokumen..."/><div className="muted">{rows.length} transaksi</div></div>
    {msg&&<div className="notice" style={{marginBottom:12}}>{msg}</div>}
    <div className="table-wrap"><table className="table"><thead><tr><th>Tanggal</th><th>Barang</th><th>Jenis</th><th>Gudang</th><th>Qty</th><th>Referensi</th><th>Dokumen Bea</th><th>Sumber</th><th>Aksi</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{new Date(t.transactionAt).toISOString().slice(0,10)}</td><td><strong>{t.item.code}</strong><div className="muted">{t.item.name}</div></td><td>{t.type}</td><td>{t.warehouse.code}</td><td>{String(t.qty)}</td><td>{t.referenceNo||'-'}</td><td>{t.customsDocNo||'-'}</td><td><span className="pill">{t.source}</span></td><td>{readOnly?'-':<div className="row"><button className="btn secondary small" onClick={()=>setEditing(t)}>Edit</button><button className="btn danger small" onClick={()=>del(t)}>Hapus</button></div>}</td></tr>)}</tbody></table></div>
    {editing&&<div className="modal-backdrop"><div className="modal"><div className="row" style={{justifyContent:'space-between'}}><h3>Edit Transaksi</h3><button className="btn secondary" onClick={()=>setEditing(null)}>Tutup</button></div><form className="form" onSubmit={save}>
      <input className="input" name="transactionAt" type="date" defaultValue={new Date(editing.transactionAt).toISOString().slice(0,10)} required/>
      <select className="input" name="type" defaultValue={editing.type}>{types.map(x=><option key={x}>{x}</option>)}</select>
      <select className="input" name="itemId" defaultValue={editing.itemId}>{items.map(i=><option value={i.id} key={i.id}>{i.code} — {i.name}</option>)}</select>
      <select className="input" name="warehouseId" defaultValue={editing.warehouseId}>{warehouses.map(w=><option value={w.id} key={w.id}>{w.code} — {w.name}</option>)}</select>
      <input className="input" name="qty" type="number" step="0.0001" defaultValue={String(editing.qty)} required/>
      <input className="input" name="referenceNo" defaultValue={editing.referenceNo||''} placeholder="No referensi"/>
      <input className="input" name="invoiceNo" defaultValue={editing.invoiceNo||''} placeholder="No invoice"/>
      <input className="input" name="partnerName" defaultValue={editing.partnerName||''} placeholder="Pelanggan / pemasok"/>
      <div className="grid2equal"><input className="input" name="customsDocType" defaultValue={editing.customsDocType||''} placeholder="Jenis dokumen Bea"/><input className="input" name="customsDocNo" defaultValue={editing.customsDocNo||''} placeholder="No dokumen Bea"/></div>
      <input className="input" name="customsDocDate" type="date" defaultValue={editing.customsDocDate?new Date(editing.customsDocDate).toISOString().slice(0,10):''}/>
      <textarea className="input" name="notes" defaultValue={editing.notes||''} placeholder="Catatan" rows={3}/>
      <button className="btn">Simpan Perubahan</button>
    </form></div></div>}
  </>
}
